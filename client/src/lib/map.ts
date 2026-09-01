import api from '@/lib/api';
import { MapIncident, MapIncidentsResponse } from '@/types';

export async function fetchMapIncidents(): Promise<MapIncident[]> {
  const response = await api.get<MapIncidentsResponse>('/map/incidents');
  return response.data.incidents;
}
