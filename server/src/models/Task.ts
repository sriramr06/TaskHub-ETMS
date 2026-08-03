import mongoose, { Schema, Document, Types } from 'mongoose';
import { TaskStatus, TaskPriority, TaskLabel } from '@/constants/enums/task';

export interface IChecklistItem {
  title: string;
  completed: boolean;
}

export interface IAttachment {
  url: string;
  publicId: string;
  name: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IComment {
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  project: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  labels: TaskLabel[];
  assignees: Types.ObjectId[];
  reporter: Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  checklist: IChecklistItem[];
  attachments: IAttachment[];
  comments: IComment[];
  dependencies: Types.ObjectId[];
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checklistItemSchema = new Schema<IChecklistItem>(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const attachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    labels: {
      type: [String],
      enum: Object.values(TaskLabel),
      default: [],
    },
    assignees: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
    },
    checklist: {
      type: [checklistItemSchema],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    dependencies: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
