'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
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
import { Role } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents/report', label: 'Report incident', icon: PlusCircle },
    { href: '/map', label: 'Emergency map', icon: Map },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Resource directory', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  volunteer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/volunteers/tasks', label: 'My help offers', icon: ClipboardList },
    { href: '/incidents/report', label: 'Report incident', icon: PlusCircle },
    { href: '/map', label: 'Emergency map', icon: Map },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Resources', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  authority: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/volunteer-requests', label: 'Help offers', icon: Handshake },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Inventory', icon: Package },
    { href: '/supplies', label: 'Shelter supplies', icon: Package },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/map', label: 'Emergency map', icon: Map },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/volunteer-requests', label: 'Help offers', icon: Handshake },
    { href: '/shelters', label: 'Shelters', icon: Home },
    { href: '/resources', label: 'Inventory', icon: Package },
    { href: '/supplies', label: 'Shelter supplies', icon: Package },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin', label: 'Administration', icon: ShieldAlert },
    { href: '/map', label: 'Emergency map', icon: Map },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

const VOLUNTEER_TASK_ITEM: NavItem = {
  href: '/volunteers/tasks',
  label: 'My help offers',
  icon: ClipboardList,
};

const CITIZEN_ROLES: Role[] = ['citizen', 'volunteer'];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (!user) return null;

  const baseItems = BASE_NAV[user.role] ?? BASE_NAV.citizen;
  const isCitizenLike = CITIZEN_ROLES.includes(user.role);

  const navItems = [...baseItems];
  if (isCitizenLike) {
    const tasksIndex = navItems.findIndex((i) => i.href === '/volunteers/tasks');
    if (tasksIndex === -1) {
      navItems.splice(1, 0, VOLUNTEER_TASK_ITEM);
    }
  }

  const navigation = (<nav aria-label="Main navigation" className="flex-1 p-3 pt-5 space-y-1.5 overflow-y-auto">
        {isLoading ? (
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
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-100',
                  isActive
                    ? 'bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </Link>
            );
          })
        )}
      </nav>);
  return <>
    <aside className="hidden md:flex w-60 bg-slate-900 border-r border-slate-800 fixed top-16 left-0 bottom-0 flex-col z-30">{navigation}</aside>
    <Modal isOpen={mobileOpen} onClose={onClose} title="Navigation" size="sm">{navigation}</Modal>
  </>;
}
