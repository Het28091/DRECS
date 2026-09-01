import { redirect } from 'next/navigation';

/**
 * Root route — redirects to login.
 * Phase 1: Update to check auth cookie/token and redirect to /dashboard if authenticated.
 */
export default function RootPage() {
  redirect('/login');
}
