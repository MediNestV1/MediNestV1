'use client';

import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={styles.layout}>
      <DashboardSidebar />
      <div className={styles.contentArea}>
        <DashboardTopBar />
        <main className={styles.canvas}>
          {children}
        </main>
      </div>
    </div>
  );
}
