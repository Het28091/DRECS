import { Schema, model, Document, Types } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'INCIDENT_UPDATE',
  'VOLUNTEER_REQUEST',
  'ASSIGNMENT_UPDATE',
  'SHELTER_UPDATE',
  'RESOURCE_UPDATE',
  'SYSTEM',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type INotificationDocument = INotification & Document;

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message must be at most 1000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: [...NOTIFICATION_TYPES],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'SYSTEM',
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotificationDocument>('Notification', notificationSchema);
