import { Router } from 'express';
import { protect } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';
import { validate } from '@/middlewares/validate';
import { Permission } from '@/constants/enums/permissions';
import {
  createEmployeeSchema,
  linkEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
} from '@/validators/employee.validator';
import {
  createEmployee,
  linkEmployee,
  getEmployees,
  getMyProfile,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '@/controllers/employee.controller';

const router = Router();

router.use(protect);

router.get('/me', getMyProfile);
router.post(
  '/',
  requirePermission(Permission.USER_CREATE),
  validate(createEmployeeSchema),
  createEmployee,
);
router.post(
  '/link',
  requirePermission(Permission.USER_CREATE),
  validate(linkEmployeeSchema),
  linkEmployee,
);
router.get('/', requirePermission(Permission.USER_READ), getEmployees);
router.get(
  '/:id',
  requirePermission(Permission.USER_READ),
  validate(employeeIdParamSchema),
  getEmployeeById,
);
router.patch(
  '/:id',
  requirePermission(Permission.USER_EDIT),
  validate(updateEmployeeSchema),
  updateEmployee,
);
router.delete(
  '/:id',
  requirePermission(Permission.USER_DELETE),
  validate(employeeIdParamSchema),
  deleteEmployee,
);

export default router;
