'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Home,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  createShelter,
  deleteShelter,
  fetchShelters,
  updateShelter,
} from '@/lib/shelters';
import { SHELTER_STATUSES } from '@/lib/constants';
import { Shelter, ShelterStatus } from '@/types';

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm transition-all';

const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5';

function statusVariant(
  status: ShelterStatus,
): 'success' | 'warning' | 'default' | 'info' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'FULL') return 'warning';
  return 'default';
}

function occupancyPercent(shelter: Shelter): number {
  if (shelter.capacity <= 0) return 0;
  return Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100));
}

export default function SheltersPage() {
  const { user } = useAuth();
  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capacity, setCapacity] = useState('');
  const [occupancy, setOccupancy] = useState('0');
  const [facilities, setFacilities] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<ShelterStatus>('ACTIVE');

  const load = useCallback(async (silent = false) => {
    if (!silent) { setIsLoading(true); setError(null); }
    try {
      const data = await fetchShelters();
      setShelters(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load shelters.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useLiveRefresh(() => load(true), Boolean(user));

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setCapacity('');
    setOccupancy('0');
    setFacilities('');
    setContactInfo('');
    setStatus('ACTIVE');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (shelter: Shelter) => {
    setEditingId(shelter.id);
    setShowForm(true);
    setName(shelter.name);
    setAddress(shelter.location.address ?? '');
    setLatitude(String(shelter.location.latitude));
    setLongitude(String(shelter.location.longitude));
    setCapacity(String(shelter.capacity));
    setOccupancy(String(shelter.currentOccupancy));
    setFacilities(shelter.facilities.join(', '));
    setContactInfo(shelter.contactInfo);
    setStatus(shelter.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = Number(latitude);
    const lng = Number(longitude);
    const cap = Number(capacity);
    const occ = Number(occupancy);

    if (!name.trim() || !contactInfo.trim() || latitude === '' || longitude === '' || capacity === '') {
      setError('Please fill in all required fields.');
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(cap) || Number.isNaN(occ)) {
      setError('Latitude, longitude, capacity, and occupancy must be valid numbers.');
      return;
    }

    if (occ > cap) {
      setError('Occupancy cannot exceed capacity.');
      return;
    }

    const payload = {
      name: name.trim(),
      location: {
        latitude: lat,
        longitude: lng,
        address: address.trim() || undefined,
      },
      capacity: cap,
      currentOccupancy: occ,
      facilities: facilities
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      contactInfo: contactInfo.trim(),
      status,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateShelter(editingId, payload);
        setShelters((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await createShelter(payload);
        setShelters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      resetForm();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to save shelter.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this shelter?')) return;
    setError(null);
    try {
      await deleteShelter(id);
      setShelters((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to delete shelter.',
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Home className="text-orange-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Shelters</h1>
            <p className="text-slate-400 text-sm">
              {isAuthority
                ? 'Manage emergency shelter capacity and occupancy'
                : 'View available emergency shelters near you'}
            </p>
          </div>
        </div>

        {isAuthority && (
          <Button
            variant={showForm ? 'outline' : 'primary'}
            size="md"
            onClick={() => {
              if (showForm) resetForm();
              else {
                setEditingId(null);
                setShowForm(true);
              }
            }}
          >
            {showForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Add Shelter
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-red-800/60 text-red-400 text-sm">{error}</Card>
      )}

      {isAuthority && showForm && (
        <Card className="mb-6">
          <CardTitle className="mb-4">
            {editingId ? 'Edit Shelter' : 'Create Shelter'}
          </CardTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="shelter-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="shelter-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Community Hall Shelter"
                  required
                />
              </div>

              <div>
                <label htmlFor="shelter-capacity" className={labelClass}>
                  Capacity
                </label>
                <input
                  id="shelter-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="shelter-occupancy" className={labelClass}>
                  Current Occupancy
                </label>
                <input
                  id="shelter-occupancy"
                  type="number"
                  min={0}
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="shelter-lat" className={labelClass}>
                  Latitude
                </label>
                <input
                  id="shelter-lat"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={inputClass}
                  placeholder="23.0225"
                  required
                />
              </div>

              <div>
                <label htmlFor="shelter-lng" className={labelClass}>
                  Longitude
                </label>
                <input
                  id="shelter-lng"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={inputClass}
                  placeholder="72.5714"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="shelter-address" className={labelClass}>
                  Address <span className="text-slate-500 normal-case">(optional)</span>
                </label>
                <input
                  id="shelter-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="Street / landmark"
                />
              </div>

              <div>
                <label htmlFor="shelter-contact" className={labelClass}>
                  Contact Info
                </label>
                <input
                  id="shelter-contact"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className={inputClass}
                  placeholder="Phone or email"
                  required
                />
              </div>

              <div>
                <label htmlFor="shelter-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="shelter-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShelterStatus)}
                  className={inputClass}
                >
                  {SHELTER_STATUSES.filter(s => s !== 'FULL').map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Active shelters become full automatically when occupancy reaches capacity.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="shelter-facilities" className={labelClass}>
                  Facilities <span className="text-slate-500 normal-case">(comma-separated)</span>
                </label>
                <input
                  id="shelter-facilities"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className={inputClass}
                  placeholder="Food, Medical, Bedding, Washrooms"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" loading={isSaving}>
              {editingId ? 'Save Changes' : 'Create Shelter'}
            </Button>
          </form>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-800 border border-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && shelters.length === 0 && (
        <Card className="text-center py-12 text-slate-400">
          No shelters available yet.
          {isAuthority && ' Create the first shelter to get started.'}
        </Card>
      )}

      {!isLoading && shelters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shelters.map((shelter) => {
            const percent = occupancyPercent(shelter);
            return (
              <Card key={shelter.id} className="!p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-base font-semibold text-white">{shelter.name}</h2>
                  <Badge variant={statusVariant(shelter.status)}>{shelter.status}</Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-400 mb-4 flex-1">
                  <p className="inline-flex items-start gap-1.5">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-orange-400" />
                    <span>
                      {shelter.location.address ||
                        `${shelter.location.latitude.toFixed(4)}, ${shelter.location.longitude.toFixed(4)}`}
                    </span>
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <Phone size={14} className="text-orange-400" />
                    {shelter.contactInfo}
                  </p>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Occupancy</span>
                    <span>
                      {shelter.currentOccupancy} / {shelter.capacity} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 100
                          ? 'bg-red-500'
                          : percent >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {shelter.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {shelter.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-[11px] text-slate-300"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                )}

                {isAuthority && (
                  <div className="pt-3 border-t border-slate-700/60 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => startEdit(shelter)}
                      >
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Delete ${shelter.name}`}
                        onClick={() => handleDelete(shelter.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
