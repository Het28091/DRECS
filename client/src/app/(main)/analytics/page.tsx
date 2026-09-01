'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Activity, PieChart as PieIcon, ShieldAlert, Home, Package, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getOverviewStats, getIncidentTrends, getVolunteerActivity, getResourceUtilization } from '@/lib/analytics';
import { OverviewAnalytics } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0284c7', '#f97316', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#64748b'];
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [incidentTrends, setIncidentTrends] = useState<{
    byStatus: { status: string; count: number }[];
    byCategory: { category: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  } | null>(null);

  const [volunteerActivity, setVolunteerActivity] = useState<{
    requestsByStatus: { status: string; count: number }[];
    assignmentsByStatus: { status: string; count: number }[];
  } | null>(null);

  const [resourceUtilization, setResourceUtilization] = useState<{
    byCategory: { category: string; totalQuantity: number; availableQuantity: number; allocatedQuantity: number; itemCount: number }[];
    byStatus: { status: string; count: number }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || (user.role !== 'authority' && user.role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovData, trData, volData, resData] = await Promise.all([
        getOverviewStats(),
        getIncidentTrends(),
        getVolunteerActivity(),
        getResourceUtilization(),
      ]);

      setOverview(ovData.overview);
      setIncidentTrends(trData);
      setVolunteerActivity(volData);
      setResourceUtilization(resData);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'authority' || user?.role === 'admin') {
      loadData();
    }
  }, [user, loadData]);

  if (isAuthLoading || !user || (user.role !== 'authority' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading analytics dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="text-orange-500" size={26} />
            System Analytics & Insights
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time metric aggregated telemetry across disaster response operations.
          </p>
        </div>

        <Button variant="ghost" onClick={loadData} className="text-slate-400 hover:text-white border border-slate-800">
          <RefreshCw size={14} className="mr-2" /> Refresh Telemetry
        </Button>
      </div>

      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Incidents</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{overview.totalIncidents}</h3>
              <p className="text-[11px] text-amber-400 font-medium">{overview.activeIncidents} Active | {overview.criticalIncidents} Critical</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <Home size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shelter Capacity</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{overview.shelterOccupancyRate}%</h3>
              <p className="text-[11px] text-purple-300 font-medium">{overview.totalShelterOccupancy} / {overview.totalShelterCapacity} Occupied</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource Supply</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{overview.availableResourceInventory}</h3>
              <p className="text-[11px] text-emerald-300 font-medium">{overview.allocatedResourceInventory} Allocated to Active Tasks</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response Team</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{overview.activeAssignments}</h3>
              <p className="text-[11px] text-sky-300 font-medium">Active Volunteer Assignments</p>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400">Generating analytical models…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents by Category */}
          {incidentTrends?.byCategory && (
            <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-orange-400" size={18} /> Incidents by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentTrends.byCategory}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Incidents by Severity */}
          {incidentTrends?.bySeverity && (
            <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="text-orange-400" size={18} /> Severity Breakdown
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentTrends.bySeverity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ severity, count }) => `${severity}: ${count}`}
                    >
                      {incidentTrends.bySeverity.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={SEVERITY_COLORS[entry.severity] || COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Resource Utilization by Category */}
          {resourceUtilization?.byCategory && (
            <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="text-emerald-400" size={18} /> Resource Inventory Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceUtilization.byCategory}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="availableQuantity" name="Available Qty" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="allocatedQuantity" name="Allocated Qty" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Volunteer Requests Status Distribution */}
          {volunteerActivity?.requestsByStatus && (
            <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="text-sky-400" size={18} /> Volunteer Request Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={volunteerActivity.requestsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {volunteerActivity.requestsByStatus.map((_entry, idx) => (
                        <Cell key={`cell-vol-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
