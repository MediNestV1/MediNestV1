'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import styles from './page.module.css';

const portalCards = [
  {
    href: '/portal/doctor',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
    gradient: 'grad-blue',
    title: 'Doctor Portal',
    desc: 'Prescriptions, Summaries & Analytics',
  },
  {
    href: '/portal/receptionist',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    gradient: 'grad-teal',
    title: 'Receptionist Portal',
    desc: 'Appointments, Billing & Patient Entry',
  },
];

export default function PortalPage() {
  const { clinic } = useClinic();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoCircle}>
            <Image src="/assets/medinest_logo.png" alt="MediNest" width={100} height={100} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className={styles.clinicName}>{clinic?.name || 'MediNest Clinic'}</h1>
          <p className={styles.clinicTagline}>Premium Clinic Management Console</p>
        </header>

        <div className={styles.grid}>
          {portalCards.map((card) => (
            <Link key={card.href} href={card.href} className="premium-card">
              <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
              <h3 style={{ fontSize: 22, marginBottom: 6 }}>{card.title}</h3>
              <p style={{ fontSize: 14 }}>{card.desc}</p>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          © 2026 {clinic?.name || 'MediNest Clinic'} · Console v2.0
        </footer>
      </div>
    </div>
  );
}
