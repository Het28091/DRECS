import api from '@/lib/api';
import {
  CreateIncidentData,
  Incident,
  IncidentResponse,
  IncidentsResponse,
  IncidentStatus,
} from '@/types';

export async function createIncident(data: CreateIncidentData): Promise<Incident> {
  const response = await api.post<IncidentResponse>('/incidents', data);
  return response.data.incident;
}

export async function fetchMyIncidents(): Promise<Incident[]> {
  const response = await api.get<IncidentsResponse>('/incidents/my');
  return response.data.incidents;
}

export async function fetchAllIncidents(filters?: {
  status?: string;
  category?: string;
  severity?: string;
}): Promise<Incident[]> {
  const response = await api.get<IncidentsResponse>('/incidents', {
    params: filters,
  });
  return response.data.incidents;
}

export async function getAllIncidents(filters?: {
  status?: string;
  category?: string;
  severity?: string;
}): Promise<{ success: boolean; count: number; incidents: Incident[] }> {
  const response = await api.get<IncidentsResponse>('/incidents', {
    params: filters,
  });
  return response.data;
}

export async function fetchPublicIncidents(filters?: {
  status?: string;
  category?: string;
  severity?: string;
}): Promise<Incident[]> {
  const response = await api.get<IncidentsResponse>('/incidents/public', {
    params: filters,
  });
  return response.data.incidents;
}

export async function fetchIncidentById(id: string): Promise<Incident> {
  const response = await api.get<IncidentResponse>(`/incidents/${id}`);
  return response.data.incident;
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
): Promise<Incident> {
  const response = await api.patch<IncidentResponse>(`/incidents/${id}/status`, {
    status,
  });
  return response.data.incident;
}
