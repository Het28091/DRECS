import api from '@/lib/api';
import {
  CreateVolunteerRequestData,
  VolunteerRequest,
  VolunteerRequestResponse,
  VolunteerRequestsResponse,
  VolunteerRequestStatus,
} from '@/types';

export async function createVolunteerRequest(
  incidentId: string,
  data: CreateVolunteerRequestData,
): Promise<VolunteerRequest> {
  const response = await api.post<VolunteerRequestResponse>(
    `/incidents/${incidentId}/volunteer-request`,
    data,
  );
  return response.data.request;
}

export async function fetchIncidentVolunteerRequests(
  incidentId: string,
): Promise<VolunteerRequest[]> {
  const response = await api.get<VolunteerRequestsResponse>(
    `/incidents/${incidentId}/volunteer-requests`,
  );
  return response.data.requests;
}

export async function fetchAllVolunteerRequests(
  status?: VolunteerRequestStatus,
): Promise<VolunteerRequest[]> {
  const response = await api.get<VolunteerRequestsResponse>('/volunteer-requests', {
    params: status ? { status } : undefined,
  });
  return response.data.requests;
}

export async function fetchMyVolunteerRequests(
  incidentId?: string,
): Promise<VolunteerRequest[]> {
  const response = await api.get<VolunteerRequestsResponse>('/volunteer-requests/my', {
    params: incidentId ? { incidentId } : undefined,
  });
  return response.data.requests;
}

export async function reviewVolunteerRequest(
  requestId: string,
  status: VolunteerRequestStatus,
): Promise<VolunteerRequest> {
  const response = await api.patch<VolunteerRequestResponse>(
    `/volunteer-requests/${requestId}/status`,
    { status },
  );
  return response.data.request;
}
