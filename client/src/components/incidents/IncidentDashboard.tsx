'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, MapPin, Filter, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge, SeverityBadge } from '@/components/incidents/IncidentBadges';
import {
  fetchAllIncidents,
  fetchMyIncidents,
  fetchPublicIncidents,
} from '@/lib/incidents';
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Incident } from '@/types';

const selectClass =
  'px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50';

const isAuthorityRole = (role: string | undefined) =>
  role === 'authority' || role === 'admin';

const getUserId = (value: Incident['reportedBy']): string | null =>
  typeof value === 'object' && value !== null ? value.id : value || null;

function IncidentCard({ incident, isAuthority }: { incident: Incident; isAuthority: boolean }) {
  const reporterName = (inc: Incident) => {
    if (typeof inc.reportedBy === 'object' && inc.reportedBy !== null) {
      return inc.reportedBy.name;
    }
    return 'Unknown';
  };

  return (
    <Card className="!p-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-base font-semibold text-white">{incident.title}</h2>
            <StatusBadge status={incident.status} />
            {incident.approvalStatus !== 'APPROVED' && <span className="text-xs rounded-full px-2 py-1 bg-amber-500/10 text-amber-300">{incident.approvalStatus === 'REJECTED' ? 'Report rejected' : 'Awaiting approval'}</span>}
            <SeverityBadge severity={incident.severity} />
          </div>
          <p className="text-sm text-slate-400 mb-2 line-clamp-2">{incident.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>{incident.category}</span>
            {isAuthority && <span>By {reporterName(incident)}</span>}
            <span>{formatDate(incident.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {incident.location.address ||
                `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/incidents/${incident.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-800">
              View Details
            </Link>
        </div>
      </div>
    </Card>
  );
}

export default function IncidentsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [otherIncidents, setOtherIncidents] = useState<Incident[]>([]);
  const [authorityIncidents, setAuthorityIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approvalFilter, setApprovalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const isAuthority = isAuthorityRole(user?.role);

  const filters = {
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    severity: severityFilter || undefined,
  };

  const load = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) { setIsLoading(true); setError(null); }
    try {
      if (isAuthority) {
        const data = await fetchAllIncidents(filters);
        setAuthorityIncidents(data.filter(i => !approvalFilter || i.approvalStatus === approvalFilter));
        setMyIncidents([]);
        setOtherIncidents([]);
      } else {
        const [mine, publicIncidents] = await Promise.all([
          fetchMyIncidents(),
          fetchPublicIncidents(filters),
        ]);
        setMyIncidents(mine.filter(i => (!statusFilter || i.status === statusFilter) && (!categoryFilter || i.category === categoryFilter) && (!severityFilter || i.severity === severityFilter)));
        setOtherIncidents(
          publicIncidents.filter(
            (incident) =>
              getUserId(incident.reportedBy) !== user.id && (Boolean(statusFilter) || !['CLOSED', 'RESOLVED'].includes(incident.status)),
          ),
        );
        setAuthorityIncidents([]);
      }
      setError(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load incidents.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthority, statusFilter, categoryFilter, severityFilter, approvalFilter]);

  useLiveRefresh(() => load(true), Boolean(user));

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    load();
  }, [isAuthLoading, user, load]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-800 border border-slate-700 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card role="alert" className="border-red-800/60 text-red-400 text-sm">{error}<Button className="ml-3" onClick={() => void load()}>Retry</Button></Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              {isAuthority
                ? 'Review and manage all emergency incidents'
                : 'Public incidents reported by the community'}
            </p>
          </div>
        </div>
        {!isAuthority && (
          <Link href="/incidents/report" className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-800">
              <PlusCircle size={16} />
              Report Incident
            </Link>
        )}
      </div>

      <Card className="!p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-slate-300 text-sm font-medium">
          <Filter size={16} className="text-orange-400" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          {isAuthority && <select aria-label="Filter by approval" value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)} className={selectClass}>
            <option value="">All reviews</option><option value="PENDING">Awaiting approval</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
          </select>}
          <select
            aria-label="Filter incidents by status" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter incidents by category" value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All categories</option>
            {INCIDENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter incidents by severity" value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All severities</option>
            {INCIDENT_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {isAuthority ? (
        <>
          {authorityIncidents.length === 0 ? (
            <Card className="text-center py-12 text-slate-400">
              No incidents match the current filters.
            </Card>
          ) : (
            <div className="space-y-3">
              {authorityIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} isAuthority />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {myIncidents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">My Reported Incidents</h2>
              <div className="space-y-3">
                {myIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} isAuthority={false} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{statusFilter ? 'Community Incidents' : 'Other Active Incidents'}</h2>
            {otherIncidents.length === 0 ? (
              <Card className="text-center py-8 text-slate-400">
                No other incidents reported by the community right now.
              </Card>
            ) : (
              <div className="space-y-3">
                {otherIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} isAuthority={false} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
