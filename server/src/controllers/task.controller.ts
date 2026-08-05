import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import { Task, ITask } from '@/models/Task';
import { UserRole } from '@/constants/enums/user';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '@/utils/cloudinaryUpload';
import { isPrivilegedRole } from '@/utils/scope';

const USER_POPULATE = 'firstName lastName email avatar';
const TASK_POPULATE = [
  { path: 'assignees', select: USER_POPULATE },
  { path: 'reporter', select: USER_POPULATE },
  { path: 'createdBy', select: USER_POPULATE },
  { path: 'comments.user', select: USER_POPULATE },
  { path: 'attachments.uploadedBy', select: USER_POPULATE },
  { path: 'project', select: 'name status' },
];

const assertUsersExist = async (userIds: string[], message: string): Promise<void> => {
  const found = await User.countDocuments({ _id: { $in: userIds } });
  if (found !== new Set(userIds).size) {
    throw new AppError(message, 404);
  }
};

const assertTasksExist = async (taskIds: string[], message: string): Promise<void> => {
  const found = await Task.countDocuments({ _id: { $in: taskIds } });
  if (found !== new Set(taskIds).size) {
    throw new AppError(message, 404);
  }
};

// Assigning a task to someone with no connection to its project doesn't make
// sense — they'd show up as a task owner on a project they can't even see.
const assertAssigneesInProject = async (projectId: string, userIds: string[]): Promise<void> => {
  const project = await Project.findById(projectId).select('owner members');
  if (!project) {
    throw new AppError('The specified project does not exist.', 404);
  }

  const eligible = new Set([project.owner.toString(), ...project.members.map((m) => m.toString())]);
  const ineligible = userIds.filter((id) => !eligible.has(id));
  if (ineligible.length) {
    throw new AppError('Assignees must be members of the project this task belongs to.', 400);
  }
};

// A non-privileged user (TEAMLEAD/MEMBER/GUEST) can only reach a task they're
// assigned to, reported, created, or that belongs to a project they're on —
// even though their role grants task:read/edit/assign in general.
const canAccessTask = async (userId: string, task: ITask): Promise<boolean> => {
  if (task.assignees.some((a) => a.toString() === userId)) return true;
  if (task.reporter.toString() === userId) return true;
  if (task.createdBy.toString() === userId) return true;

  const project = await Project.exists({
    _id: task.project,
    $or: [{ owner: userId }, { members: userId }],
  });
  return !!project;
};

const loadTaskWithAccess = async (
  req: Request,
  taskId: string | undefined,
  deniedMessage: string,
): Promise<InstanceType<typeof Task>> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  if (!isPrivilegedRole(req.user!.role) && !(await canAccessTask(req.user!.id, task))) {
    throw new AppError(deniedMessage, 403);
  }

  return task;
};

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    project,
    priority,
    labels,
    assignees,
    startDate,
    dueDate,
    estimatedHours,
    dependencies,
  } = req.body as {
    title: string;
    description?: string;
    project: string;
    priority?: string;
    labels?: string[];
    assignees?: string[];
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    dependencies?: string[];
  };

  const projectExists = await Project.exists({ _id: project });
  if (!projectExists) {
    throw new AppError('The specified project does not exist.', 404);
  }

  if (!isPrivilegedRole(req.user!.role)) {
    const projectAccessible = await Project.exists({
      _id: project,
      $or: [{ owner: req.user!.id }, { members: req.user!.id }],
    });
    if (!projectAccessible) {
      throw new AppError('You do not have permission to create tasks in this project.', 403);
    }
  }

  if (assignees?.length) {
    await assertUsersExist(assignees, 'One or more assignees do not exist.');
    await assertAssigneesInProject(project, assignees);
  }

  if (dependencies?.length) {
    await assertTasksExist(dependencies, 'One or more dependency tasks do not exist.');
  }

  const task = await Task.create({
    title,
    description,
    project,
    priority,
    labels,
    assignees: assignees ?? [],
    dependencies: dependencies ?? [],
    startDate,
    dueDate,
    estimatedHours,
    reporter: req.user?.id,
    createdBy: req.user?.id,
  });

  await task.populate(TASK_POPULATE);

  res.status(201).json(new ApiResponse(201, 'Task created successfully.', { task }));
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { project, status, priority, label, assignee, search } = req.query as Record<
    string,
    string | undefined
  >;

  const filter: Record<string, unknown> = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (label) filter.labels = label;
  if (assignee) filter.assignees = assignee;
  if (search) filter.title = { $regex: search, $options: 'i' };

  if (!isPrivilegedRole(req.user!.role)) {
    const myProjectIds = await Project.find({
      $or: [{ owner: req.user!.id }, { members: req.user!.id }],
    }).distinct('_id');

    filter.$or = [
      { assignees: req.user!.id },
      { reporter: req.user!.id },
      { createdBy: req.user!.id },
      { project: { $in: myProjectIds } },
    ];
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate(TASK_POPULATE)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, 'Tasks fetched successfully.', {
      tasks,
      pagination: buildPaginationMeta(total, page, limit),
    }),
  );
});

export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await Task.find({
    $or: [{ assignees: req.user?.id }, { reporter: req.user?.id }],
  })
    .populate(TASK_POPULATE)
    .sort({ dueDate: 1 });

  res.status(200).json(new ApiResponse(200, 'Your tasks fetched successfully.', { tasks }));
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const found = await loadTaskWithAccess(
    req,
    req.params.id,
    'You do not have access to this task.',
  );
  const task = await found.populate(TASK_POPULATE);

  res.status(200).json(new ApiResponse(200, 'Task fetched successfully.', { task }));
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    status,
    priority,
    labels,
    startDate,
    dueDate,
    estimatedHours,
    actualHours,
    dependencies,
    order,
  } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    labels?: string[];
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    dependencies?: string[];
    order?: number;
  };

  if (dependencies?.length) {
    await assertTasksExist(dependencies, 'One or more dependency tasks do not exist.');
  }

  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to edit this task.');

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      status,
      priority,
      labels,
      startDate,
      dueDate,
      estimatedHours,
      actualHours,
      dependencies,
      order,
    },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Task updated successfully.', { task }));
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  await Promise.all(
    task.attachments.map((attachment) =>
      deleteFromCloudinary(attachment.publicId).catch(() => undefined),
    ),
  );

  res.status(200).json(new ApiResponse(200, 'Task deleted successfully.'));
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const { assignees } = req.body as { assignees: string[] };

  await assertUsersExist(assignees, 'One or more assignees do not exist.');
  const existingTask = await loadTaskWithAccess(
    req,
    req.params.id,
    'You do not have permission to assign this task.',
  );
  await assertAssigneesInProject(existingTask.project.toString(), assignees);

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { assignees },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Task assignees updated successfully.', { task }));
});

export const addChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;

  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to edit this task.');

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { checklist: { title, completed: false } } },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  res.status(201).json(new ApiResponse(201, 'Checklist item added successfully.', { task }));
});

export const updateChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  const { title, completed } = req.body as { title?: string; completed?: boolean };

  const setFields: Record<string, unknown> = {};
  if (title !== undefined) setFields['checklist.$[item].title'] = title;
  if (completed !== undefined) setFields['checklist.$[item].completed'] = completed;

  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to edit this task.');

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, 'checklist._id': req.params.itemId },
    { $set: setFields },
    { new: true, runValidators: true, arrayFilters: [{ 'item._id': req.params.itemId }] },
  ).populate(TASK_POPULATE);

  if (!task) {
    throw new AppError('Task or checklist item not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Checklist item updated successfully.', { task }));
});

export const removeChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to edit this task.');

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, 'checklist._id': req.params.itemId },
    { $pull: { checklist: { _id: req.params.itemId } } },
    { new: true },
  );

  if (!task) {
    throw new AppError('Task or checklist item not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Checklist item removed successfully.'));
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;

  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to comment on this task.');

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { user: req.user?.id, text, createdAt: new Date() } } },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  res.status(201).json(new ApiResponse(201, 'Comment added successfully.', { task }));
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;

  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to comment on this task.');

  const existing = await Task.findOne(
    { _id: req.params.id, 'comments._id': req.params.commentId },
    { comments: { $elemMatch: { _id: req.params.commentId } } },
  );

  if (!existing || existing.comments.length === 0) {
    throw new AppError('Task or comment not found.', 404);
  }

  if (existing.comments[0]?.user.toString() !== req.user?.id) {
    throw new AppError('You can only edit your own comments.', 403);
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, 'comments._id': req.params.commentId },
    { $set: { 'comments.$.text': text } },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  res.status(200).json(new ApiResponse(200, 'Comment updated successfully.', { task }));
});

export const removeComment = asyncHandler(async (req: Request, res: Response) => {
  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to comment on this task.');

  const task = await Task.findOne(
    { _id: req.params.id, 'comments._id': req.params.commentId },
    { comments: { $elemMatch: { _id: req.params.commentId } } },
  );

  if (!task || task.comments.length === 0) {
    throw new AppError('Task or comment not found.', 404);
  }

  const comment = task.comments[0];
  const isOwner = comment?.user.toString() === req.user?.id;
  const isAdmin = req.user?.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to delete this comment.', 403);
  }

  await Task.findByIdAndUpdate(req.params.id, {
    $pull: { comments: { _id: req.params.commentId } },
  });

  res.status(200).json(new ApiResponse(200, 'Comment removed successfully.'));
});

export const addTaskAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }

  const task = await loadTaskWithAccess(
    req,
    req.params.id,
    'You do not have permission to edit this task.',
  );

  const result = await uploadBufferToCloudinary(req.file.buffer, `tasks/${task.id}/attachments`);

  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        attachments: {
          url: result.secure_url,
          publicId: result.public_id,
          name: req.file.originalname,
          uploadedBy: req.user?.id,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  ).populate(TASK_POPULATE);

  res
    .status(201)
    .json(new ApiResponse(201, 'Attachment uploaded successfully.', { task: updated }));
});

export const removeTaskAttachment = asyncHandler(async (req: Request, res: Response) => {
  await loadTaskWithAccess(req, req.params.id, 'You do not have permission to edit this task.');

  const task = await Task.findOne(
    { _id: req.params.id, 'attachments._id': req.params.attachmentId },
    { attachments: { $elemMatch: { _id: req.params.attachmentId } } },
  );

  if (!task || task.attachments.length === 0) {
    throw new AppError('Task or attachment not found.', 404);
  }

  const attachment = task.attachments[0];

  await Task.findByIdAndUpdate(req.params.id, {
    $pull: { attachments: { _id: req.params.attachmentId } },
  });

  if (attachment) {
    await deleteFromCloudinary(attachment.publicId).catch(() => undefined);
  }

  res.status(200).json(new ApiResponse(200, 'Attachment removed successfully.'));
});
