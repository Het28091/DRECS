'use client';

import Link from 'next/link';
import { LayoutDashboard, AlertTriangle, Users, Home, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVolunteerCapability } from '@/hooks/useVolunteerCapability';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { hasVolunteerCapability } = useVolunteerCapability();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const isAuthority = user.role === 'authority' || user.role === 'admin';
  const canAccessTasks = hasVolunteerCapability || user.role === 'volunteer';

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="text-orange-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Welcome back, {user.name.split(' ')[0]}. Here is your quick access panel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href={isAuthority ? '/incidents' : '/incidents/my'}>
          <Card className="!p-5 hover:border-orange-500/40 transition-colors">
            <AlertTriangle className="text-orange-400 mb-3" size={22} />
            <p className="text-sm font-medium text-slate-200 mb-1">
              {isAuthority ? 'Manage Incidents' : 'My Incidents'}
            </p>
            <p className="text-xs text-slate-500">
              {isAuthority ? 'Review and update all incidents' : 'Track incidents you reported'}
            </p>
          </Card>
        </Link>

        {canAccessTasks && (
          <Link href="/volunteers/tasks">
            <Card className="!p-5 hover:border-orange-500/40 transition-colors">
              <ClipboardList className="text-orange-400 mb-3" size={22} />
              <p className="text-sm font-medium text-slate-200 mb-1">Assigned Tasks</p>
              <p className="text-xs text-slate-500">Respond to incidents assigned to you</p>
            </Card>
          </Link>
        )}

        {isAuthority && (
          <Link href="/volunteer-requests">
            <Card className="!p-5 hover:border-orange-500/40 transition-colors">
              <Users className="text-orange-400 mb-3" size={22} />
              <p className="text-sm font-medium text-slate-200 mb-1">Volunteer Requests</p>
              <p className="text-xs text-slate-500">Review citizen offers to help</p>
            </Card>
          </Link>
        )}

        <Link href="/shelters">
          <Card className="!p-5 hover:border-orange-500/40 transition-colors">
            <Home className="text-orange-400 mb-3" size={22} />
            <p className="text-sm font-medium text-slate-200 mb-1">Shelters</p>
            <p className="text-xs text-slate-500">Find nearby emergency shelters</p>
          </Card>
        </Link>
      </div>

      {!isAuthority && (
        <Card className="!p-6">
          <CardTitle className="mb-3">Report an Incident</CardTitle>
          <p className="text-sm text-slate-400 mb-4">
            If you are facing an emergency or have witnessed one, report it immediately so the
            authorities and community can respond.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/incidents/report">
              <Button variant="primary">
                <AlertTriangle size={16} />
                Report Incident
              </Button>
            </Link>
            <Link href="/incidents">
              <Button variant="outline">View All Incidents</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

