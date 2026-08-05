import { UserRole } from '@/constants/enums/user';

/**
 * ADMIN and MANAGER are org-wide oversight roles — every permission check for
 * them stays role-only, same as before. Everyone else (TEAMLEAD/MEMBER/GUEST)
 * additionally has to be connected to the specific resource: assigned to the
 * task, a member of the project, leading the team, etc. This is what stops a
 * MEMBER from editing arbitrary tasks or a TEAMLEAD from managing teams they
 * don't lead, even though their role grants the underlying permission.
 */
export const isPrivilegedRole = (role: UserRole): boolean =>
  role === UserRole.ADMIN || role === UserRole.MANAGER;
