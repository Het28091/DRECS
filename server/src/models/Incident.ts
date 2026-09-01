import { Schema, model, Document, Types } from 'mongoose';

export const INCIDENT_STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_CATEGORIES = [
  'Flood',
  'Earthquake',
  'Fire',
  'Cyclone',
  'Building Collapse',
  'Landslide',
  'Medical',
  'Other',
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export interface IIncidentLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IStatusHistoryEntry {
  status: IncidentStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
  /** Optional human-readable note for audit timeline events (e.g. volunteer actions). */
  note?: string;
}

export interface IIncident {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  userSeverity?: IncidentSeverity;
  aiSeverity?: IncidentSeverity;
  aiSeverityMatch?: boolean;
  aiReasoning?: string;
  location: IIncidentLocation;
  images: string[];
  status: IncidentStatus;
  reportedBy: Types.ObjectId;
  statusHistory: IStatusHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type IIncidentDocument = IIncident & Document;

const incidentLocationSchema = new Schema<IIncidentLocation>(
  {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address must be at most 300 characters'],
    },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: {
        values: [...INCIDENT_STATUSES],
        message: '{VALUE} is not a valid incident status',
      },
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note must be at most 500 characters'],
      default: '',
    },
  },
  { _id: false },
);

const incidentSchema = new Schema<IIncidentDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: [...INCIDENT_CATEGORIES],
        message: '{VALUE} is not a valid incident category',
      },
      required: [true, 'Category is required'],
    },
    severity: {
      type: String,
      enum: {
        values: [...INCIDENT_SEVERITIES],
        message: '{VALUE} is not a valid severity level',
      },
      required: [true, 'Severity is required'],
      default: 'MEDIUM',
    },
    userSeverity: {
      type: String,
      enum: [...INCIDENT_SEVERITIES],
    },
    aiSeverity: {
      type: String,
      enum: [...INCIDENT_SEVERITIES],
    },
    aiSeverityMatch: {
      type: Boolean,
      default: false,
    },
    aiReasoning: {
      type: String,
      default: '',
    },
    location: {
      type: incidentLocationSchema,
      required: [true, 'Location is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: [...INCIDENT_STATUSES],
        message: '{VALUE} is not a valid incident status',
      },
      default: 'REPORTED',
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ category: 1 });
incidentSchema.index({ severity: 1 });

export const Incident = model<IIncidentDocument>('Incident', incidentSchema);
