'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LocationPicker({ value, onChange }: {
  value: [number, number] | null;
  onChange: (point: [number, number]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current).setView([23.0225, 72.5714], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance);
    instance.on('click', event => callback.current([event.latlng.lat, event.latlng.wrap().lng]));
    map.current = instance;
    return () => { instance.remove(); map.current = null; marker.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current || !value) return;
    if (marker.current) marker.current.setLatLng(value);
    else marker.current = L.circleMarker(value, { radius: 10, color: '#fff', fillColor: '#f97316', fillOpacity: 1 }).addTo(map.current);
    if (!map.current.getBounds().contains(value)) map.current.setView(value, 15);
  }, [value?.[0], value?.[1]]);
  return <div className="space-y-2">
    <div ref={container} tabIndex={0} className="h-72 rounded-xl relative z-0" aria-label="Select incident location by clicking the map" />
    <p className="text-xs text-slate-400">Keyboard: focus the map and use arrow keys to pan, then select its center below.</p>
    <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800" onClick={() => { const center = map.current?.getCenter(); if (center) onChange([center.lat, center.wrap().lng]); }}>Use map center</button>
  </div>;
}
