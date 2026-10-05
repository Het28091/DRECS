'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HandHeart, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import {
  fetchAllVolunteerRequests,
  reviewVolunteerRequest,
} from '@/lib/volunteerRequests';
import { formatDate } from '@/lib/utils';
import { VolunteerRequest, VolunteerRequestStatus } from '@/types';

const selectClass =
  'px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50';

function requesterName(request: VolunteerRequest): string {
  if (typeof request.userId === 'object' && request.userId !== null) {
    return request.userId.name;
  }
  return 'Citizen';
}

function requesterEmail(request: VolunteerRequest): string | null {
  if (typeof request.userId === 'object' && request.userId !== null && request.userId.email) {
    return request.userId.email;
  }
  return null;
}

function incidentTitle(request: VolunteerRequest): string {
  if (typeof request.incidentId === 'object' && request.incidentId !== null) {
    return request.incidentId.title ?? 'Incident';
  }
  return 'Incident';
}

function incidentId(request: VolunteerRequest): string | null {
  if (typeof request.incidentId === 'object' && request.incidentId !== null) {
    return request.incidentId.id;
  }
  return null;
}

function StatusPill({ status }: { status: VolunteerRequestStatus }) {
  const styles: Record<VolunteerRequestStatus, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400',
    APPROVED: 'bg-green-500/10 text-green-400',
    REJECTED: 'bg-red-500/10 text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function VolunteerRequestsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    if (user.role !== 'authority' && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setIsLoading(true); setError(null); }
    try {
      const data = await fetchAllVolunteerRequests(
        statusFilter as VolunteerRequestStatus | undefined,
      );
      setRequests(data);
      setError(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load volunteer requests.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useLiveRefresh(() => load(true), user?.role === 'authority' || user?.role === 'admin');

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role !== 'authority' && user?.role !== 'admin') return;
    load();
  }, [user, isAuthLoading, load]);

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    setError(null);
    try {
      await reviewVolunteerRequest(requestId, status);
      // Re-read the selected dataset so a reviewed request immediately leaves a
      // PENDING filter and the server remains the source of truth.
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to review request.',
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (isAuthLoading || (user && user.role !== 'authority' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <HandHeart className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Volunteer Requests</h1>
          <p className="text-slate-400 text-sm">
            Review citizen offers to help across all incidents
          </p>
        </div>
      </div>

      <Card className="!p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-slate-300 text-sm font-medium">
          <Filter size={16} className="text-orange-400" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Filter requests by status" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-red-800/60 text-red-400 text-sm">{error}</Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 border border-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <Card className="text-center py-12 text-slate-400">
          No volunteer requests match the current filters.
        </Card>
      )}

      {!isLoading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((request) => {
            const incidentUrl = incidentId(request);
            return (
              <Card key={request.id} className="!p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h2 className="text-base font-semibold text-white">
                        {requesterName(request)}
                      </h2>
                      <StatusPill status={request.status} />
                    </div>
                    {requesterEmail(request) && (
                      <p className="text-xs text-slate-500 mb-2">{requesterEmail(request)}</p>
                    )}

                    <p className="text-sm text-slate-300 mb-1">
                      <span className="text-slate-500 font-medium">Incident:</span>{' '}
                      {incidentUrl ? (
                        <Link
                          href={`/incidents/${incidentUrl}`}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          {incidentTitle(request)}
                        </Link>
                      ) : (
                        incidentTitle(request)
                      )}
                    </p>

                    {request.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {request.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {request.experience && (
                      <p className="text-xs text-slate-400 mb-1">
                        <span className="text-slate-500 font-medium">Experience:</span>{' '}
                        {request.experience}
                      </p>
                    )}
                    {request.message && (
                      <p className="text-xs text-slate-400 mb-1">
                        <span className="text-slate-500 font-medium">Message:</span>{' '}
                        {request.message}
                      </p>
                    )}
                    {request.phoneNumber && (
                      <p className="text-xs text-slate-400 mb-1">
                        <span className="text-slate-500 font-medium">Phone:</span>{' '}
                        {request.phoneNumber}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-2">
                      Submitted {request.createdAt ? formatDate(request.createdAt) : ''}
                    </p>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={reviewingId === request.id}
                        disabled={request.canApprove === false}
                            onClick={() => handleReview(request.id, 'APPROVED')}
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={reviewingId === request.id}
                        onClick={() => handleReview(request.id, 'REJECTED')}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

