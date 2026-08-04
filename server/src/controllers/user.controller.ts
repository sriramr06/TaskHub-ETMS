import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';
import { uploadBufferToCloudinary } from '@/utils/cloudinaryUpload';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { role, status, search } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, 'Users fetched successfully.', {
      users,
      pagination: buildPaginationMeta(total, page, limit),
    }),
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'User fetched successfully.', { user }));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, middleName, lastName, phone, role, status } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { firstName, middleName, lastName, phone, role, status },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'User updated successfully.', { user }));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user?.id) {
    throw new AppError('You cannot delete your own account.', 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  await Employee.findOneAndDelete({ user: user.id });

  res.status(200).json(new ApiResponse(200, 'User deleted successfully.'));
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, middleName, lastName, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { firstName, middleName, lastName, phone },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Profile updated successfully.', { user }));
});

export const updateMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, `users/${req.user?.id}/avatar`);

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    { avatar: result.secure_url },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Avatar updated successfully.', { user }));
});
