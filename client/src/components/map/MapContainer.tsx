'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapIncident, Shelter } from '@/types';
import {
  createSeverityIcon,
  createShelterIcon,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from './mapUtils';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  incidents: MapIncident[];
  shelters?: Shelter[];
  /** Increment to re-fit map bounds to all markers */
  fitToken?: number;
}

type LeafletHtmlElement = HTMLDivElement & { _leaflet_id?: number | null };

function clearLeafletContainer(el: LeafletHtmlElement) {
  if (el._leaflet_id) {
    el._leaflet_id = null;
    delete el._leaflet_id;
  }
  el.innerHTML = '';
}

function isValidPoint(lat: number, lng: number) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  );
}

/**
 * Imperative Leaflet map — avoids react-leaflet MapContainer's
 * "Map container is already initialized" crash under React Strict Mode.
 * Load with next/dynamic({ ssr: false }).
 */
export function MapContainer({
  incidents,
  shelters = [],
  fitToken = 0,
}: MapContainerProps) {
  const containerRef = useRef<LeafletHtmlElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Create / destroy map instance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Strict Mode remount: wipe any leftover Leaflet state on this node
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = null;
    }
    clearLeafletContainer(el);

    const map = L.map(el, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersRef.current = markers;

    const invalidate = () => map.invalidateSize();
    requestAnimationFrame(invalidate);
    const timeoutId = window.setTimeout(invalidate, 100);

    return () => {
      window.clearTimeout(timeoutId);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      clearLeafletContainer(el);
    };
  }, []);

  // Sync markers when incident/shelter data changes
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    incidents.forEach((incident) => {
      const { latitude, longitude } = incident.location;
      if (!isValidPoint(latitude, longitude)) return;

      const marker = L.marker([latitude, longitude], {
        icon: createSeverityIcon(incident.severity),
      });

      marker.bindPopup(`
        <div style="min-width:180px">
          <p style="font-weight:600;color:#0f172a;font-size:14px;margin:0 0 6px">${escapeHtml(incident.title)}</p>
          <dl style="font-size:12px;color:#475569;margin:0 0 8px">
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
              <dt>Category</dt><dd style="font-weight:500;color:#1e293b;margin:0">${escapeHtml(incident.category)}</dd>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
              <dt>Severity</dt><dd style="font-weight:500;color:#1e293b;margin:0">${escapeHtml(incident.severity)}</dd>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px">
              <dt>Status</dt><dd style="font-weight:500;color:#1e293b;margin:0">${escapeHtml(incident.status.replace(/_/g, ' '))}</dd>
            </div>
          </dl>
          <a href="/incidents/${incident.id}" style="font-size:12px;font-weight:500;color:#ea580c;text-decoration:underline">View details →</a>
        </div>
      `);

      markers.addLayer(marker);
    });

    shelters.forEach((shelter) => {
      const { latitude, longitude } = shelter.location;
      if (!isValidPoint(latitude, longitude)) return;

      const marker = L.marker([latitude, longitude], {
        icon: createShelterIcon(shelter.status),
      });

      marker.bindPopup(`
        <div style="min-width:180px">
          <p style="font-weight:600;color:#0f172a;font-size:14px;margin:0 0 6px">${escapeHtml(shelter.name)}</p>
          <dl style="font-size:12px;color:#475569;margin:0">
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
              <dt>Capacity</dt><dd style="font-weight:500;color:#1e293b;margin:0">${shelter.capacity}</dd>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
              <dt>Occupancy</dt><dd style="font-weight:500;color:#1e293b;margin:0">${shelter.currentOccupancy}</dd>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px">
              <dt>Status</dt><dd style="font-weight:500;color:#1e293b;margin:0">${escapeHtml(shelter.status)}</dd>
            </div>
          </dl>
        </div>
      `);

      markers.addLayer(marker);
    });
  }, [incidents, shelters]);

  // Fit bounds when data or fitToken changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = [
      ...incidents.map((i) => i.location),
      ...shelters.map((s) => s.location),
    ].filter((loc) => isValidPoint(loc.latitude, loc.longitude));

    if (points.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
      return;
    }

    const bounds = L.latLngBounds(
      points.map((p) => [p.latitude, p.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [incidents, shelters, fitToken]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl z-0 bg-slate-800"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default MapContainer;
