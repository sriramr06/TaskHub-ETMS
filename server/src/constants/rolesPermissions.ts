import { UserRole } from "./enums/user";
import { Permission } from "./enums/permissions";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_DELETE,
    Permission.ADMIN_ACCESS,
    Permission.VIEW_ANALYTICS
  ],

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
    Permission.VIEW_ANALYTICS
  ],

  [UserRole.TEAMLEAD]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_EDIT,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.TEAM_READ
  ],
  
  [UserRole.MEMBER]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.TEAM_READ
  ],
  
  [UserRole.GUEST]: [
    Permission.PROJECT_READ,
    Permission.TASK_READ
  ]
};

export const hasPermission = (
  userRole: UserRole,
  permission: Permission
): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
};