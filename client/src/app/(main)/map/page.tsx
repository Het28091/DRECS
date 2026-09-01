'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, LocateFixed, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fetchMapIncidents } from '@/lib/map';
import { fetchShelters } from '@/lib/shelters';
import {
  SEVERITY_COLORS,
  SHELTER_STATUS_COLORS,
} from '@/components/map/mapUtils';
import { IncidentSeverity, MapIncident, Shelter, ShelterStatus } from '@/types';

const IncidentMap = dynamic(
  () => import('@/components/map/MapContainer').then((m) => m.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-800 rounded-xl">
        <p className="text-slate-400 text-sm">Loading map…</p>
      </div>
    ),
  },
);

const SEVERITY_LEGEND: { severity: IncidentSeverity; label: string }[] = [
  { severity: 'LOW', label: 'Low' },
  { severity: 'MEDIUM', label: 'Medium' },
  { severity: 'HIGH', label: 'High' },
  { severity: 'CRITICAL', label: 'Critical' },
];

const SHELTER_LEGEND: { status: ShelterStatus; label: string }[] = [
  { status: 'ACTIVE', label: 'Shelter active' },
  { status: 'FULL', label: 'Shelter full' },
  { status: 'INACTIVE', label: 'Shelter inactive' },
];

export default function MapPage() {
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [incidentData, shelterData] = await Promise.all([
        fetchMapIncidents(),
        fetchShelters(),
      ]);
      setIncidents(incidentData);
      setShelters(shelterData);
      setFitToken((t) => t + 1);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load map data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markerCount = incidents.length + shelters.length;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col min-h-[420px]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="text-orange-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Emergency Map</h1>
            <p className="text-slate-400 text-sm">
              {isLoading
                ? 'Loading map data…'
                : `${incidents.length} incident${incidents.length === 1 ? '' : 's'} · ${shelters.length} shelter${shelters.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFitToken((t) => t + 1)}
            disabled={markerCount === 0}
            title="Center map on all markers"
          >
            <LocateFixed size={14} />
            Center on markers
          </Button>
          <Button variant="outline" size="sm" onClick={load} loading={isLoading}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-red-900/30 border border-red-800/60 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="relative flex-1 min-h-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <IncidentMap
          incidents={incidents}
          shelters={shelters}
          fitToken={fitToken}
        />

        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2.5 shadow-lg backdrop-blur-sm max-w-[200px]">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
            Incidents
          </p>
          <ul className="space-y-1 mb-3">
            {SEVERITY_LEGEND.map(({ severity, label }) => (
              <li key={severity} className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-900"
                  style={{ backgroundColor: SEVERITY_COLORS[severity] }}
                />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
            Shelters
          </p>
          <ul className="space-y-1">
            {SHELTER_LEGEND.map(({ status, label }) => (
              <li key={status} className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0 border border-slate-900"
                  style={{ backgroundColor: SHELTER_STATUS_COLORS[status] }}
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
