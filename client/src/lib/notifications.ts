import api from './api';
import { NotificationsResponse, Notification } from '../types';

export const getMyNotifications = async () => {
  const response = await api.get<NotificationsResponse>('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await api.patch<{ success: boolean; notification: Notification }>(
    `/notifications/${id}/read`,
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch<{ success: boolean; message: string }>(
    '/notifications/read-all',
  );
  return response.data;
};
