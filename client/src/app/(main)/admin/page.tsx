'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, Search, UserCheck, UserX, Shield, Filter, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { User, Role } from '@/types';
import { getAllUsers, updateUserRole, toggleUserStatus, getAdminOverview } from '@/lib/admin';

export default function AdminPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [systemStats, setSystemStats] = useState<{
    users: { total: number; citizens: number; authorities: number; admins: number; volunteers: number; inactive: number };
    counts: { incidents: number; shelters: number; resources: number };
  } | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers({
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await getAdminOverview();
      setSystemStats(data.systemStats);
    } catch (err) {
      console.error('Failed to load system overview', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
      fetchOverview();
    }
  }, [currentUser, fetchUsers, fetchOverview]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      await fetchUsers();
      await fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user's account?`)) return;
    setActionLoading(userId);
    try {
      await toggleUserStatus(userId, !currentStatus);
      await fetchUsers();
      await fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  if (isAuthLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="text-orange-500" size={26} />
            System Administration Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Central user management, role privileges, and system metrics audit.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      {systemStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-white mt-1">{systemStats.users.total}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Citizens</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{systemStats.users.citizens}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Volunteers</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{systemStats.users.volunteers}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Authorities</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{systemStats.users.authorities}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{systemStats.users.admins}</p>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deactivated</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{systemStats.users.inactive}</p>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="p-4 bg-slate-900/80 border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search user by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-sm text-white pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Roles</option>
            <option value="citizen">Citizen</option>
            <option value="volunteer">Volunteer</option>
            <option value="authority">Authority</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Accounts</option>
            <option value="false">Deactivated Accounts</option>
          </select>
        </div>

        <Button variant="ghost" size="sm" onClick={() => { fetchUsers(); fetchOverview(); }} className="text-slate-400 hover:text-white">
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading system accounts…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No accounts match the specified criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const regDate = new Date(u.createdAt).toLocaleDateString();

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                      </td>

                      <td className="p-4">
                        {isSelf ? (
                          <Badge variant="danger" className="capitalize">
                            Admin (You)
                          </Badge>
                        ) : (
                          <select
                            value={u.role}
                            disabled={actionLoading === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className="bg-slate-800 text-xs font-semibold text-orange-400 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-orange-500"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="authority">Authority</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>

                      <td className="p-4">
                        {u.isActive ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <UserCheck size={12} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <UserX size={12} /> Deactivated
                          </Badge>
                        )}
                      </td>

                      <td className="p-4 text-slate-400 text-xs font-mono">{regDate}</td>

                      <td className="p-4 text-right">
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={u.isActive ? 'ghost' : 'outline'}
                            disabled={actionLoading === u.id}
                            onClick={() => handleStatusToggle(u.id, u.isActive)}
                            className={`text-xs ${
                              u.isActive
                                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                                : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate Account'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
