import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';

const USER_POPULATE = 'firstName lastName email avatar';
const PROJECT_POPULATE = [
  { path: 'owner', select: USER_POPULATE },
  { path: 'members', select: USER_POPULATE },
  { path: 'createdBy', select: USER_POPULATE },
  { path: 'team', select: 'name status' },
];

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
  const project = await Project.findById(req.params.id).populate(PROJECT_POPULATE);

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

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

  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

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
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  const memberIndex = project.members.findIndex((m) => m.toString() === req.params.userId);
  if (memberIndex === -1) {
    throw new AppError('This user is not a member of the project.', 404);
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  res.status(200).json(new ApiResponse(200, 'Member removed successfully.'));
});
