import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';

const TEAM_LEAD_POPULATE = 'firstName lastName email avatar';
const MEMBER_POPULATE = { path: 'members.user', select: TEAM_LEAD_POPULATE };

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, teamLead, members } = req.body as {
    name: string;
    description?: string;
    teamLead: string;
    members?: { user: string; role?: string }[];
  };

  const existing = await Team.findOne({ name });
  if (existing) {
    throw new AppError('A team with this name already exists.', 409);
  }

  const memberUserIds = [teamLead, ...(members ?? []).map((m) => m.user)];
  const foundUsers = await User.countDocuments({ _id: { $in: memberUserIds } });
  if (foundUsers !== new Set(memberUserIds).size) {
    throw new AppError('One or more referenced users do not exist.', 404);
  }

  const team = await Team.create({
    name,
    description,
    teamLead,
    members: members ?? [],
    createdBy: req.user?.id,
  });

  await team.populate([{ path: 'teamLead', select: TEAM_LEAD_POPULATE }, MEMBER_POPULATE]);

  res.status(201).json(new ApiResponse(201, 'Team created successfully.', { team }));
});

export const getTeams = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status, search } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [teams, total] = await Promise.all([
    Team.find(filter)
      .populate('teamLead', TEAM_LEAD_POPULATE)
      .populate(MEMBER_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Team.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, 'Teams fetched successfully.', {
      teams,
      pagination: buildPaginationMeta(total, page, limit),
    }),
  );
});

export const getMyTeams = asyncHandler(async (req: Request, res: Response) => {
  const teams = await Team.find({
    $or: [{ teamLead: req.user?.id }, { 'members.user': req.user?.id }],
  })
    .populate('teamLead', TEAM_LEAD_POPULATE)
    .populate(MEMBER_POPULATE)
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, 'Your teams fetched successfully.', { teams }));
});

export const getTeamById = asyncHandler(async (req: Request, res: Response) => {
  const team = await Team.findById(req.params.id)
    .populate('teamLead', TEAM_LEAD_POPULATE)
    .populate(MEMBER_POPULATE);

  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Team fetched successfully.', { team }));
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, teamLead, status } = req.body;

  if (teamLead) {
    const teamLeadExists = await User.exists({ _id: teamLead });
    if (!teamLeadExists) {
      throw new AppError('The specified team lead does not exist.', 404);
    }
  }

  if (name) {
    const duplicate = await Team.findOne({ name, _id: { $ne: req.params.id } });
    if (duplicate) {
      throw new AppError('A team with this name already exists.', 409);
    }
  }

  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { name, description, teamLead, status },
    { new: true, runValidators: true },
  )
    .populate('teamLead', TEAM_LEAD_POPULATE)
    .populate(MEMBER_POPULATE);

  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Team updated successfully.', { team }));
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await Team.findByIdAndDelete(req.params.id);

  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Team deleted successfully.'));
});

export const addTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { user, role } = req.body;

  const userExists = await User.exists({ _id: user });
  if (!userExists) {
    throw new AppError('The specified user does not exist.', 404);
  }

  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  const alreadyMember = team.members.some((m) => m.user.toString() === user);
  if (alreadyMember) {
    throw new AppError('This user is already a member of the team.', 409);
  }

  team.members.push({ user, role, joinedAt: new Date() });
  await team.save();
  await team.populate([{ path: 'teamLead', select: TEAM_LEAD_POPULATE }, MEMBER_POPULATE]);

  res.status(200).json(new ApiResponse(200, 'Member added successfully.', { team }));
});

export const updateTeamMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  const member = team.members.find((m) => m.user.toString() === req.params.userId);
  if (!member) {
    throw new AppError('This user is not a member of the team.', 404);
  }

  member.role = role;
  await team.save();
  await team.populate([{ path: 'teamLead', select: TEAM_LEAD_POPULATE }, MEMBER_POPULATE]);

  res.status(200).json(new ApiResponse(200, 'Member role updated successfully.', { team }));
});

export const removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found.', 404);
  }

  const memberIndex = team.members.findIndex((m) => m.user.toString() === req.params.userId);
  if (memberIndex === -1) {
    throw new AppError('This user is not a member of the team.', 404);
  }

  team.members.splice(memberIndex, 1);
  await team.save();

  res.status(200).json(new ApiResponse(200, 'Member removed successfully.'));
});
