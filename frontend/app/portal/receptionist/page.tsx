'use client';

import Link from 'next/link';
import TopBar from '@/components/TopBar';
import styles from './page.module.css';

export default function ReceptionistPage() {
  return (
    <div className={styles.page}>
      <TopBar title="Reception Portal" backHref="/portal" backLabel="Home" />
      <main className={styles.main}>
        <div className={styles.dashHeader}>
          <h2>Today's Performance</h2>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Patients</div>
            <div className={styles.statValueBlue}>0</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Revenue</div>
            <div className={styles.statValueGreen}>₹0</div>
          </div>
          <div className={styles.statCard}>
             <div className={styles.statLabel}>Pending</div>
            <div className={styles.statValueOrange}>0</div>
          </div>
        </div>

        <div className={styles.dashHeader} style={{ marginTop: '24px' }}>
          <h2>Core Functions</h2>
        </div>

        <div className="grid-dash">
           <Link href="/portal/billing" className="premium-card">
              <div className="p-icon grad-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
              </div>
              <h3>Billing</h3>
              <p>Create New Bill & Receipt</p>
           </Link>

           <Link href="/portal/search" className="premium-card">
              <div className="p-icon grad-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>Patient Search</h3>
              <p>Lookup Medical Records</p>
           </Link>

           <Link href="/portal/settings" className="premium-card">
              <div className="p-icon grad-gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <h3>Settings</h3>
              <p>Manage Services & Info</p>
           </Link>
        </div>
      </main>
    </div>
  );
}
