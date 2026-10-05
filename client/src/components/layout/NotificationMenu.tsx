'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { getMyNotifications, markNotificationAsRead } from '@/lib/notifications';
import { Notification } from '@/types';

export function NotificationMenu() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const load = async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      setItems(data.notifications); setUnread(data.unreadCount); setError('');
    } catch { setError('Unable to load notifications.'); }
  };
  useLiveRefresh(load, Boolean(user));
  useEffect(() => {
    setItems([]); setUnread(0); setToasts([]); setOpen(false);
    void load();
  }, [user?.id]);
  useEffect(() => {
    const receive = (item: Notification) => {
      setItems(current => [item, ...current.filter(n => n.id !== item.id)]);
      void load();
      setToasts(current => [item, ...current.filter(n => n.id !== item.id)].slice(0, 3));
      clearTimeout(timers.current.get(item.id));
      timers.current.set(item.id, setTimeout(() => {
        setToasts(current => current.filter(n => n.id !== item.id));
        timers.current.delete(item.id);
      }, 8000));
    };
    socket?.on('notification', receive);
    return () => {
      socket?.off('notification', receive);
      timers.current.forEach(clearTimeout); timers.current.clear();
    };
  }, [socket, user?.id]);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  const read = async (item: Notification) => {
    setOpen(false); setToasts(current => current.filter(n => n.id !== item.id));
    if (!item.isRead) {
      try { await markNotificationAsRead(item.id); await load(); }
      catch { setError('Unable to mark notification as read.'); }
    }
  };
  const href = (item: Notification) => item.link?.startsWith('/') && !item.link.startsWith('//') ? item.link : '/notifications';
  return <div ref={container} className="relative">
    <button aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notification-menu" onClick={() => setOpen(!open)} className="relative p-2 rounded hover:bg-slate-800">
      <Bell size={18} />
      {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 px-1 rounded-full bg-orange-600 text-white text-[10px]">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <section id="notification-menu" aria-label="Recent notifications" className="fixed right-3 top-14 sm:absolute sm:right-0 sm:top-auto mt-3 w-80 max-w-[90vw] rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 font-semibold">Notifications <span className="text-slate-400">({unread} unread)</span></div>
      {error && <p role="alert" className="p-4 text-red-300">{error}</p>}
      <div className="max-h-80 overflow-y-auto">
        {!items.length && !error && <p className="p-6 text-slate-400">No notifications yet.</p>}
        {items.slice(0, 8).map(item => <Link key={item.id} href={href(item)} onClick={() => void read(item)} className={`block p-4 border-b border-slate-800 hover:bg-slate-800 ${!item.isRead ? 'bg-orange-500/5' : ''}`}>
          <p className="font-semibold text-slate-100">{!item.isRead && <span className="text-orange-400 mr-1">●</span>}{item.title}</p>
          <p className="mt-1 text-slate-400 leading-relaxed">{item.message}</p>
        </Link>)}
      </div>
      <Link href="/notifications" onClick={() => setOpen(false)} className="block p-3 text-center text-orange-400">View all notifications</Link>
    </section>}
    <div aria-live="polite" aria-atomic="false" className="fixed top-20 right-5 w-80 max-w-[90vw] space-y-3 z-[1000]">
      {toasts.map(item => <div key={item.id} className="relative rounded-xl border border-orange-500/40 bg-slate-900 p-4 pr-9 shadow-xl">
        <button aria-label="Dismiss notification" onClick={() => setToasts(current => current.filter(n => n.id !== item.id))} className="absolute top-3 right-3 text-slate-400"><X size={16} /></button>
        <Link href={href(item)} onClick={() => void read(item)}><p className="font-semibold text-orange-300">{item.title}</p><p className="mt-1 text-slate-300 leading-relaxed">{item.message}</p></Link>
      </div>)}
    </div>
  </div>;
}
