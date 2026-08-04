import { Router } from 'express';
import { protect } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';
import { validate } from '@/middlewares/validate';
import { Permission } from '@/constants/enums/permissions';
import {
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberParamSchema,
} from '@/validators/team.validator';
import {
  createTeam,
  getTeams,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from '@/controllers/team.controller';

const router = Router();

router.use(protect);

router.get('/me', getMyTeams);
router.post('/', requirePermission(Permission.TEAM_CREATE), validate(createTeamSchema), createTeam);
router.get('/', requirePermission(Permission.TEAM_READ), getTeams);
router.get(
  '/:id',
  requirePermission(Permission.TEAM_READ),
  validate(teamIdParamSchema),
  getTeamById,
);
router.patch(
  '/:id',
  requirePermission(Permission.TEAM_UPDATE),
  validate(updateTeamSchema),
  updateTeam,
);
router.delete(
  '/:id',
  requirePermission(Permission.TEAM_DELETE),
  validate(teamIdParamSchema),
  deleteTeam,
);

router.post(
  '/:id/members',
  requirePermission(Permission.TEAM_UPDATE),
  validate(addTeamMemberSchema),
  addTeamMember,
);
router.patch(
  '/:id/members/:userId',
  requirePermission(Permission.TEAM_UPDATE),
  validate(updateTeamMemberSchema),
  updateTeamMemberRole,
);
router.delete(
  '/:id/members/:userId',
  requirePermission(Permission.TEAM_UPDATE),
  validate(teamMemberParamSchema),
  removeTeamMember,
);

export default router;
