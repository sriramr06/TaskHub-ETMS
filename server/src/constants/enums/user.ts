export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TEAMLEAD = 'teamlead',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export const UserRolesList = Object.values(UserRole);
export const UserStatusList = Object.values(UserStatus);