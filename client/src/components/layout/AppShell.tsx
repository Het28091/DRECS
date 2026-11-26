'use client';
import { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DisasterChat } from '@/components/DisasterChat';
export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[2000] focus:bg-slate-900 focus:p-3">Skip to content</a>
    <Navbar onMenuToggle={() => setMenuOpen(true)} menuOpen={menuOpen} />
    <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    <main id="main-content" tabIndex={-1} className="pt-16 md:pl-60 min-h-screen min-w-0"><div className="mx-auto max-w-[1600px] px-4 py-6 pb-28 sm:px-7 lg:px-9 lg:py-8 lg:pb-28">{children}</div></main>
    <DisasterChat />
  </div>;
}
