'use client';

import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import { MapIncident } from '@/types';
import { createSeverityIcon } from './mapUtils';

interface IncidentMarkerProps {
  incident: MapIncident;
}

export function IncidentMarker({ incident }: IncidentMarkerProps) {
  const { latitude, longitude } = incident.location;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null;
  }

  return (
    <Marker
      position={[latitude, longitude]}
      icon={createSeverityIcon(incident.severity)}
    >
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900 text-sm mb-1">{incident.title}</p>
          <dl className="text-xs text-slate-600 space-y-0.5 mb-2">
            <div className="flex justify-between gap-3">
              <dt>Category</dt>
              <dd className="font-medium text-slate-800">{incident.category}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Severity</dt>
              <dd className="font-medium text-slate-800">{incident.severity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Status</dt>
              <dd className="font-medium text-slate-800">
                {incident.status.replace(/_/g, ' ')}
              </dd>
            </div>
          </dl>
          <Link
            href={`/incidents/${incident.id}`}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 underline underline-offset-2"
          >
            View details →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
