'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Home,
  Users,
  ClipboardList,
  PlusCircle,
  Bell,
  Handshake,
  Package,
  BarChart3,
  ShieldAlert,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useVolunteerCapability } from '@/hooks/useVolunteerCapability';
import { Role } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { href: '/incidents/report', label: 'Report Incident', icon: PlusCircle },
    { href: '/map', label: 'Map View', icon: Map },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Resource Directory', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  volunteer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/volunteers/tasks', label: 'Assigned Tasks', icon: ClipboardList },
    { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { href: '/incidents/report', label: 'Report Incident', icon: PlusCircle },
    { href: '/map', label: 'Map View', icon: Map },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Resources', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  authority: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents', label: 'Incident Control', icon: AlertTriangle },
    { href: '/volunteer-requests', label: 'Volunteer Requests', icon: Handshake },
    { href: '/volunteers', label: 'Volunteer Force', icon: Users },
    { href: '/shelters', label: 'Shelter Management', icon: Home },
    { href: '/resources', label: 'Resource Inventory', icon: Package },
    { href: '/analytics', label: 'System Analytics', icon: BarChart3 },
    { href: '/map', label: 'Map View', icon: Map },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents', label: 'Incidents Control', icon: AlertTriangle },
    { href: '/volunteer-requests', label: 'Volunteer Requests', icon: Handshake },
    { href: '/volunteers', label: 'Volunteer Force', icon: Users },
    { href: '/shelters', label: 'Shelter Management', icon: Home },
    { href: '/resources', label: 'Resource Inventory', icon: Package },
    { href: '/analytics', label: 'System Analytics', icon: BarChart3 },
    { href: '/admin', label: 'Admin Center', icon: ShieldAlert },
    { href: '/map', label: 'Map View', icon: Map },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

const VOLUNTEER_TASK_ITEM: NavItem = {
  href: '/volunteers/tasks',
  label: 'Assigned Tasks',
  icon: ClipboardList,
};

const CITIZEN_ROLES: Role[] = ['citizen', 'volunteer'];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { hasVolunteerCapability, isLoading: isCapabilityLoading } =
    useVolunteerCapability();

  if (!user) return null;

  const baseItems = BASE_NAV[user.role] ?? BASE_NAV.citizen;
  const isCitizenLike = CITIZEN_ROLES.includes(user.role);

  const navItems = [...baseItems];
  if (isCitizenLike && hasVolunteerCapability) {
    const tasksIndex = navItems.findIndex((i) => i.href === '/volunteers/tasks');
    if (tasksIndex === -1) {
      navItems.splice(1, 0, VOLUNTEER_TASK_ITEM);
    }
  }

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 fixed top-14 left-0 bottom-0 flex flex-col z-30 font-sans">
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/60">
        <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
          Operating Console Navigation
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {isLoading || isCapabilityLoading ? (
          <p className="px-3 py-2 text-xs text-slate-500 font-mono">Loading menu…</p>
        ) : (
          navItems.map(({ href, label, icon: Icon }) => {
            const hasMoreSpecificMatch = navItems.some(
              (other) =>
                other.href !== href &&
                other.href.length > href.length &&
                (pathname === other.href || pathname.startsWith(`${other.href}/`)),
            );
            const isActive =
              pathname === href ||
              (pathname.startsWith(`${href}/`) && !hasMoreSpecificMatch);

            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-all duration-100',
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs">
        <div>
          <p className="text-xs text-slate-200 font-bold truncate max-w-[120px]">{user.name}</p>
          <p className="text-[10px] text-amber-400 font-mono uppercase">{user.role}</p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          STABLE
        </span>
      </div>
    </aside>
  );
}
