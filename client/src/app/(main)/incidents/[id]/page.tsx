'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Shield,
  Users,
  HandHeart,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge, SeverityBadge } from '@/components/incidents/IncidentBadges';
import { StatusTimeline } from '@/components/incidents/StatusTimeline';
import { AssignmentStatusBadge } from '@/components/volunteers/AssignmentStatusBadge';
import { fetchIncidentById, updateIncidentStatus, reviewIncident } from '@/lib/incidents';
import { fetchIncidentAssignments, fetchMyAssignments } from '@/lib/assignments';
import {
  createVolunteerRequest,
  fetchIncidentVolunteerRequests,
  fetchMyVolunteerRequests,
  reviewVolunteerRequest,
} from '@/lib/volunteerRequests';
import { formatDate } from '@/lib/utils';
import {
  Assignment,
  Incident,
  IncidentStatus,
  VolunteerRequest,
} from '@/types';

const selectClass =
  'w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500';

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500';

function volunteerName(assignment: Assignment): string {
  if (typeof assignment.volunteerId === 'object' && assignment.volunteerId !== null) {
    return assignment.volunteerId.name;
  }
  return 'Volunteer';
}

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

function RequestStatusPill({ status }: { status: VolunteerRequest['status'] }) {
  const styles: Record<VolunteerRequest['status'], string> = {
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

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const id = typeof params.id === 'string' ? params.id : '';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<IncidentStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);

  // Volunteer request (citizen offer help)
  const [volunteerRequests, setVolunteerRequests] = useState<VolunteerRequest[]>([]);
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const isAuthority = user?.role === 'authority' || user?.role === 'admin';
  const isCitizen = user?.role === 'citizen' || user?.role === 'volunteer';
  const backHref =
    user?.role === 'volunteer'
      ? '/volunteers/tasks'
      : isAuthority
        ? '/dashboard'
        : '/dashboard';

  const loadIncident = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) { setIsLoading(true); setError(null); }
    try {
      const data = await fetchIncidentById(id);
      setIncident(data);
      setStatusDraft(current => !silent || !current || !(data.allowedTransitions ?? []).includes(current) ? data.status : current);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      if (axiosErr.response?.status === 403 || axiosErr.response?.status === 404) {
        setError(axiosErr.response?.data?.message || 'Incident not found or access denied.');
      } else {
        setError(
          axiosErr.response?.data?.message ||
            axiosErr.message ||
            'Failed to load incident.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadAssignments = useCallback(async () => {
    if (!id || !isAuthority) return;
    try {
      const assignmentData = await fetchIncidentAssignments(id);
      setAssignments(assignmentData);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load assignment data.',
      );
    }
  }, [id, isAuthority]);

  const loadVolunteerRequests = useCallback(async () => {
    if (!id || !isAuthority) return;
    try {
      const data = await fetchIncidentVolunteerRequests(id);
      setVolunteerRequests(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load volunteer requests.',
      );
    }
  }, [id, isAuthority]);

  const loadCitizenVolunteerState = useCallback(async () => {
    if (!id || !isCitizen) return;
    try {
      const [requests, citizenAssignments] = await Promise.all([
        fetchMyVolunteerRequests(id),
        fetchMyAssignments(),
      ]);
      setVolunteerRequests(requests);
      setMyAssignments(citizenAssignments);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load your volunteer request state.',
      );
    }
  }, [id, isCitizen]);

  useEffect(() => {
    if (isAuthLoading) return;
    loadIncident();
  }, [isAuthLoading, loadIncident]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    if (isAuthority) {
      loadVolunteerRequests();
      loadAssignments();
    } else if (isCitizen) {
      loadCitizenVolunteerState();
    }
  }, [
    isAuthLoading,
    user,
    isAuthority,
    isCitizen,
    loadAssignments,
    loadVolunteerRequests,
    loadCitizenVolunteerState,
  ]);

  useLiveRefresh(async () => {
    await loadIncident(true);
    await Promise.all([loadAssignments(), loadVolunteerRequests(), loadCitizenVolunteerState()]);
  }, Boolean(user) && !isUpdating && !isSubmittingRequest && !reviewingId);

  // Citizen's own request state for this incident
  const myRequest = useMemo(() => {
    if (!user) return null;
    return (
      volunteerRequests.find((r) => {
        const uid = typeof r.userId === 'object' ? r.userId.id : r.userId;
        return uid === user.id;
      }) ?? null
    );
  }, [volunteerRequests, user]);

  const myAssignment = useMemo(() => {
    if (!id) return null;
    return (
      myAssignments.find((assignment) => {
        const assignmentIncidentId =
          typeof assignment.incidentId === 'object'
            ? assignment.incidentId.id
            : assignment.incidentId;
        return assignmentIncidentId === id;
      }) ?? null
    );
  }, [id, myAssignments]);

  const handleIncidentReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!incident || isUpdating) return;
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await reviewIncident(incident.id, status);
      setIncident(updated); setStatusDraft(updated.status);
    } catch (err: any) { setError(err.response?.data?.message || 'Unable to review report.'); }
    finally { setIsUpdating(false); }
  };

  const handleStatusUpdate = async () => {
    if (!incident || !statusDraft || statusDraft === incident.status) return;

    setIsUpdating(true);
    setUpdateMessage(null);
    setError(null);
    try {
      const updated = await updateIncidentStatus(incident.id, statusDraft);
      setIncident(updated);
      setStatusDraft(updated.status);
      setUpdateMessage('Status updated successfully.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to update status.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!incident) return;

    if (isSubmittingRequest) return;
    const errors: Record<string, string> = {};
    const parsedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (!parsedSkills.length || parsedSkills.length > 10 || parsedSkills.some(s => s.length < 2 || s.length > 80)) errors.skills = 'Enter 1 to 10 skills, each 2 to 80 characters.';
    if (experience.trim().length < 10 || experience.trim().length > 2000) errors.experience = 'Describe your experience in 10 to 2000 characters.';
    if (message.trim().length < 10 || message.trim().length > 1000) errors.message = 'Describe how you can help in 10 to 1000 characters.';
    if (!/^\d{10}$/.test(phoneNumber.trim()) || /^(.)\1+$/.test(phoneNumber.trim())) errors.phoneNumber = 'Enter a valid 10-digit phone number without country code or separators.';
    setOfferErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSubmittingRequest(true);
    setRequestMessage(null);
    setError(null);
    try {
      const skillsList = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await createVolunteerRequest(incident.id, {
        skills: skillsList,
        experience: experience.trim(),
        message: message.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setVolunteerRequests((prev) => [created, ...prev]);
      await loadCitizenVolunteerState();
      setRequestMessage('Offer submitted. The authority will review your request.');
      setExperience('');
      setMessage('');
      setPhoneNumber('');
      setSkills('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to submit volunteer request.',
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    setError(null);
    try {
      const updated = await reviewVolunteerRequest(requestId, status);
      setVolunteerRequests((prev) =>
        prev.map((r) => (r.id === requestId ? updated : r)),
      );
      // If approved, an assignment was auto-created — refresh assignments and incident.
      if (status === 'APPROVED' && id) {
        const assignmentData = await fetchIncidentAssignments(id);
        setAssignments(assignmentData);
        const refreshed = await fetchIncidentById(id);
        setIncident(refreshed);
        setStatusDraft(refreshed.status);
      }
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

  const reporterLabel = () => {
    if (!incident) return '—';
    if (typeof incident.reportedBy === 'object' && incident.reportedBy !== null) {
      return incident.reportedBy.name;
    }
    return 'Reporter';
  };

  const reporterEmail = () => {
    if (!incident) return null;
    if (typeof incident.reportedBy === 'object' && incident.reportedBy?.email) {
      return incident.reportedBy.email;
    }
    return null;
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800 border border-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="max-w-xl">
        <Button variant="ghost" size="sm" onClick={() => router.push(backHref)} className="mb-4">
          <ArrowLeft size={16} />
          Back
        </Button>
        <Card className="border-red-800/60 text-red-400 text-sm">{error}</Card>
      </div>
    );
  }

  if (!incident) return null;

  const history = incident.statusHistory ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to incidents
        </Link>

        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="text-orange-400 shrink-0 mt-1" size={28} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white break-words">{incident.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <StatusBadge status={incident.status} />
                <SeverityBadge severity={incident.severity} />
                <span className="text-xs text-slate-500">{incident.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-800/60 text-red-400 text-sm">{error}</Card>
      )}

      {incident.approvalStatus !== 'APPROVED' && <Card className="mb-5 border-amber-500/30">
        <h2 className="font-semibold text-amber-300">{incident.approvalStatus === 'REJECTED' ? 'Report rejected' : 'Awaiting authority approval'}</h2>
        <p className="text-sm text-slate-400 mt-1">This report is visible only to its reporter and authorities.</p>
        {isAuthority && incident.approvalStatus === 'PENDING' && <div className="flex gap-3 mt-4">
          <Button loading={isUpdating} onClick={() => handleIncidentReview('APPROVED')}>Approve report</Button>
          <Button variant="danger" loading={isUpdating} onClick={() => handleIncidentReview('REJECTED')}>Reject report</Button>
        </div>}
      </Card>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardTitle className="mb-3">Description</CardTitle>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </p>
          </Card>

          <Card>
            <CardTitle className="mb-4">Details</CardTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500 mb-1">Category</dt>
                <dd className="text-slate-200">{incident.category}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500 mb-1">Severity</dt>
                <dd>
                  <SeverityBadge severity={incident.severity} />
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Location
                </dt>
                <dd className="text-slate-200">
                  {incident.location.address && (
                    <p className="mb-0.5">{incident.location.address}</p>
                  )}
                  <p className="text-slate-500 text-xs font-mono">
                    {incident.location.latitude.toFixed(5)}, {incident.location.longitude.toFixed(5)}
                  </p>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <User size={12} /> Reporter
                </dt>
                <dd className="text-slate-200">
                  {reporterLabel()}
                  {isAuthority && reporterEmail() && (
                    <p className="text-xs text-slate-500 mt-0.5">{reporterEmail()}</p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Reported
                </dt>
                <dd className="text-slate-200">{formatDate(incident.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          {isCitizen && incident.approvalStatus === 'APPROVED' && ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(incident.status) && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <HandHeart size={16} className="text-orange-400" />
                <CardTitle className="!mb-0">Offer Help</CardTitle>
              </div>

              <p className="text-xs text-slate-400 mb-3">All fields are required. Share relevant skills and a reachable phone number.</p>
              {Object.keys(offerErrors).length > 0 && <ul role="alert" className="text-sm text-red-400 mb-3">{Object.entries(offerErrors).map(([field, text]) => <li key={field}>{text}</li>)}</ul>}
              {requestMessage && <p role="status" className="text-sm text-green-400 mb-3">{requestMessage}</p>}
              {myRequest && myRequest.status !== 'REJECTED' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RequestStatusPill status={myRequest.status} />
                    <span className="text-sm text-slate-300">
                      {myRequest.status === 'APPROVED' &&
                        (myAssignment
                          ? 'You are assigned as a volunteer for this incident.'
                          : 'Your offer was approved. Your assignment is being prepared.')}
                      {myRequest.status === 'PENDING' &&
                        'Your offer is awaiting review by the authorities.'}
                    </span>
                  </div>
                  {myRequest.status === 'PENDING' && (
                    <p className="text-xs text-slate-500">
                      Submitted {myRequest.createdAt ? formatDate(myRequest.createdAt) : ''}
                    </p>
                  )}
                  {myRequest.status === 'APPROVED' && myAssignment && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span>Assignment status:</span>
                      <AssignmentStatusBadge status={myAssignment.status} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequest?.status === 'REJECTED' && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <RequestStatusPill status="REJECTED" />
                      <span>Your previous offer was not approved. You may submit a new offer.</span>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="vr-skills"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      Skills (comma separated)
                    </label>
                    <input
                      id="vr-skills" maxLength={810} aria-invalid={!!offerErrors.skills}
                      type="text"
                      value={skills}
                      onChange={(e) => { setSkills(e.target.value); setOfferErrors(previous => { const { skills: _field, ...rest } = previous; return rest; }); }}
                      placeholder="e.g. First aid, Driving, Rescue"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vr-experience"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      Experience
                    </label>
                    <textarea
                      id="vr-experience" maxLength={2000} aria-invalid={!!offerErrors.experience}
                      value={experience}
                      onChange={(e) => { setExperience(e.target.value); setOfferErrors(previous => { const { experience: _field, ...rest } = previous; return rest; }); }}
                      placeholder="Describe any relevant experience"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vr-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="vr-message" maxLength={1000} aria-invalid={!!offerErrors.message}
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); setOfferErrors(previous => { const { message: _field, ...rest } = previous; return rest; }); }}
                      placeholder="How would you like to help?"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vr-phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="vr-phone" maxLength={10} inputMode="numeric" pattern="[0-9]{10}" aria-invalid={!!offerErrors.phoneNumber}
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setOfferErrors(previous => { const { phoneNumber: _field, ...rest } = previous; return rest; }); }}
                      placeholder="10-digit contact number"
                      className={inputClass}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    loading={isSubmittingRequest}
                    onClick={handleSubmitRequest}
                  >
                    Submit Offer
                  </Button>

                  {requestMessage && (
                    <p className="text-xs text-green-400">{requestMessage}</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {isAuthority && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-orange-400" />
                <CardTitle className="!mb-0">Assigned Responders</CardTitle>
              </div>

              {assignments.length === 0 ? (
                <p className="text-sm text-slate-500 mb-4">
                  No responders assigned yet. Approve a volunteer request below to assign a responder.
                </p>
              ) : (
                <ul className="space-y-3 mb-5">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-slate-700/60 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-slate-200 font-medium">
                          {volunteerName(assignment)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Assigned {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                      <AssignmentStatusBadge status={assignment.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {isAuthority && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <HandHeart size={16} className="text-orange-400" />
                <CardTitle className="!mb-0">Volunteer Requests</CardTitle>
              </div>

              {volunteerRequests.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No citizens have offered help for this incident yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {volunteerRequests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl border border-slate-700/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {requesterName(request)}
                          </p>
                          {requesterEmail(request) && (
                            <p className="text-xs text-slate-500">{requesterEmail(request)}</p>
                          )}
                        </div>
                        <RequestStatusPill status={request.status} />
                      </div>

                      {request.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
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
                        <p className="text-xs text-slate-400 mb-2">
                          <span className="text-slate-500 font-medium">Phone:</span>{' '}
                          {request.phoneNumber}
                        </p>
                      )}

                      {request.status === 'PENDING' && (
                        <div className="flex items-center gap-2 mt-3">
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
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle className="mb-4">Status Timeline</CardTitle>
            <StatusTimeline history={history} showActor={isAuthority} />
          </Card>

          {isAuthority && incident.approvalStatus === 'APPROVED' && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-orange-400" />
                <CardTitle className="!mb-0">Update Status</CardTitle>
              </div>

              <label
                htmlFor="status-update"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                New status
              </label>
              <select
                id="status-update"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as IncidentStatus)}
                className={`${selectClass} mb-3`}
              >
                {[incident.status, ...(incident.allowedTransitions ?? [])].filter(s => s !== 'ASSIGNED' || assignments.some(a => a.status !== 'COMPLETED')).filter(s => !['RESOLVED', 'CLOSED'].includes(s) || s === incident.status || !assignments.some(a => a.status !== 'COMPLETED')).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={isUpdating}
                disabled={!statusDraft || statusDraft === incident.status}
                onClick={handleStatusUpdate}
              >
                Save Status
              </Button>

              {updateMessage && (
                <p className="text-xs text-green-400 mt-3">{updateMessage}</p>
              )}
            </Card>
          )}

          {isCitizen && myRequest?.status === 'PENDING' && (
            <Card className="flex items-start gap-3">
              <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Your volunteer offer is pending review. You will be able to see your task in
                Assigned Tasks once the authority approves it.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

