export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',

  // Project Management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',

  // Task Management
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // Team Management
  TEAM_CREATE = 'team:create',
  TEAM_READ = 'team:read',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete'
}