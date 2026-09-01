/**
 * Map components — load with next/dynamic({ ssr: false }).
 *
 * Leaflet accesses browser APIs and cannot render on the server.
 */

export { MapContainer } from './MapContainer';
export { IncidentMarker } from './IncidentMarker';
export { ShelterMarker } from './ShelterMarker';
export {
  SEVERITY_COLORS,
  SHELTER_STATUS_COLORS,
  createSeverityIcon,
  createShelterIcon,
  DEFAULT_MAP_CENTER,
} from './mapUtils';
