'use client';

import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import styles from './page.module.css';

const doctorCards = [
  {
    href: '/portal/prescription',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    gradient: 'linear-gradient(135deg, var(--teal), var(--teal-mid))',
    title: 'Digital Prescription',
    desc: 'Generate, print and track digital prescriptions with AI assistance.',
  },
  {
    href: '/portal/summary',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    title: 'Discharge Summary',
    desc: 'Comprehensive IPD and OPD patient discharge documentation.',
  },
  {
    href: '/portal/doctor/patient-history',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>,
    gradient: 'linear-gradient(135deg, #db2777, #f472b6)',
    title: 'Clinical Patient History',
    desc: 'Review chronological history with AI‑generated medical snapshots.',
  },
  {
    href: '#',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    title: 'Practice Analytics',
    desc: 'Insights into patient flow and treatment trends (Coming Soon).',
    disabled: true,
  },
];

export default function DoctorPage() {
  const { doctors } = useClinic();
  const primaryDoctorName = doctors && doctors.length > 0 ? doctors[0].name : 'Doctor';

  return (
    <div className={styles.page}>
      <TopBar title="Clinical Hub" backHref="/portal" backLabel="Sanctuary" />
      
      <main className={styles.main}>
        <div className={styles.dashHeader}>
          <h2>Salutations, Dr. {primaryDoctorName} 👨‍⚕️</h2>
          <p style={{ color: 'var(--sanctuary-ink-l)', marginTop: 8, fontSize: 15 }}>
            Manage your clinical practice with precision and ease.
          </p>
        </div>

        <div className={styles.grid}>
          {doctorCards.map((card) => (
            card.disabled ? (
              <div key={card.title} className={`${styles.premiumCard} ${styles.disabled}`}>
                <div className={styles.iconWrapper} style={{ background: card.gradient }}>
                  {card.icon}
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ) : (
              <Link key={card.title} href={card.href} className={styles.premiumCard}>
                <div className={styles.iconWrapper} style={{ background: card.gradient }}>
                  {card.icon}
                </div>
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
