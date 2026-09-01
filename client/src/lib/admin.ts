import api from './api';
import { User, Role } from '../types';

export const getAllUsers = async (params?: { role?: string; isActive?: string; search?: string }) => {
  const response = await api.get<{ success: boolean; count: number; users: User[] }>('/admin/users', { params });
  return response.data;
};

export const updateUserRole = async (id: string, role: Role) => {
  const response = await api.patch<{ success: boolean; message: string; user: User }>(
    `/admin/users/${id}/role`,
    { role },
  );
  return response.data;
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch<{ success: boolean; message: string; user: User }>(
    `/admin/users/${id}/status`,
    { isActive },
  );
  return response.data;
};

export const getAdminOverview = async () => {
  const response = await api.get<{
    success: boolean;
    systemStats: {
      users: { total: number; citizens: number; authorities: number; admins: number; volunteers: number; inactive: number };
      counts: { incidents: number; shelters: number; resources: number };
    };
  }>('/admin/overview');
  return response.data;
};
