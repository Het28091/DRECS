import { Response } from 'express';
import { Types } from 'mongoose';
import { Notification, INotificationDocument } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';

export const formatNotification = (notification: INotificationDocument) => ({
  id: notification._id.toString(),
  recipient: notification.recipient.toString(),
  title: notification.title,
  message: notification.message,
  type: notification.type,
  link: notification.link ?? '',
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

/**
 * @desc    Get current logged in user's notifications
 * @route   GET /api/notifications
 * @access  Authenticated
 */
export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    notifications: notifications.map(formatNotification),
  });
});

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Authenticated
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError('Invalid notification ID', 400);
  }

  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id,
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    notification: formatNotification(notification),
  });
});

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Authenticated
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw createError('Unauthorized — Authentication required', 401);
  }

  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { $set: { isRead: true } },
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
