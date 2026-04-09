'use client';

import Link from 'next/link';
import TopBar from '@/components/TopBar';
import styles from './page.module.css';

const doctorCards = [
  {
    href: '/portal/prescription',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    gradient: 'grad-teal',
    title: 'Prescription',
    desc: 'Digital Rx & Printing',
  },
  {
    href: '/portal/summary',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    gradient: 'grad-blue',
    title: 'Discharge Summary',
    desc: 'IPD / OPD Summaries',
  },
  {
    href: '/portal/search',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    gradient: 'grad-purple',
    title: 'Patient Search',
    desc: 'Lookup Medical Records',
  },
  {
    href: '/portal/doctor/patient-history',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>,
    gradient: 'grad-pink',
    title: 'Patient History',
    desc: 'AI‑generated snapshot',
  },
  {
    href: '#',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    gradient: 'grad-gold',
    title: 'Analytics',
    desc: 'Coming Soon',
    disabled: true,
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
            card.disabled ? (
              <div key={card.title} className={`premium-card ${styles.disabled}`}>
                <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ) : (
              <Link key={card.title} href={card.href} className="premium-card">
                <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </Link>
            )
          ))}
        </div>
      </main>
    </div>
  );
}
