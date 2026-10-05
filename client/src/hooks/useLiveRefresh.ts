'use client';
import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';

// Refresh data in place, preserving form drafts and page position.
export function useLiveRefresh(refresh: () => Promise<unknown> | void, enabled = true) {
  const { socket } = useSocket();
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    if (!enabled) return;
    let busy = false;
    let disposed = false;
    let pending = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      if (disposed || document.visibilityState === 'hidden') return;
      if (busy) { pending = true; return; }
      busy = true;
      try { await latest.current(); } catch { /* Loaders display errors. */ }
      finally { busy = false; if (pending && !disposed) { pending = false; schedule(); } }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(run, 200); };
    socket?.on('data_changed', schedule);
    socket?.on('connect', schedule);
    window.addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', schedule);
    const interval = setInterval(schedule, 30_000);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(interval);
      socket?.off('data_changed', schedule);
      socket?.off('connect', schedule);
      window.removeEventListener('focus', schedule);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [socket, enabled]);
}
