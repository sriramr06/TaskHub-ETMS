import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { UserStatus } from '@/constants/enums/user';
import { parsePagination, buildPaginationMeta } from '@/utils/pagination';

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const {
    email,
    password,
    firstName,
    middleName,
    lastName,
    phone,
    role,
    department,
    designation,
    employmentType,
    employmentStatus,
    reportingManager,
    joiningDate,
    dateOfBirth,
    address,
    emergencyContact,
    skills,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    email,
    password,
    firstName,
    middleName,
    lastName,
    phone,
    role,
    status: UserStatus.ACTIVE,
    metadata: { createdBy: req.user?.id },
  });

  let employee;
  try {
    employee = await Employee.create({
      user: user.id,
      department,
      designation,
      employmentType,
      employmentStatus,
      reportingManager,
      joiningDate,
      dateOfBirth,
      address,
      emergencyContact,
      skills,
    });
  } catch (error) {
    await User.findByIdAndDelete(user.id);
    throw error;
  }

  await employee.populate('user', '-password');

  res.status(201).json(new ApiResponse(201, 'Employee created successfully.', { employee }));
});

export const linkEmployee = asyncHandler(async (req: Request, res: Response) => {
  const {
    user: userId,
    department,
    designation,
    employmentType,
    employmentStatus,
    reportingManager,
    joiningDate,
    dateOfBirth,
    address,
    emergencyContact,
    skills,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const existingEmployee = await Employee.exists({ user: userId });
  if (existingEmployee) {
    throw new AppError('This user already has an employee record.', 409);
  }

  const employee = await Employee.create({
    user: userId,
    department,
    designation,
    employmentType,
    employmentStatus,
    reportingManager,
    joiningDate,
    dateOfBirth,
    address,
    emergencyContact,
    skills,
  });

  await employee.populate('user', '-password');

  res.status(201).json(new ApiResponse(201, 'Employee record created successfully.', { employee }));
});

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { department, employmentStatus, search } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (employmentStatus) filter.employmentStatus = employmentStatus;

  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    filter.user = { $in: matchingUsers.map((u) => u._id) };
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('user', '-password')
      .populate('reportingManager', 'employeeId designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, 'Employees fetched successfully.', {
      employees,
      pagination: buildPaginationMeta(total, page, limit),
    }),
  );
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findOne({ user: req.user?.id })
    .populate('user', '-password')
    .populate('reportingManager', 'employeeId designation');

  if (!employee) {
    throw new AppError('Employee profile not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Profile fetched successfully.', { employee }));
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findById(req.params.id)
    .populate('user', '-password')
    .populate('reportingManager', 'employeeId designation');

  if (!employee) {
    throw new AppError('Employee not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Employee fetched successfully.', { employee }));
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const {
    department,
    designation,
    employmentType,
    employmentStatus,
    reportingManager,
    joiningDate,
    dateOfBirth,
    address,
    emergencyContact,
    skills,
  } = req.body;

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    {
      department,
      designation,
      employmentType,
      employmentStatus,
      reportingManager,
      joiningDate,
      dateOfBirth,
      address,
      emergencyContact,
      skills,
    },
    { new: true, runValidators: true },
  )
    .populate('user', '-password')
    .populate('reportingManager', 'employeeId designation');

  if (!employee) {
    throw new AppError('Employee not found.', 404);
  }

  res.status(200).json(new ApiResponse(200, 'Employee updated successfully.', { employee }));
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    throw new AppError('Employee not found.', 404);
  }

  await Employee.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(employee.user, { status: UserStatus.INACTIVE });

  res.status(200).json(new ApiResponse(200, 'Employee deleted successfully.'));
});
