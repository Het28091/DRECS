import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

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
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
