import { IncidentSeverity, ShelterStatus } from '@/types';

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const SHELTER_STATUS_COLORS: Record<ShelterStatus, string> = {
  ACTIVE: '#38bdf8',
  FULL: '#a78bfa',
  INACTIVE: '#64748b',
};

export function createSeverityIcon(severity: IncidentSeverity) {
  if (typeof window === 'undefined') return null as any;
  const L = require('leaflet');
  const color = SEVERITY_COLORS[severity] ?? '#94a3b8';

  return L.divIcon({
    className: 'drecs-severity-marker',
    html: `
      <span style="
        display:block;
        width:16px;
        height:16px;
        border-radius:9999px;
        background:${color};
        border:2px solid #0f172a;
        box-shadow:0 0 0 2px ${color}55, 0 2px 6px rgba(0,0,0,0.45);
      "></span>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export function createShelterIcon(status: ShelterStatus) {
  if (typeof window === 'undefined') return null as any;
  const L = require('leaflet');
  const color = SHELTER_STATUS_COLORS[status] ?? '#38bdf8';

  return L.divIcon({
    className: 'drecs-severity-marker',
    html: `
      <span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:18px;
        height:18px;
        border-radius:4px;
        background:${color};
        border:2px solid #0f172a;
        box-shadow:0 0 0 2px ${color}55, 0 2px 6px rgba(0,0,0,0.45);
        color:#0f172a;
        font-size:10px;
        font-weight:700;
        line-height:1;
      ">⌂</span>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

/** Default map center (Ahmedabad) when no points are available */
export const DEFAULT_MAP_CENTER: [number, number] = [23.0225, 72.5714];
export const DEFAULT_MAP_ZOOM = 11;
