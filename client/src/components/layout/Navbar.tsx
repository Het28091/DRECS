'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * High-utility top navigation console bar.
 */
export function Navbar() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const displayName = isLoading ? '…' : user?.name ?? 'Guest';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-white flex items-center px-5 justify-between fixed top-0 left-0 right-0 z-40 shadow-xs">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 group">
        <div className="p-1 rounded bg-amber-600 text-white">
          <Shield size={18} />
        </div>
        <span className="font-bold text-base tracking-wider uppercase text-white font-mono">
          DRECS <span className="text-[10px] bg-amber-600/30 text-amber-300 px-1.5 py-0.5 rounded uppercase ml-1 border border-amber-500/30">Console</span>
        </span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Bell size={16} />
        </Link>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200">
          <User size={13} className="text-amber-400" />
          <span className="font-medium hidden sm:block">{displayName}</span>
          {user?.role && (
            <span className="text-[10px] font-mono uppercase bg-slate-700 px-1 rounded text-amber-300">
              {user.role}
            </span>
          )}
        </div>

        <button
          id="navbar-logout"
          aria-label="Logout"
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
          title="Logout"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
