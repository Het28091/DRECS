import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

import { AuthGuard } from '@/components/layout/AuthGuard';

export const metadata: Metadata = {
  title: {
    template: '%s | DRECS',
    default: 'DRECS | Disaster Coordination',
  },
};

/**
 * Main application layout — wraps all authenticated pages in shared application shell.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
