import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join_room', (data: { userId?: string; role?: string }) => {
      if (data.userId) {
        socket.join(`user:${data.userId}`);
        console.log(`👤 Socket ${socket.id} joined user:${data.userId}`);
      }
      if (data.role) {
        socket.join(`role:${data.role}`);
        console.log(`🛡️ Socket ${socket.id} joined role:${data.role}`);
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io || null;
};

/**
 * Helper to dispatch notification in DB & push via Socket.IO real-time event.
 */
export const dispatchNotification = async (options: {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) => {
  try {
    const notification = await Notification.create({
      recipient: options.recipientId,
      title: options.title,
      message: options.message,
      type: options.type,
      link: options.link || '',
    });

    const activeIo = getIO();
    if (activeIo) {
      activeIo.to(`user:${options.recipientId}`).emit('notification', {
        id: notification._id.toString(),
        recipient: options.recipientId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    }
    return notification;
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
};

/**
 * Dispatch notification to all users matching specified roles (e.g. authority, admin).
 */
export const dispatchNotificationToRoles = async (options: {
  roles: ('authority' | 'admin' | 'citizen' | 'volunteer')[];
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) => {
  try {
    const users = await User.find({ role: { $in: options.roles }, isActive: true }).select('_id');
    const promises = users.map((u) =>
      dispatchNotification({
        recipientId: u._id.toString(),
        title: options.title,
        message: options.message,
        type: options.type,
        link: options.link,
      }),
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to dispatch notifications to roles:', err);
  }
};
