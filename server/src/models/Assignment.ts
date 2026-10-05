import { Schema, model, Document, Types } from 'mongoose';

export const ASSIGNMENT_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];


export interface IAssignment {
  incidentId: Types.ObjectId;
  /** User assigned to help on this incident (citizen with per-incident volunteer participation). */
  volunteerId: Types.ObjectId;
  /** Set when assignment is created from an approved VolunteerRequest. */
  volunteerRequestId?: Types.ObjectId | null;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IAssignmentDocument = IAssignment & Document;


const assignmentSchema = new Schema<IAssignmentDocument>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Incident is required'],
      index: true,
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer is required'],
      index: true,
    },
    volunteerRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'VolunteerRequest',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [...ASSIGNMENT_STATUSES],
        message: '{VALUE} is not a valid assignment status',
      },
      default: 'ASSIGNED',
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// One active assignment per volunteer per incident
assignmentSchema.index({ incidentId: 1, volunteerId: 1 }, { unique: true });

export const Assignment = model<IAssignmentDocument>('Assignment', assignmentSchema);
