'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, AlertTriangle, Handshake, ClipboardList, Home, Package, Shield, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Notification } from '@/types';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import { getSocket } from '@/lib/socket';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const pending = useRef(false);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifications(data.notifications || []);
      setLoadError('');
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setLoadError('Unable to load this page. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveRefresh(() => fetchNotifications(true), Boolean(user));

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notification socket events
    const socket = getSocket();
    const handleNewNotification = (newNotif: Notification) => {
      void fetchNotifications(true);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, isAlreadyRead: boolean) => {
    if (isAlreadyRead || pending.current) return;
    pending.current = true; setMarking(true);
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      await fetchNotifications(true);
    } catch (err) {
      setLoadError('Unable to mark notification as read. Please retry.');
    } finally { pending.current = false; setMarking(false); }
  };

  const handleMarkAllRead = async () => {
    if (pending.current) return;
    pending.current = true; setMarking(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setLoadError('Unable to mark notifications as read. Please retry.');
    } finally { pending.current = false; setMarking(false); }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INCIDENT_UPDATE':
        return <AlertTriangle size={18} className="text-orange-400" />;
      case 'VOLUNTEER_REQUEST':
        return <Handshake size={18} className="text-sky-400" />;
      case 'ASSIGNMENT_UPDATE':
        return <ClipboardList size={18} className="text-emerald-400" />;
      case 'SHELTER_UPDATE':
        return <Home size={18} className="text-purple-400" />;
      case 'RESOURCE_UPDATE':
        return <Package size={18} className="text-amber-400" />;
      default:
        return <Shield size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {loadError && <ErrorNotice message={loadError} onRetry={() => void fetchNotifications()} />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <Bell className="text-orange-400" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Notification Center
              {unreadCount > 0 && (
                <Badge variant="danger" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Real-time updates regarding incident dispatches, volunteer approvals, and resource allocations.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            disabled={marking} onClick={handleMarkAllRead}
            variant="ghost"
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800 text-xs"
          >
            <CheckCheck size={16} /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading notifications…</div>
      ) : loadError && notifications.length === 0 ? null : notifications.length === 0 ? (
        <Card className="text-center py-16 text-slate-400 bg-slate-900/50">
          <Bell className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-sm font-medium">You have no notifications yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Activity alerts for reported incidents and assignment dispatches will appear here instantly.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const dateFormatted = new Date(n.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <Card
                key={n.id}

                className={`p-4 transition-all duration-150 flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-slate-900 border-orange-500/40 shadow-lg shadow-orange-500/5'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-500 mt-2 block font-mono">
                      {dateFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                {!n.isRead && <Button variant="outline" disabled={marking} onClick={() => void handleMarkAsRead(n.id, n.isRead)}>Mark read</Button>}
                {n.link && (
                  <Link
                    href={n.link.startsWith('/') && !n.link.startsWith('//') ? n.link : '/notifications'}
                    onClick={() => void handleMarkAsRead(n.id, n.isRead)}
                    className="p-2 text-slate-400 hover:text-orange-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 shrink-0 transition-colors"
                    aria-label="View related record" title="View related record"
                  >
                    <ExternalLink size={16} />
                  </Link>
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
