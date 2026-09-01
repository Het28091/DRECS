import api from '@/lib/api';
import {
  Assignment,
  AssignmentResponse,
  AssignmentsResponse,
  AssignmentStatus,
  Volunteer,
  VolunteerAccessResponse,
  VolunteersResponse,
} from '@/types';

export async function fetchMyAssignments(): Promise<Assignment[]> {
  const response = await api.get<AssignmentsResponse>('/assignments/my');
  return response.data.assignments;
}

export async function fetchMyVolunteerAccess(): Promise<VolunteerAccessResponse> {
  const response = await api.get<VolunteerAccessResponse>('/assignments/my/access');
  return response.data;
}

export async function fetchIncidentAssignments(incidentId: string): Promise<Assignment[]> {
  const response = await api.get<AssignmentsResponse>(
    `/assignments/incident/${incidentId}`,
  );
  return response.data.assignments;
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus,
): Promise<Assignment> {
  const response = await api.patch<AssignmentResponse>(`/assignments/${id}/status`, {
    status,
  });
  return response.data.assignment;
}

export async function fetchVolunteers(): Promise<Volunteer[]> {
  const response = await api.get<VolunteersResponse>('/volunteers');
  return response.data.volunteers;
}

export async function removeAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`);
}
