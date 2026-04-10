'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import styles from './page.module.css';

export default function PortalPage() {
  const { clinic } = useClinic();
  
  const hospitalName = clinic?.name || 'Sitapur Shishu Kendra';

  return (
    <div className={styles.page}>
      {/* Hero Identity Section */}
      <header className={styles.identityHeader}>
        <div className={styles.logoBox}>
          {/* Using a Material Symbol for child care as seen in the template */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sanctuary-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        </div>
        <h1 className={styles.hospitalName}>{hospitalName}</h1>
        <div className={styles.location}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Sitapur, Uttar Pradesh</span>
        </div>
      </header>

      {/* Main Selection Shell */}
      <main className={styles.selectionShell}>
        {/* Doctor Portal selection */}
        <Link href="/portal/doctor" className={styles.portalCard}>
          <div className={styles.iconCircle} style={{ background: '#ebdcff' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#170337" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>
            </svg>
          </div>
          <h2>Doctor Portal</h2>
          <p>
            Access patient records, prescriptions, and advanced clinical analytics with secure authentication.
          </p>
          <div className={styles.ctaLink}>
            Enter Portal
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
          <div className={styles.decorLayer} />
        </Link>

        {/* Front Desk Portal selection */}
        <Link href="/portal/receptionist" className={styles.portalCard}>
          <div className={styles.iconCircle} style={{ background: '#eaddf9' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#635a71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M13 13h4"/><path d="M13 17h4"/>
            </svg>
          </div>
          <h2>Front Desk Portal</h2>
          <p>
            Efficiently manage appointments, patient check-ins, and streamline the clinic's billing operations.
          </p>
          <div className={styles.ctaLink}>
            Enter Portal
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
          <div className={styles.decorLayer} />
        </Link>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        Authorized personnel only. Please select your dedicated portal to begin your session. {hospitalName} ensures data privacy and end-to-end encryption for all pediatric records.
      </footer>
    </div>
  );
}
