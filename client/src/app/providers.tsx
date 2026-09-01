'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

/**
 * Wraps all client-side context providers.
 * Imported into the root layout.tsx (server component) to keep the root layout
 * as a server component while giving children access to global contexts.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
}
