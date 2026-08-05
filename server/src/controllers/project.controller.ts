import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project, IProject } from '@/models/Project';
import { Task } from '@/models/Task';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';
import { isPrivilegedRole } from '@/utils/scope';

const USER_POPULATE = 'firstName lastName email avatar';
const PROJECT_POPULATE = [
  { path: 'owner', select: USER_POPULATE },
  { path: 'members', select: USER_POPULATE },
  { path: 'createdBy', select: USER_POPULATE },
  { path: 'team', select: 'name status' },
];

// TEAMLEAD is the only non-privileged role that can reach PROJECT_EDIT — and
// only for projects they're actually on (owner or member), not every project
// in the system. ADMIN/MANAGER are org-wide oversight roles and bypass this.
const canAccessProject = (userId: string, project: IProject): boolean =>
  project.owner.toString() === userId || project.members.some((m) => m.toString() === userId);

const loadProjectWithAccess = async (
  req: Request,
  projectId: string | undefined,
  deniedMessage: string,
): Promise<InstanceType<typeof Project>> => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  if (!isPrivilegedRole(req.user!.role) && !canAccessProject(req.user!.id, project)) {
    throw new AppError(deniedMessage, 403);
  }

  return project;
};

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, priority, team, members, startDate, deadline, tags } = req.body as {
    name: string;
    description?: string;
    priority?: string;
    team?: string;
    members?: string[];
    startDate?: Date;
    deadline?: Date;
    tags?: string[];
  };

  if (team) {
    const teamExists = await Team.exists({ _id: team });
    if (!teamExists) {
      throw new AppError('The specified team does not exist.', 404);
    }
  }

  if (members?.length) {
    const foundMembers = await User.countDocuments({ _id: { $in: members } });
    if (foundMembers !== new Set(members).size) {
      throw new AppError('One or more referenced members do not exist.', 404);
    }
  }

  const project = await Project.create({
    name,
    description,
    priority,
    team,
    members: members ?? [],
    startDate,
    deadline,
    tags,
    owner: req.user?.id,
    createdBy: req.user?.id,
  });

  await project.populate(PROJECT_POPULATE);

  res.status(201).json(new ApiResponse(201, 'Project created successfully.', { project }));
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status, priority, team, isArchived, search } = req.query as Record<
    string,
    string | undefined
  >;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (team) filter.team = team;
  if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
  if (search) filter.name = { $regex: search, $options: 'i' };

  if (!isPrivilegedRole(req.user!.role)) {
    filter.$or = [{ owner: req.user!.id }, { members: req.user!.id }];
  }

  const [projects, total] = await Promise.all([
    Project.find(filter).populate(PROJECT_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, 'Projects fetched successfully.', {
      projects,
      pagination: buildPaginationMeta(total, page, limit),
    }),
  );
});

export const getMyProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await Project.find({
    $or: [{ owner: req.user?.id }, { members: req.user?.id }],
  })
    .populate(PROJECT_POPULATE)
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, 'Your projects fetched successfully.', { projects }));
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const found = await loadProjectWithAccess(
    req,
    req.params.id,
    'You do not have access to this project.',
  );
  const project = await found.populate(PROJECT_POPULATE);

  res.status(200).json(new ApiResponse(200, 'Project fetched successfully.', { project }));
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    status,
    priority,
    team,
    startDate,
    deadline,
    tags,
    progress,
    isArchived,
  } = req.body;

  if (team) {
    const teamExists = await Team.exists({ _id: team });
    if (!teamExists) {
      throw new AppError('The specified team does not exist.', 404);
    }
  }

  await loadProjectWithAccess(
    req,
    req.params.id,
    'You do not have permission to edit this project.',
  );

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { name, description, status, priority, team, startDate, deadline, tags, progress, isArchived },
    { new: true, runValidators: true },
  ).populate(PROJECT_POPULATE);

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Project updated successfully.', { project }));
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  await Task.deleteMany({ project: project.id });

  res.status(200).json(new ApiResponse(200, 'Project deleted successfully.'));
});

export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req.body;

  const userExists = await User.exists({ _id: user });
  if (!userExists) {
    throw new AppError('The specified user does not exist.', 404);
  }

  const project = await loadProjectWithAccess(
    req,
    req.params.id,
    'You do not have permission to edit this project.',
  );

  const alreadyMember = project.members.some((m) => m.toString() === user);
  if (alreadyMember) {
    throw new AppError('This user is already a member of the project.', 409);
  }

  project.members.push(user);
  await project.save();
  await project.populate(PROJECT_POPULATE);

  res.status(200).json(new ApiResponse(200, 'Member added successfully.', { project }));
});

export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const project = await loadProjectWithAccess(
    req,
    req.params.id,
    'You do not have permission to edit this project.',
  );

  const memberIndex = project.members.findIndex((m) => m.toString() === req.params.userId);
  if (memberIndex === -1) {
    throw new AppError('This user is not a member of the project.', 404);
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  res.status(200).json(new ApiResponse(200, 'Member removed successfully.'));
});
