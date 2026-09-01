import api from './api';
import { Resource, ResourcesResponse, ResourceResponse } from '../types';

export const getAllResources = async (params?: { category?: string; status?: string }) => {
  const response = await api.get<ResourcesResponse>('/resources', { params });
  return response.data;
};

export const getResourceById = async (id: string) => {
  const response = await api.get<ResourceResponse>(`/resources/${id}`);
  return response.data;
};

export const createResource = async (data: {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location?: { latitude?: number; longitude?: number; address?: string };
  status?: string;
}) => {
  const response = await api.post<ResourceResponse>('/resources', data);
  return response.data;
};

export const updateResource = async (id: string, data: Partial<Resource>) => {
  const response = await api.patch<ResourceResponse>(`/resources/${id}`, data);
  return response.data;
};

export const deleteResource = async (id: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(`/resources/${id}`);
  return response.data;
};

export const allocateResource = async (id: string, data: { incidentId: string; quantity: number; notes?: string }) => {
  const response = await api.post<ResourceResponse>(`/resources/${id}/allocate`, data);
  return response.data;
};

export const releaseResource = async (id: string, data: { incidentId: string }) => {
  const response = await api.post<ResourceResponse>(`/resources/${id}/release`, data);
  return response.data;
};
