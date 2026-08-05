import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@/constants/enums/user';
import { Permission } from '@/constants/enums/permissions';
import { ROLE_PERMISSIONS } from '@/constants/rolesPermissions';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  readonly permissions: Permission[];
  lastLogin?: Date;
  metadata: {
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    lastLogin: {
      type: Date,
    },
    metadata: {
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.virtual('fullName').get(function (this: IUser) {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

// Single source of truth for role->permission mapping (server-side). The client
// never re-derives this — it trusts whatever comes back on the `user` object.
userSchema.virtual('permissions').get(function (this: IUser) {
  return ROLE_PERMISSIONS[this.role] ?? [];
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.__v;
    return obj;
  },
});

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
