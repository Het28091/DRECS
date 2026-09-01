'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, MapPin, CheckCircle2, Play, Handshake } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AssignmentStatusBadge } from '@/components/volunteers/AssignmentStatusBadge';
import { SeverityBadge } from '@/components/incidents/IncidentBadges';
import { fetchMyAssignments, updateAssignmentStatus } from '@/lib/assignments';
import { formatDate } from '@/lib/utils';
import {
  Assignment,
  AssignmentIncidentSummary,
  AssignmentStatus,
  IncidentSeverity,
} from '@/types';

function getIncident(assignment: Assignment): AssignmentIncidentSummary | null {
  if (typeof assignment.incidentId === 'object' && assignment.incidentId !== null) {
    return assignment.incidentId;
  }
  return null;
}

const NEXT_ACTION: Partial<
  Record<AssignmentStatus, { status: AssignmentStatus; label: string; icon: typeof Play }>
> = {
  ASSIGNED: { status: 'ACCEPTED', label: 'Accept', icon: Handshake },
  ACCEPTED: { status: 'IN_PROGRESS', label: 'Start Work', icon: Play },
  IN_PROGRESS: { status: 'COMPLETED', label: 'Complete', icon: CheckCircle2 },
};

export default function VolunteerTasksPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    // Approved volunteers remain citizens, so citizens with assignments can access
    // their assigned tasks. Authority/admin use the incidents dashboard instead.
    if (user.role === 'authority' || user.role === 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyAssignments();
      setAssignments(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load assignments.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === 'authority' || user?.role === 'admin') return;
    load();
  }, [user, isAuthLoading, load]);

  const handleAction = async (id: string, status: AssignmentStatus) => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await updateAssignmentStatus(id, status);
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to update assignment.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (isAuthLoading || (!user || user.role === 'authority' || user.role === 'admin')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Assigned Tasks</h1>
          <p className="text-slate-400 text-sm">Incidents assigned to you for response</p>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-800/60 text-red-400 text-sm">{error}</Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 border border-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && assignments.length === 0 && (
        <Card className="text-center py-12 text-slate-400">
          No assignments yet. Authority will assign incidents to you when needed.
        </Card>
      )}

      {!isLoading && assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const incident = getIncident(assignment);
            const next = NEXT_ACTION[assignment.status];
            const ActionIcon = next?.icon;

            return (
              <Card key={assignment.id} className="!p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h2 className="text-base font-semibold text-white">
                        {incident?.title ?? 'Incident'}
                      </h2>
                      <AssignmentStatusBadge status={assignment.status} />
                      {incident?.severity && (
                        <SeverityBadge severity={incident.severity as IncidentSeverity} />
                      )}
                    </div>

                    {incident?.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {incident.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {incident?.category && <span>{incident.category}</span>}
                      <span>Assigned {formatDate(assignment.assignedAt)}</span>
                      {incident?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {incident.location.address ||
                            `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
                        </span>
                      )}
                    </div>

                    {incident?.id && (
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="inline-block text-xs text-orange-400 hover:text-orange-300 mt-2"
                      >
                        View incident details →
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {next && ActionIcon && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={updatingId === assignment.id}
                        onClick={() => handleAction(assignment.id, next.status)}
                      >
                        <ActionIcon size={14} />
                        {next.label}
                      </Button>
                    )}
                    {assignment.status === 'COMPLETED' && (
                      <span className="text-xs text-green-400 font-medium">Completed</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
