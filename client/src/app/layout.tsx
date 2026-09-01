import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    template: '%s | DRECS',
    default: 'DRECS — Disaster Response & Emergency Coordination System',
  },
  description:
    'A real-time platform connecting citizens, volunteers, and authorities during disaster events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
