export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAMLEAD: 'teamlead',
  MEMBER: 'member',
  GUEST: 'guest',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const EmploymentType = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERN: 'intern',
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const EmploymentStatus = {
  PROBATION: 'probation',
  ACTIVE: 'active',
  ON_LEAVE: 'on-leave',
  RESIGNED: 'resigned',
  TERMINATED: 'terminated',
} as const;
export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];

export const TeamRole = {
  OWNER: 'owner',
  LEAD: 'lead',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;
export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const TeamStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  PENDING: 'pending',
} as const;
export type TeamStatus = (typeof TeamStatus)[keyof typeof TeamStatus];

export const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  HOLD: 'hold',
  REVIEW: 'review',
  BLOCKED: 'blocked',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskLabel = {
  BUG: 'bug',
  FEATURE: 'feature',
  IMPROVEMENT: 'improvement',
  DOCUMENTATION: 'documentation',
} as const;
export type TaskLabel = (typeof TaskLabel)[keyof typeof TaskLabel];

export const Permission = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',

  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',

  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',

  TEAM_CREATE: 'team:create',
  TEAM_READ: 'team:read',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',

  ADMIN_ACCESS: 'admin:acsess',
  VIEW_ANALYTICS: 'analytics:view',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [
    Permission.USER_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.TEAMLEAD]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_EDIT,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.TEAM_READ,
  ],
  [UserRole.MEMBER]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TEAM_READ,
  ],
  [UserRole.GUEST]: [Permission.PROJECT_READ, Permission.TASK_READ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const ENUM_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
  probation: 'Probation',
  active: 'Active',
  'on-leave': 'On leave',
  resigned: 'Resigned',
  terminated: 'Terminated',
  owner: 'Owner',
  lead: 'Lead',
  contributor: 'Contributor',
  viewer: 'Viewer',
  archived: 'Archived',
  pending: 'Pending',
  planning: 'Planning',
  'on-hold': 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  todo: 'To do',
  'in-progress': 'In progress',
  hold: 'Hold',
  review: 'Review',
  blocked: 'Blocked',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  bug: 'Bug',
  feature: 'Feature',
  improvement: 'Improvement',
  documentation: 'Documentation',
  inactive: 'Inactive',
  suspended: 'Suspended',
  admin: 'Admin',
  manager: 'Manager',
  teamlead: 'Team Lead',
  member: 'Member',
  guest: 'Guest',
};

export const enumLabel = (value: string): string => ENUM_LABELS[value] ?? value;
