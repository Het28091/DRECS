'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createIncident } from '@/lib/incidents';
import { INCIDENT_CATEGORIES, INCIDENT_SEVERITIES } from '@/lib/constants';
import { IncidentSeverity } from '@/types';

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm transition-all';

const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5';

export default function ReportIncidentPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof INCIDENT_CATEGORIES)[number]>('Flood');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locSuccessMsg, setLocSuccessMsg] = useState('');

  // Auto-detect browser location on page load
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleDetectLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      setLocSuccessMsg('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          setLocSuccessMsg(`GPS Coordinates detected (${lat}, ${lng})`);
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation access failed or denied:', err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanAddress = address.trim();

    const lat = Number(latitude);
    const lng = Number(longitude);

    const errors: Record<string, string[]> = {};
    const addError = (field: string, message: string) => {
      errors[field] = [...(errors[field] ?? []), message];
    };

    if (cleanTitle.length < 3) {
      addError('title', 'Title must be at least 3 characters long (cannot be whitespace-only).');
    }
    if (cleanTitle.length > 120) {
      addError('title', 'Title must be at most 120 characters long.');
    }

    if (cleanDesc.length < 10) {
      addError('description', 'Description must be at least 10 characters long (cannot be whitespace-only).');
    }
    if (cleanDesc.length > 2000) {
      addError('description', 'Description must be at most 2000 characters long.');
    }

    if (cleanTitle.toLowerCase() === cleanDesc.toLowerCase() && cleanTitle.length > 0) {
      addError('description', 'Title and description cannot be identical.');
    }

    if (latitude === '') addError('location', 'Latitude is required (click Detect My Location).');
    if (longitude === '') addError('location', 'Longitude is required (click Detect My Location).');
    if (latitude !== '' && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
      addError('location', 'Latitude must be between -90 and 90.');
    }
    if (longitude !== '' && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
      addError('location', 'Longitude must be between -180 and 180.');
    }
    if (cleanAddress.length > 300) {
      addError('location', 'Address must be at most 300 characters long.');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the highlighted validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createIncident({
        title: cleanTitle,
        description: cleanDesc,
        category,
        severity,
        location: {
          latitude: lat,
          longitude: lng,
          address: cleanAddress || undefined,
        },
      });
      router.push('/incidents/my');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        message?: string;
      };
      const serverFieldErrors = axiosErr.response?.data?.errors;
      if (serverFieldErrors) setFieldErrors(serverFieldErrors);
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to report incident. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Report Incident</h1>
          <p className="text-slate-400 text-sm">
            Submit an emergency report for authority review & AI priority assessment
          </p>
        </div>
      </div>

      <Card>
        <div className="mb-5 p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-300">
          <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 font-bold flex items-center gap-1">
            <ShieldCheck size={14} /> Automated Verification Active
          </span>
          <p className="text-[11px] text-slate-400">
            Reports are verified for text structure. Inputs containing random digits (e.g. 12312 41jk23), keyboard mash, or XSS payloads will be rejected.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-900/30 border border-red-800/60 text-red-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="title" className={labelClass}>
                Title <span className="text-orange-400">*</span>
              </label>
              <span className={`text-[10px] ${title.length > 120 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                {title.length}/120
              </span>
            </div>
            <input
              id="title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of emergency (e.g. Flash Flood near MG Road)"
              className={inputClass}
            />
            {fieldErrors.title && <p className="text-xs text-red-400 mt-1">{fieldErrors.title[0]}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="description" className={labelClass}>
                Description <span className="text-orange-400">*</span>
              </label>
              <span className={`text-[10px] ${description.length > 2000 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="description"
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the emergency situation, immediate hazards, trapped individuals, or medical urgency in detail…"
              className={`${inputClass} resize-y min-h-[100px]`}
            />
            {fieldErrors.description && <p className="text-xs text-red-400 mt-1">{fieldErrors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-orange-400">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof INCIDENT_CATEGORIES)[number])
                }
                className={inputClass}
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="severity" className={labelClass}>
                Initial Perceived Priority <span className="text-orange-400">*</span>
              </label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className={inputClass}
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60">
            <div className="flex items-center justify-between gap-2 mb-3 mt-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-orange-400" />
                <p className="text-sm font-medium text-slate-200">Location Coordinates <span className="text-orange-400">*</span></p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
              >
                <Navigation size={13} className={isLocating ? 'animate-spin' : ''} />
                {isLocating ? 'Detecting GPS…' : 'Detect My Location'}
              </Button>
            </div>

            {locSuccessMsg && (
              <p className="text-xs text-emerald-400 mb-3 font-mono">{locSuccessMsg}</p>
            )}

            {fieldErrors.location && <p className="text-xs text-red-400 mb-3">{fieldErrors.location[0]}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="latitude" className={labelClass}>
                  Latitude <span className="text-orange-400">*</span>
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Click Detect My Location"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="longitude" className={labelClass}>
                  Longitude <span className="text-orange-400">*</span>
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Click Detect My Location"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="address" className={labelClass}>
                  Landmark / Street Address <span className="text-slate-500 normal-case font-normal">(optional)</span>
                </label>
                <span className={`text-[10px] ${address.length > 300 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                  {address.length}/300
                </span>
              </div>
              <input
                id="address"
                type="text"
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nearby landmark or street address (e.g. Near City Hospital, MG Road & Park Street)"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Submit Emergency Report
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/incidents/my')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
