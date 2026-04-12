'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';
import docStyles from '../doctor-dashboard/page.module.css'; // Reusing bento/queue styles

export default function ReceptionistPage() {
  const [todayCounts, setTodayCounts] = useState({ patients: 0, revenue: 0 });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, count, error } = await supabase
        .from('prescriptions')
        .select('*, patients(name, gender, age)')
        .eq('date', todayStr);
      
      if (!error && data) {
        setTodayCounts({
          patients: count || data.length,
          revenue: (count || data.length) * 500
        });
        setRecentPatients(data);
      }
    };
    fetchStats();
  }, [supabase]);

  const metrics = [
    { label: 'Daily Clinical Check-ins', value: todayCounts.patients.toString(), trend: '+5% from avg', trendColor: '#10b981', icon: 'person_add', bg: '#ebdcff' },
    { label: 'Lobby Revenue', value: `₹${todayCounts.revenue.toLocaleString()}`, trend: 'Assessment Live', trendColor: '#ffdeaa', icon: 'payments', bg: '#eaddf9' },
    { label: 'System Response', value: '5m', trend: '2m under goal', trendColor: '#10b981', icon: 'timer', bg: '#ffdeaa' },
  ];

  const quickActions = [
    { label: 'Create New Bill', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>, href: '/portal/billing-receipts' },
    { label: 'Search Patients', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>, href: '/portal/record-search' },
    { label: 'Register Patient', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>, href: '#' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.dashboardHeader}>
        <h2>Front Office Hub</h2>
        <p style={{ color: 'var(--sanctuary-ink-l)', marginTop: 8 }}>Managing clinical operations and patient flow.</p>
      </div>

      <div className={docStyles.bentoGrid}>
        <div className={docStyles.mainCol}>
          {/* Metrics Row */}
          <div className={styles.metricsRow}>
            {metrics.map((m) => (
              <div key={m.label} className={docStyles.metricCard}>
                <div className={docStyles.metricIcon} style={{ backgroundColor: m.bg }}>
                   <div style={{ color: 'var(--sanctuary-primary)' }}>
                      {m.label === 'Daily Clinical Check-ins' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>}
                      {m.label === 'Lobby Revenue' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>}
                      {m.label === 'System Response' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                   </div>
                </div>
                <div>
                  <p className={docStyles.metricLabel}>{m.label}</p>
                  <h3 className={docStyles.metricValue}>{m.value}</h3>
                  <p className={docStyles.metricTrend} style={{ color: m.trendColor }}>{m.trend}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Queue */}
          <div className={docStyles.sectionBox}>
             <div className={docStyles.sectionHeader}>
                <h4>Patient Lobby</h4>
                <div style={{ display: 'flex', gap: 12 }}>
                   <Link href="/portal/doctor-dashboard/patients" style={{ padding: '8px 20px', borderRadius: 30, border: 'none', background: 'var(--sanctuary-primary)', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', textDecoration: 'none' }}>Manage All</Link>
                </div>
             </div>

             <div className={docStyles.queueList}>
                {recentPatients.map((p) => (
                  <div key={p.id} className={docStyles.queueItem}>
                    <div className={docStyles.patientInfo}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--sanctuary-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--sanctuary-primary)' }}>
                        {p.patients?.name?.[0]}
                      </div>
                      <div>
                        <p className={docStyles.patientName}>{p.patients?.name}</p>
                        <p className={docStyles.patientType}>{p.patients?.age}Y • {p.patients?.gender}</p>
                      </div>
                    </div>
                    <div className={docStyles.timeCol}>
                      <p>Time</p>
                      <p>{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <span className={docStyles.statusBadge} style={{ backgroundColor: 'var(--sanctuary-primary)', color: '#fff' }}>
                        REGISTERED
                      </span>
                    </div>
                    <div className={styles.menuContainer}>
                      <button 
                        className={styles.dotsBtn}
                        onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                      </button>

                      {activeMenu === p.id && (
                        <div className={styles.dropdownMenu} ref={menuRef}>
                          <Link href={`/portal/doctor-dashboard/patients/${p.patients?.id || p.patient_id}`} className={styles.menuItem}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            View Profile
                          </Link>
                          <Link href={`/portal/billing-receipts?patientId=${p.patients?.id || p.patient_id}`} className={styles.menuItem}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12v10H4V12"></path><path d="M2 7h20v5H2z"></path><path d="M12 22V7"></path><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                            Generate Bill
                          </Link>
                          <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { /* Implement removal logic */ setActiveMenu(null); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Remove from Lobby
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {recentPatients.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--sanctuary-ink-l)', padding: '20px' }}>No activity in the lobby today.</p>
                )}
             </div>
          </div>
        </div>

        <div className={docStyles.sideCol}>
           <div className={docStyles.quickActions}>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sanctuary-primary)', marginBottom: 16 }}>Office Actions</h4>
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className={docStyles.actionButton}>
                  <div className={docStyles.actionButtonIcon}>
                     {action.icon}
                  </div>
                  <span>{action.label}</span>
                </Link>
              ))}
           </div>

           <div style={{ marginTop: 24, padding: 32, borderRadius: 24, background: 'var(--sanctuary-gray-low)', border: '1px solid rgba(23,3,55,0.05)' }}>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sanctuary-primary)', marginBottom: 16 }}>Duty Roster</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--sanctuary-ink-l)' }}>On Duty</span>
                   <span style={{ fontWeight: 800 }}>Reception Team</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--sanctuary-ink-l)' }}>Shift</span>
                   <span style={{ fontWeight: 800 }}>09:00 - 21:00</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
