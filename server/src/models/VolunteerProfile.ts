import { Schema, model, Document, Types } from 'mongoose';

export const VOLUNTEER_AVAILABILITIES = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'] as const;
export type VolunteerAvailability = (typeof VOLUNTEER_AVAILABILITIES)[number];

export const VOLUNTEER_VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VolunteerVerificationStatus = (typeof VOLUNTEER_VERIFICATION_STATUSES)[number];

export interface IVolunteerProfile {
  userId: Types.ObjectId;
  skills: string[];
  experience: string;
  availability: VolunteerAvailability;
  phoneNumber: string;
  emergencyContact: string;
  verificationStatus: VolunteerVerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IVolunteerProfileDocument = IVolunteerProfile & Document;

const volunteerProfileSchema = new Schema<IVolunteerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [2000, 'Experience must be at most 2000 characters'],
      default: '',
    },
    availability: {
      type: String,
      enum: {
        values: [...VOLUNTEER_AVAILABILITIES],
        message: '{VALUE} is not a valid availability status',
      },
      default: 'AVAILABLE',
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number must be at most 20 characters'],
      default: '',
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: [200, 'Emergency contact must be at most 200 characters'],
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: [...VOLUNTEER_VERIFICATION_STATUSES],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    collection: 'volunteerProfiles',
  },
);

volunteerProfileSchema.index({ verificationStatus: 1 });

export const VolunteerProfile = model<IVolunteerProfileDocument>(
  'VolunteerProfile',
  volunteerProfileSchema,
);
