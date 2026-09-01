import { Schema, model, Document } from 'mongoose';

export const SHELTER_STATUSES = ['ACTIVE', 'FULL', 'INACTIVE'] as const;
export type ShelterStatus = (typeof SHELTER_STATUSES)[number];

export interface IShelterLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IShelter {
  name: string;
  location: IShelterLocation;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  contactInfo: string;
  status: ShelterStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IShelterDocument = IShelter & Document;

const shelterLocationSchema = new Schema<IShelterLocation>(
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

const shelterSchema = new Schema<IShelterDocument>(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    location: {
      type: shelterLocationSchema,
      required: [true, 'Location is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    currentOccupancy: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
    },
    facilities: {
      type: [String],
      default: [],
    },
    contactInfo: {
      type: String,
      required: [true, 'Contact information is required'],
      trim: true,
      maxlength: [200, 'Contact info must be at most 200 characters'],
    },
    status: {
      type: String,
      enum: {
        values: [...SHELTER_STATUSES],
        message: '{VALUE} is not a valid shelter status',
      },
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  },
);

shelterSchema.index({ status: 1 });
shelterSchema.index({ name: 1 });

export const Shelter = model<IShelterDocument>('Shelter', shelterSchema);
