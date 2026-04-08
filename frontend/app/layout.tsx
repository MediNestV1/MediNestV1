import type { Metadata } from 'next';
import './globals.css';
import { ClinicProvider } from '@/context/ClinicContext';
import ServiceWorkerKiller from '@/components/ServiceWorkerKiller';

export const metadata: Metadata = {
  title: 'MediNest — Clinic Management Platform',
  description: 'MediNest: The all-in-one digital clinic management system for modern healthcare providers. Prescriptions, billing, patient records & more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerKiller />
        <ClinicProvider>
          {children}
        </ClinicProvider>
      </body>
    </html>
  );
}
