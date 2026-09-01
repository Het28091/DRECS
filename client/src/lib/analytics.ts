import api from './api';
import { OverviewAnalytics } from '../types';

export const getOverviewStats = async () => {
  const response = await api.get<{ success: boolean; overview: OverviewAnalytics }>('/analytics/overview');
  return response.data;
};

export const getIncidentTrends = async () => {
  const response = await api.get<{
    success: boolean;
    byStatus: { status: string; count: number }[];
    byCategory: { category: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  }>('/analytics/incidents/trends');
  return response.data;
};

export const getVolunteerActivity = async () => {
  const response = await api.get<{
    success: boolean;
    requestsByStatus: { status: string; count: number }[];
    assignmentsByStatus: { status: string; count: number }[];
  }>('/analytics/volunteers/activity');
  return response.data;
};

export const getResourceUtilization = async () => {
  const response = await api.get<{
    success: boolean;
    byCategory: { category: string; totalQuantity: number; availableQuantity: number; allocatedQuantity: number; itemCount: number }[];
    byStatus: { status: string; count: number }[];
  }>('/analytics/resources/utilization');
  return response.data;
};
