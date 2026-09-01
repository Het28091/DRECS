'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /incidents/my route — redirects to the unified /incidents page.
 */
export default function MyIncidentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/incidents');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400 text-sm">Redirecting…</p>
    </div>
  );
}

