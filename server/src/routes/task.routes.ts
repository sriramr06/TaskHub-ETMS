import { Router } from 'express';
import multer from 'multer';
import { protect } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';
import { validate } from '@/middlewares/validate';
import { Permission } from '@/constants/enums/permissions';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  assignTaskSchema,
  addChecklistItemSchema,
  updateChecklistItemSchema,
  checklistItemParamSchema,
  addCommentSchema,
  updateCommentSchema,
  commentParamSchema,
  attachmentParamSchema,
} from '@/validators/task.validator';
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  addComment,
  updateComment,
  removeComment,
  addTaskAttachment,
  removeTaskAttachment,
} from '@/controllers/task.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

router.use(protect);

router.get('/me', getMyTasks);
router.post('/', requirePermission(Permission.TASK_CREATE), validate(createTaskSchema), createTask);
router.get('/', requirePermission(Permission.TASK_READ), getTasks);
router.get(
  '/:id',
  requirePermission(Permission.TASK_READ),
  validate(taskIdParamSchema),
  getTaskById,
);
router.patch(
  '/:id',
  requirePermission(Permission.TASK_EDIT),
  validate(updateTaskSchema),
  updateTask,
);
router.delete(
  '/:id',
  requirePermission(Permission.TASK_DELETE),
  validate(taskIdParamSchema),
  deleteTask,
);

router.patch(
  '/:id/assign',
  requirePermission(Permission.TASK_ASSIGN),
  validate(assignTaskSchema),
  assignTask,
);

router.post(
  '/:id/checklist',
  requirePermission(Permission.TASK_EDIT),
  validate(addChecklistItemSchema),
  addChecklistItem,
);
router.patch(
  '/:id/checklist/:itemId',
  requirePermission(Permission.TASK_EDIT),
  validate(updateChecklistItemSchema),
  updateChecklistItem,
);
router.delete(
  '/:id/checklist/:itemId',
  requirePermission(Permission.TASK_EDIT),
  validate(checklistItemParamSchema),
  removeChecklistItem,
);

router.post(
  '/:id/comments',
  requirePermission(Permission.TASK_EDIT),
  validate(addCommentSchema),
  addComment,
);
router.patch(
  '/:id/comments/:commentId',
  requirePermission(Permission.TASK_EDIT),
  validate(updateCommentSchema),
  updateComment,
);
router.delete(
  '/:id/comments/:commentId',
  requirePermission(Permission.TASK_EDIT),
  validate(commentParamSchema),
  removeComment,
);

router.post(
  '/:id/attachments',
  requirePermission(Permission.TASK_EDIT),
  validate(taskIdParamSchema),
  upload.single('file'),
  addTaskAttachment,
);
router.delete(
  '/:id/attachments/:attachmentId',
  requirePermission(Permission.TASK_EDIT),
  validate(attachmentParamSchema),
  removeTaskAttachment,
);

export default router;
