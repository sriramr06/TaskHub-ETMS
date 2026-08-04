import { Router } from 'express';
import multer from 'multer';
import { protect } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';
import { validate } from '@/middlewares/validate';
import { Permission } from '@/constants/enums/permissions';
import {
  updateMyProfileSchema,
  userIdParamSchema,
  updateUserSchema,
} from '@/validators/user.validator';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateMyProfile,
  updateMyAvatar,
} from '@/controllers/user.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(protect);

router.patch('/me', validate(updateMyProfileSchema), updateMyProfile);
router.patch('/me/avatar', upload.single('file'), updateMyAvatar);

router.get('/', requirePermission(Permission.USER_READ), getUsers);
router.get(
  '/:id',
  requirePermission(Permission.USER_READ),
  validate(userIdParamSchema),
  getUserById,
);
router.patch(
  '/:id',
  requirePermission(Permission.USER_EDIT),
  validate(updateUserSchema),
  updateUser,
);
router.delete(
  '/:id',
  requirePermission(Permission.USER_DELETE),
  validate(userIdParamSchema),
  deleteUser,
);

export default router;
