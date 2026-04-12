'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './DashboardSidebar.module.css';

interface SidebarAnalyticsProps {
  doctorId: string | null;
  doctorName: string;
  clinicId: string | null;
}

export default function SidebarAnalytics({ doctorId, doctorName, clinicId }: SidebarAnalyticsProps) {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    waiting: 0,
    avgTime: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!clinicId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate date ranges
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weekStr = startOfWeek.toISOString().split('T')[0];

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStr = startOfMonth.toISOString().split('T')[0];

      try {
        // 1. Footfall Today
        let todayQuery = supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('date', todayStr).eq('clinic_id', clinicId);
        if (doctorId) todayQuery = todayQuery.eq('doctor_id', doctorId);
        const { count: countToday } = await todayQuery;

        // 2. Footfall Week
        let weekQuery = supabase.from('prescriptions').select('id', { count: 'exact', head: true }).gte('date', weekStr).eq('clinic_id', clinicId);
        if (doctorId) weekQuery = weekQuery.eq('doctor_id', doctorId);
        const { count: countWeek } = await weekQuery;

        // 3. Footfall Month
        let monthQuery = supabase.from('prescriptions').select('id', { count: 'exact', head: true }).gte('date', monthStr).eq('clinic_id', clinicId);
        if (doctorId) monthQuery = monthQuery.eq('doctor_id', doctorId);
        const { count: countMonth } = await monthQuery;

        // 4. Waiting Queue (Direct calculation like Dashboard)
        const { data: receipts } = await supabase.from('receipts')
          .select('items_json')
          .gte('printed_at', todayStr)
          .eq('clinic_id', clinicId)
          .eq('doctor_name', doctorName);
        
        const consults = receipts?.filter(r => {
          try {
            const items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json;
            return items.some((it: any) => it.desc?.toLowerCase().includes('consult') || it.name?.toLowerCase().includes('consult'));
          } catch { return false; }
        }).length || 0;

        const waiting = Math.max(0, consults - (countToday || 0));

        // 5. Avg. Consultation Time (Estimate from gap between creations)
        let timeQuery = supabase.from('prescriptions')
          .select('created_at')
          .eq('date', todayStr)
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: true });
        
        if (doctorId) timeQuery = timeQuery.eq('doctor_id', doctorId);
        const { data: timeData } = await timeQuery;

        let avgConsultTime = 0;
        if (timeData && timeData.length > 1) {
          let totalGap = 0;
          let gapCount = 0;
          for (let i = 0; i < timeData.length - 1; i++) {
            const t1 = new Date(timeData[i].created_at).getTime();
            const t2 = new Date(timeData[i+1].created_at).getTime();
            const gap = (t2 - t1) / (1000 * 60); // minutes
            if (gap < 60) { // filter out long breaks
              totalGap += gap;
              gapCount++;
            }
          }
          avgConsultTime = gapCount > 0 ? Math.round(totalGap / gapCount) : 0;
        }

        setStats({
          today: countToday || 0,
          week: countWeek || 0,
          month: countMonth || 0,
          waiting,
          avgTime: avgConsultTime
        });

      } catch (err) {
        console.error('Error fetching sidebar analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);

  }, [clinicId, doctorId, doctorName, supabase]);

  if (loading && !stats.today) return <div className={styles.analyticsSkeleton}>Loading stats...</div>;

  return (
    <div className={styles.analyticsSection}>
      <h3 className={styles.analyticsTitle}>Clinical Pulse</h3>
      
      <div className={styles.statsGrid}>
        <div className={styles.analyticsCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Footfall</span>
            <div className={styles.multiStats}>
              <div className={styles.statItem}>
                <span className={styles.statVal}>{stats.today}</span>
                <span className={styles.statSub}>Today</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>{stats.week}</span>
                <span className={styles.statSub}>Week</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>{stats.month}</span>
                <span className={styles.statSub}>Month</span>
              </div>
            </div>
          </div>
          <div className={`${styles.cardIcon} ${styles.blueIcon}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Active Queue</span>
            <div className={styles.statValLarge}>{stats.waiting}</div>
            <span className={styles.statSub}>Patients Waiting</span>
          </div>
          <div className={`${styles.cardIcon} ${styles.orangeIcon}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardInfo}>
            <span className={styles.cardLabel}>Avg Consult</span>
            <div className={styles.statValLarge}>{stats.avgTime}m</div>
            <span className={styles.statSub}>Minutes per Patient</span>
          </div>
          <div className={`${styles.cardIcon} ${styles.purpleIcon}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
