'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AssignmentStatusBadge } from '@/components/volunteers/AssignmentStatusBadge';
import { Users, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchVolunteers, removeAssignment } from '@/lib/assignments';
import { Button } from '@/components/ui/Button';
import { Volunteer } from '@/types';

export default function VolunteersPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async (silent = false) => {
    try {
      const data = await fetchVolunteers();
      setVolunteers(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to load responders.');
    } finally {
      setIsLoading(false);
    }
  };

  useLiveRefresh(() => load(true), user?.role === 'authority' || user?.role === 'admin');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    if (user.role !== 'authority' && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role !== 'authority' && user?.role !== 'admin') return;

    load();
  }, [user, isAuthLoading]);

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm('Remove this assignment? The volunteer request history will be retained.')) return;
    setRemovingId(assignmentId);
    setError(null);
    try {
      await removeAssignment(assignmentId);
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to remove assignment.');
    } finally {
      setRemovingId(null);
    }
  };

  if (isAuthLoading || (user && user.role !== 'authority' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const activeTasks = volunteers.flatMap(v => v.activeAssignments ?? []);
  const visible = volunteers.filter(v => (
    [v.name, v.email, ...(v.activeIncidents ?? []).map(i => i.title)].join(' ').toLowerCase().includes(search.toLowerCase()) &&
    (!taskFilter || v.activeAssignments?.some(a => a.status === taskFilter))
  ));
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Volunteer Force</h1>
          <p className="text-slate-400 text-sm">
            Coordinate responders, follow task progress, and manage active assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[['Responders', volunteers.length], ['Active assignments', activeTasks.length], ['Working now', activeTasks.filter(a => a.status === 'IN_PROGRESS').length]].map(([label, value]) =>
          <Card key={label} className="!p-5"><p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p><p className="text-3xl font-semibold mt-2 text-white">{value}</p></Card>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-60"><Search size={16} className="absolute left-3 top-3 text-slate-500" /><input aria-label="Search responders" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or incident" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm" /></div>
        <select aria-label="Filter responders by task status" value={taskFilter} onChange={e => setTaskFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm"><option value="">All task statuses</option><option value="ASSIGNED">Awaiting acceptance</option><option value="ACCEPTED">Accepted</option><option value="IN_PROGRESS">In progress</option></select>
        <Link href="/volunteer-requests"><Button variant="outline">Review help offers</Button></Link>
      </div>
      {!isLoading && volunteers.length > 0 && !visible.length && <Card>No responders match your search.</Card>}
      {error && (
        <Card className="mb-4 border-red-800/60 text-red-400 text-sm">{error}</Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-800 border border-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && volunteers.length === 0 && (
        <Card className="text-center py-12 text-slate-400">
          No active responders yet. Responders appear here once citizens offer help and are
          approved for incident assignments.
        </Card>
      )}

      {!isLoading && volunteers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((volunteer) => (
            <Card key={volunteer.id} className="!p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {volunteer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-sm font-semibold text-white truncate">
                      {volunteer.name}
                    </h2>
                    <Badge variant={volunteer.isActive ? 'success' : 'default'}>{volunteer.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{volunteer.email}</p>
                  {volunteer.activeAssignments && volunteer.activeAssignments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {volunteer.activeAssignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 space-y-3">
                          <Link href={`/incidents/${assignment.incidentId}`} className="block text-sm text-slate-200 hover:text-orange-400">{assignment.incidentTitle}</Link>
                          <div><AssignmentStatusBadge status={assignment.status} /></div>
                          <Button variant="danger" size="sm" loading={removingId === assignment.id} onClick={() => handleRemoveAssignment(assignment.id)}>
                            Remove assignment
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
