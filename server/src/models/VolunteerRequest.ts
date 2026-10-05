import { Schema, model, Document, Types } from 'mongoose';

export const VOLUNTEER_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VolunteerRequestStatus = (typeof VOLUNTEER_REQUEST_STATUSES)[number];

export interface IVolunteerRequest {
  userId: Types.ObjectId;
  incidentId: Types.ObjectId;
  skills: string[];
  experience: string;
  message: string;
  phoneNumber: string;
  status: VolunteerRequestStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IVolunteerRequestDocument = IVolunteerRequest & Document;

const volunteerRequestSchema = new Schema<IVolunteerRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Incident is required'],
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
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message must be at most 1000 characters'],
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number must be at most 20 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: [...VOLUNTEER_REQUEST_STATUSES],
        message: '{VALUE} is not a valid request status',
      },
      default: 'PENDING',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    collection: 'volunteerRequests',
  },
);

// One pending/approved offer per user per incident (rejected users may re-apply later via new doc or status update in future APIs)
volunteerRequestSchema.index({ incidentId: 1, userId: 1 }, { name: 'active_offer_per_incident', unique: true, partialFilterExpression: { status: { $in: ['PENDING', 'APPROVED'] } } });
volunteerRequestSchema.index({ status: 1, createdAt: -1 });

export const VolunteerRequest = model<IVolunteerRequestDocument>(
  'VolunteerRequest',
  volunteerRequestSchema,
);
