import mongoose, { Schema, Document, Types } from 'mongoose';
import { TeamRole, TeamStatus } from '@/constants/enums/team';

export interface ITeamMember {
  user: Types.ObjectId;
  role: TeamRole;
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  teamLead: Types.ObjectId;
  members: ITeamMember[];
  status: TeamStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: Object.values(TeamRole),
      default: TeamRole.CONTRIBUTOR,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teamLead: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team lead is required'],
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(TeamStatus),
      default: TeamStatus.ACTIVE,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

teamSchema.index({ status: 1 });
teamSchema.index({ 'members.user': 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);
