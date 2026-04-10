'use client';

import { useClinic } from '@/context/ClinicContext';
import styles from './DashboardTopBar.module.css';

export default function DashboardTopBar() {
  const { doctors } = useClinic();
  const primaryDoctor = doctors && doctors.length > 0 ? doctors[0] : { name: 'Doctor', qualification: 'Medical Professional' };

  return (
    <header className={styles.topBar}>
      <div className={styles.searchWrapper}>
        <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          className={styles.searchInput} 
          type="text" 
          placeholder="Search patients, records, or dates..." 
        />
      </div>

      <div className={styles.actions}>
        <div className={styles.iconGroup}>
          <button className={styles.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <button className={styles.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </button>
        </div>
        
        <div className={styles.divider} />

        <div className={styles.profile}>
          <div className={styles.profileInfo}>
            <p className={styles.userName}>Dr. {primaryDoctor.name}</p>
            <p className={styles.userRole}>{primaryDoctor.qualification || 'Medical Professional'}</p>
          </div>
          <div className={styles.avatarPlaceholder}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </div>
      </div>
    </header>
  );
}
