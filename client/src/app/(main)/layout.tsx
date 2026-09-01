import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';

export const metadata: Metadata = {
  title: {
    template: '%s | DRECS Console',
    default: 'DRECS Tactical Operational Console',
  },
};

/**
 * Main application layout — wraps all authenticated pages in Tactical Dark Utility theme.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <Sidebar />
        <main className="pt-14 pl-60 min-h-screen">
          <div className="p-5">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
