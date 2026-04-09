'use client';

import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import { useClinic } from '@/context/ClinicContext';
import styles from './page.module.css';

const doctorCards = [
  {
    id: 'prescription',
    href: '/portal/prescription',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    gradient: 'grad-teal',
    title: 'Digital Prescription',
    desc: 'Create and print professional digital prescriptions with AI-powered suggestions.',
    isPrimary: true,
  },
  {
    id: 'summary',
    href: '/portal/summary',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    gradient: 'grad-blue',
    title: 'Discharge Summary',
    desc: 'Manage IPD/OPD summaries.',
  },
  {
    id: 'search',
    href: '/portal/search',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    gradient: 'grad-purple',
    title: 'Patient Records',
    desc: 'Lookup medical history.',
  },
  {
    id: 'history',
    href: '/portal/doctor/patient-history',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>,
    gradient: 'grad-pink',
    title: 'Clinic History',
    desc: 'AI snapshots of clinic.',
  },
  {
    id: 'analytics',
    href: '#',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    gradient: 'grad-gold',
    title: 'Insights',
    desc: 'Practice analytics.',
    disabled: true,
  },
];

const dashboardStats = [
  { label: 'Total Patients Today', value: '24', icon: '👥', color: '#0d9e8c' },
  { label: 'Prescriptions Created', value: '18', icon: '📝', color: '#2563eb' },
  { label: 'Pending Cases', value: '06', icon: '⏳', color: '#f59e0b' },
];

export default function DoctorPage() {
  const { clinic } = useClinic();

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar clinicName={clinic?.name} />
      <div className={styles.contentArea}>
        <TopBar title="Doctor Dashboard" backHref="/portal" backLabel="Home" />
        <main className={styles.main}>
          <section className={styles.welcomeSection}>
            <div className={styles.welcomeInfo}>
              <h1>Welcome back, Doctor 👋</h1>
              <p>Here's what's happening at <span>{clinic?.name || 'MediNest Clinic'}</span> today.</p>
            </div>
            <div className={styles.quickDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </section>

          <section className={styles.statsRow}>
            {dashboardStats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={stat.label}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </section>

          <div className={styles.gridContainer}>
            {doctorCards.map((card) => (
              card.disabled ? (
                <div key={card.id} className={`${styles.card} ${styles.disabled} ${card.isPrimary ? styles.primary : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
                    <span className={styles.soonBadge}>Coming Soon</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              ) : (
                <Link key={card.id} href={card.href} className={`${styles.card} ${card.isPrimary ? styles.primary : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={`p-icon ${card.gradient}`}>{card.icon}</div>
                    {card.isPrimary && <span className={styles.recommendedBadge}>Primary Action</span>}
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <div className={styles.cardArrow}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                </Link>
              )
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

