import { Router } from 'express';
import { protect } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';
import { validate } from '@/middlewares/validate';
import { Permission } from '@/constants/enums/permissions';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  addProjectMemberSchema,
  projectMemberParamSchema,
} from '@/validators/project.validator';
import {
  createProject,
  getProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '@/controllers/project.controller';

const router = Router();

router.use(protect);

router.get('/me', getMyProjects);
router.post(
  '/',
  requirePermission(Permission.PROJECT_CREATE),
  validate(createProjectSchema),
  createProject,
);
router.get('/', requirePermission(Permission.PROJECT_READ), getProjects);
router.get(
  '/:id',
  requirePermission(Permission.PROJECT_READ),
  validate(projectIdParamSchema),
  getProjectById,
);
router.patch(
  '/:id',
  requirePermission(Permission.PROJECT_EDIT),
  validate(updateProjectSchema),
  updateProject,
);
router.delete(
  '/:id',
  requirePermission(Permission.PROJECT_DELETE),
  validate(projectIdParamSchema),
  deleteProject,
);

router.post(
  '/:id/members',
  requirePermission(Permission.PROJECT_EDIT),
  validate(addProjectMemberSchema),
  addProjectMember,
);
router.delete(
  '/:id/members/:userId',
  requirePermission(Permission.PROJECT_EDIT),
  validate(projectMemberParamSchema),
  removeProjectMember,
);

export default router;
