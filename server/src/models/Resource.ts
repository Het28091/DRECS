import { Schema, model, Document, Types } from 'mongoose';

export const RESOURCE_CATEGORIES = [
  'Food',
  'Water',
  'Medical',
  'Shelter Supplies',
  'Vehicle/Transport',
  'Equipment',
  'Personnel',
  'Other',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_STATUSES = ['AVAILABLE', 'LOW_STOCK', 'DEPLETED', 'MAINTENANCE'] as const;

export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export interface IResourceAllocation {
  incidentId: Types.ObjectId;
  quantity: number;
  allocatedAt: Date;
  notes?: string;
}

export interface IResourceLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface IResource {
  name: string;
  category: ResourceCategory;
  quantity: number;
  availableQuantity: number;
  unit: string;
  location?: IResourceLocation;
  status: ResourceStatus;
  allocations: IResourceAllocation[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type IResourceDocument = IResource & Document;

const resourceAllocationSchema = new Schema<IResourceAllocation>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Allocated quantity must be at least 1'],
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Allocation note must be at most 300 characters'],
    },
  },
  { _id: false },
);

const resourceSchema = new Schema<IResourceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    category: {
      type: String,
      enum: {
        values: [...RESOURCE_CATEGORIES],
        message: '{VALUE} is not a valid resource category',
      },
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
      default: 'units',
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    status: {
      type: String,
      enum: {
        values: [...RESOURCE_STATUSES],
        message: '{VALUE} is not a valid status',
      },
      default: 'AVAILABLE',
    },
    allocations: {
      type: [resourceAllocationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

resourceSchema.pre('save', function (next) {
  if (this.availableQuantity <= 0) {
    this.status = 'DEPLETED';
  } else if (this.availableQuantity < this.quantity * 0.2) {
    if (this.status !== 'MAINTENANCE') {
      this.status = 'LOW_STOCK';
    }
  } else if (this.status !== 'MAINTENANCE') {
    this.status = 'AVAILABLE';
  }
  next();
});

resourceSchema.index({ category: 1 });
resourceSchema.index({ status: 1 });

export const Resource = model<IResourceDocument>('Resource', resourceSchema);
