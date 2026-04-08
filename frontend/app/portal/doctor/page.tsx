'use client';

import Link from 'next/link';
import TopBar from '@/components/TopBar';
import styles from './page.module.css';

const doctorCards = [
  {
    href: '/portal/prescription',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    gradient: 'grad-teal',
    title: 'Prescription',
    desc: 'Digital Rx & Printing',
  },
  {
    href: '/portal/summary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <path d="M12 11h4"/>
        <path d="M12 16h4"/>
        <path d="M8 11h.01"/>
        <path d="M8 16h.01"/>
      </svg>
    ),
    gradient: 'grad-blue',
    title: 'Discharge Summary',
    desc: 'IPD / OPD Summaries',
  },
  {
    href: '/portal/doctor/patient-history',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
      </svg>
    ),
    gradient: 'grad-pink',
    title: 'Patient History',
    desc: 'AI‑generated snapshot',
  },
  {
    href: '/portal/doctor/analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M18 17V9"/>
        <path d="M13 17V5"/>
        <path d="M8 17v-3"/>
      </svg>
    ),
    gradient: 'grad-gold',
    title: 'Analytics',
    desc: 'Clinical Performance & Trends',
  },
];

export default function DoctorPage() {
  return (
    <div className={styles.page}>
      <TopBar title="Doctor Portal" backHref="/portal" backLabel="Home" />
      <main className={styles.main}>
        <div className={styles.dashHeader}>
          <h2>Clinical Hub — Hello, Doctor 👨‍⚕️</h2>
        </div>
        <div className="grid-dash">
          {doctorCards.map((card) => (
            <Link key={card.title} href={card.href} className="premium-card">
              <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
