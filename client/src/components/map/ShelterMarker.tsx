'use client';

import { Marker, Popup } from 'react-leaflet';
import { Shelter } from '@/types';
import { createShelterIcon } from './mapUtils';

interface ShelterMarkerProps {
  shelter: Shelter;
}

export function ShelterMarker({ shelter }: ShelterMarkerProps) {
  const { latitude, longitude } = shelter.location;

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
      icon={createShelterIcon(shelter.status)}
    >
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900 text-sm mb-1">{shelter.name}</p>
          <dl className="text-xs text-slate-600 space-y-0.5">
            <div className="flex justify-between gap-3">
              <dt>Capacity</dt>
              <dd className="font-medium text-slate-800">{shelter.capacity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Occupancy</dt>
              <dd className="font-medium text-slate-800">{shelter.currentOccupancy}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Status</dt>
              <dd className="font-medium text-slate-800">{shelter.status}</dd>
            </div>
          </dl>
        </div>
      </Popup>
    </Marker>
  );
}
