import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Brand header */}
      <header className="flex items-center gap-3 p-6">
        <Shield className="text-amber-400" size={28} />
        <span className="text-white font-bold text-xl tracking-tight">DRECS</span>
      </header>

      {/* Centered auth content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xl">{children}</div>
      </main>

      <footer className="text-center text-slate-400 text-xs pb-6">
        Disaster Response &amp; Emergency Coordination System
      </footer>
    </div>
  );
}
