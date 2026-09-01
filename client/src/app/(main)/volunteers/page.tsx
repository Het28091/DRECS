'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MapPin } from 'lucide-react';
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
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Responders</h1>
          <p className="text-slate-400 text-sm">
            Citizens actively participating in incident response
          </p>
        </div>
      </div>

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
          {volunteers.map((volunteer) => (
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
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{volunteer.email}</p>
                  {volunteer.activeIncidents && volunteer.activeIncidents.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        Active Incidents
                      </p>
                      <div className="space-y-1">
                        {volunteer.activeIncidents.map((incident) => (
                          <p
                            key={incident.id}
                            className="text-xs text-slate-400 flex items-center gap-1 truncate"
                          >
                            <MapPin size={11} className="text-orange-400/70 shrink-0" />
                            {incident.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {volunteer.activeAssignments && volunteer.activeAssignments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {volunteer.activeAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 truncate">{assignment.incidentTitle}</span>
                          <Button variant="danger" size="sm" loading={removingId === assignment.id} onClick={() => handleRemoveAssignment(assignment.id)}>
                            Remove Assignment
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
