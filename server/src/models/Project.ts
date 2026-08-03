import mongoose, { Schema, Document, Types } from 'mongoose';
import { ProjectStatus } from '@/constants/enums/project';
import { TaskPriority } from '@/constants/enums/task';

export interface IProject extends Document {
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  owner: Types.ObjectId;
  team?: Types.ObjectId;
  members: Types.ObjectId[];
  startDate?: Date;
  deadline?: Date;
  tags: string[];
  progress: number;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PLANNING,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    startDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ members: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
