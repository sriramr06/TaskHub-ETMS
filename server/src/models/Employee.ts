import mongoose, { Schema, Document, Types } from 'mongoose';
import { EmploymentType, EmploymentStatus } from '@/constants/enums/employee';

export interface IEmployee extends Document {
  user: Types.ObjectId;
  employeeId: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  reportingManager?: Types.ObjectId;
  joiningDate: Date;
  dateOfBirth?: Date;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      default: EmploymentType.FULL_TIME,
    },
    employmentStatus: {
      type: String,
      enum: Object.values(EmploymentStatus),
      default: EmploymentStatus.PROBATION,
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

employeeSchema.index({ department: 1 });

employeeSchema.pre('validate', function (next) {
  if (!this.employeeId) {
    this.employeeId = `EMP-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
