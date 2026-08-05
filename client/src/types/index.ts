import type {
  UserRole,
  UserStatus,
  EmploymentType,
  EmploymentStatus,
  TeamRole,
  TeamStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskLabel,
  Permission,
} from '@/lib/constants';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  /** Computed server-side from `role`; this is the source of truth for UI permission checks. */
  permissions: Permission[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

export interface Employee {
  _id: string;
  user: UserRef;
  employeeId: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  reportingManager?: { _id: string; employeeId: string; designation: string };
  joiningDate: string;
  dateOfBirth?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  emergencyContact?: { name: string; relation: string; phone: string };
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  user: UserRef;
  role: TeamRole;
  joinedAt: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  teamLead: UserRef;
  members: TeamMember[];
  status: TeamStatus;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  owner: UserRef;
  team?: { _id: string; name: string; status: TeamStatus };
  members: UserRef[];
  startDate?: string;
  deadline?: string;
  tags: string[];
  progress: number;
  isArchived: boolean;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  _id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  _id: string;
  url: string;
  publicId: string;
  name: string;
  uploadedBy: UserRef;
  uploadedAt: string;
}

export interface TaskComment {
  _id: string;
  user: UserRef;
  text: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: { _id: string; name: string; status: ProjectStatus };
  status: TaskStatus;
  priority: TaskPriority;
  labels: TaskLabel[];
  assignees: UserRef[];
  reporter: UserRef;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  dependencies: string[];
  order: number;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
}
