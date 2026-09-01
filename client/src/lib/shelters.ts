import api from '@/lib/api';
import {
  CreateShelterData,
  Shelter,
  ShelterResponse,
  SheltersResponse,
  UpdateShelterData,
} from '@/types';

export async function fetchShelters(status?: string): Promise<Shelter[]> {
  const response = await api.get<SheltersResponse>('/shelters', {
    params: status ? { status } : undefined,
  });
  return response.data.shelters;
}

export async function fetchShelterById(id: string): Promise<Shelter> {
  const response = await api.get<ShelterResponse>(`/shelters/${id}`);
  return response.data.shelter;
}

export async function createShelter(data: CreateShelterData): Promise<Shelter> {
  const response = await api.post<ShelterResponse>('/shelters', data);
  return response.data.shelter;
}

export async function updateShelter(
  id: string,
  data: UpdateShelterData,
): Promise<Shelter> {
  const response = await api.patch<ShelterResponse>(`/shelters/${id}`, data);
  return response.data.shelter;
}

export async function deleteShelter(id: string): Promise<void> {
  await api.delete(`/shelters/${id}`);
}
