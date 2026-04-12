'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';

// SVG Icons
const IconRevenue = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>;
const IconWait = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

export default function DoctorPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const doctorNameParam = searchParams.get('doctorName');

  const { doctors, clinic } = useClinic();
  const [metricsData, setMetricsData] = useState({ todayCount: 0, trend: 0, revenue: 0, waiting: 0 });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingExpanded, setRemainingExpanded] = useState(false);
  const supabase = createClient();
  
  const activeDoctorName = doctorNameParam || (doctors && doctors.length > 0 ? doctors[0].name : 'Doctor');
  const doctorFirstName = activeDoctorName.split(' ')[0];

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const last7DaysStr = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prev7DaysStr = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (!clinic?.id) return;

      // 1. Today's Patients (Scoped to Doctor)
      let patientQuery = supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('date', todayStr).eq('clinic_id', clinic.id);
      if (doctorId) patientQuery = patientQuery.eq('doctor_id', doctorId);
      const { count: tCount } = await patientQuery;
      
      // 2. Weekly Trend (Scoped to Doctor)
      let thisWQuery = supabase.from('prescriptions').select('id').gte('date', last7DaysStr).eq('clinic_id', clinic.id);
      if (doctorId) thisWQuery = thisWQuery.eq('doctor_id', doctorId);
      const { data: thisW } = await thisWQuery;

      let prevWQuery = supabase.from('prescriptions').select('id').gte('date', prev7DaysStr).lt('date', last7DaysStr).eq('clinic_id', clinic.id);
      if (doctorId) prevWQuery = prevWQuery.eq('doctor_id', doctorId);
      const { data: prevW } = await prevWQuery;

      const trendVal = prevW?.length ? Math.round(((thisW!.length - prevW.length) / prevW.length) * 100) : 0;

      // 3. Today's Revenue (Scoped to Doctor by Name)
      let revenueQuery = supabase.from('receipts').select('total_amount, items_json').gte('printed_at', todayStr).eq('clinic_id', clinic.id);
      if (activeDoctorName) revenueQuery = revenueQuery.eq('doctor_name', activeDoctorName);
      const { data: receipts } = await revenueQuery;
      
      const rev = receipts?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0;

      // 4. Waiting Count (Global or scoped? usually queue is per doctor)
      const consults = receipts?.filter(r => {
        try {
          const items = typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json;
          return items.some((it: any) => it.desc?.toLowerCase().includes('consult') || it.name?.toLowerCase().includes('consult'));
        } catch { return false; }
      }).length || 0;

      setMetricsData({
        todayCount: tCount || 0,
        trend: trendVal,
        revenue: rev,
        waiting: Math.max(0, consults - (tCount || 0))
      });

      // Recent Patients Queue (Scoped to Doctor)
      let recentQuery = supabase.from('prescriptions').select('*, patients(name, gender, age)').eq('clinic_id', clinic.id).order('created_at', { ascending: false }).limit(5);
      if (doctorId) recentQuery = recentQuery.eq('doctor_id', doctorId);
      const { data: recent } = await recentQuery;
      
      if (recent) setRecentPatients(recent);
    };

    fetchStats();
  }, [clinic, doctorId, activeDoctorName, supabase]);

  // Live elapsed timer for the current patient
  useEffect(() => {
    const nowServing = recentPatients[0];
    if (!nowServing) return;
    const startTime = new Date(nowServing.created_at).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [recentPatients]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const estimateWait = (index: number) => {
    // Each patient approx 10 min, index = position in waiting list (0-based)
    const mins = (index + 1) * 10 - Math.floor((elapsedSeconds % 600) / 60);
    return `~${Math.max(1, mins)} min`;
  };

  const metrics = [
    { label: "Today's Revenue", value: `₹${metricsData.revenue.toLocaleString()}`, trend: 'Live Assessment', trendColor: '#64748b', icon: IconRevenue, bg: '#ebdcff' },
    { label: 'Waiting', value: `${metricsData.waiting} Patients`, trend: 'Queue Status', trendColor: '#10b981', icon: IconWait, bg: '#ffdeaa' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.dashboardHeader}>
        <h2>Welcome back, Dr. {doctorFirstName}.</h2>
        <p>You’ve seen {metricsData.todayCount} patients today.</p>
      </div>

      <div className={styles.fullWidthLayout}>
        <div className={styles.mainCol}>
          {/* Metrics Row */}
          <div className={styles.metricsRow}>
            {metrics.map((m) => (
              <div key={m.label} className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ backgroundColor: m.bg }}>
                   <div style={{ color: 'var(--sanctuary-primary)' }}>{m.icon}</div>
                </div>
                <div>
                  <p className={styles.metricLabel}>{m.label}</p>
                  <h3 className={styles.metricValue}>{m.value}</h3>
                  <p className={styles.metricTrend} style={{ color: m.trendColor }}>{m.trend}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Queue */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <div>
                <h4>Active Queue</h4>
                <p style={{ fontSize: 13, color: 'var(--sanctuary-ink-l)', marginTop: 4 }}>
                  {recentPatients.length} patient{recentPatients.length !== 1 ? 's' : ''} in session today
                </p>
              </div>
              <span className={styles.livePill}>
                <span className={styles.liveDot} />
                LIVE
              </span>
            </div>

            {recentPatients.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sanctuary-ink-l)' }}>
                <p>No patients in queue yet today.</p>
              </div>
            ) : (
              <div className={styles.activeQueue}>

                {/* 🔴 Now Serving */}
                {recentPatients[0] && (
                  <div className={styles.nowServingCard}>
                    <div className={styles.queueBadgeRow}>
                      <span className={styles.dotRed} />
                      <span className={styles.queueTierLabel}>Now Serving</span>
                    </div>
                    <div className={styles.nowServingBody}>
                      <div className={styles.nowServingAvatar}>
                        {recentPatients[0].patients?.name?.[0] ?? '?'}
                      </div>
                      <div className={styles.nowServingInfo}>
                        <p className={styles.nowServingName}>{recentPatients[0].patients?.name ?? 'Unknown'}</p>
                        <p className={styles.nowServingMeta}>
                          Token #1 &nbsp;•&nbsp; {recentPatients[0].patients?.age}Y&nbsp;{recentPatients[0].patients?.gender}
                        </p>
                      </div>
                      <div className={styles.timerBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {formatElapsed(elapsedSeconds)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 🟡 Waiting – Next 3 */}
                {recentPatients.slice(1, 4).length > 0 && (
                  <div className={styles.waitingSection}>
                    <div className={styles.queueBadgeRow}>
                      <span className={styles.dotYellow} />
                      <span className={styles.queueTierLabel}>Waiting — Next {recentPatients.slice(1, 4).length}</span>
                    </div>
                    <div className={styles.waitingList}>
                      {recentPatients.slice(1, 4).map((p, idx) => (
                        <div key={p.id} className={styles.waitingItem}>
                          <div className={styles.waitingToken}>#{idx + 2}</div>
                          <div className={styles.waitingInfo}>
                            <p className={styles.waitingName}>{p.patients?.name ?? 'Unknown'}</p>
                            <p className={styles.waitingMeta}>{p.patients?.age}Y&nbsp;•&nbsp;{p.patients?.gender}</p>
                          </div>
                          <div className={styles.waitEstimate}>{estimateWait(idx)}</div>
                          <Link href={`/portal/doctor-dashboard/patients/${p.patient_id}`} className={styles.waitingViewBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ⚪ Remaining Queue */}
                {recentPatients.slice(4).length > 0 && (
                  <div className={styles.remainingSection}>
                    <button
                      className={styles.remainingToggle}
                      onClick={() => setRemainingExpanded(prev => !prev)}
                    >
                      <div className={styles.queueBadgeRow} style={{ margin: 0 }}>
                        <span className={styles.dotGray} />
                        <span className={styles.queueTierLabel}>
                          Remaining Queue ({recentPatients.slice(4).length})
                        </span>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: remainingExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {remainingExpanded && (
                      <div className={styles.remainingList}>
                        {recentPatients.slice(4).map((p, idx) => (
                          <div key={p.id} className={styles.remainingItem}>
                            <span className={styles.remainingToken}>#{idx + 5}</span>
                            <span className={styles.remainingName}>{p.patients?.name ?? 'Unknown'}</span>
                            <span className={styles.remainingTime}>
                              {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
