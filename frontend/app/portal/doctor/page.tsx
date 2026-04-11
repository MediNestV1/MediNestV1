'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';

// SVG Icons
const IconHealing = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"></path></svg>;
const IconRevenue = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>;
const IconWait = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

export default function DoctorPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const doctorNameParam = searchParams.get('doctorName');

  const { doctors, clinic } = useClinic();
  const [metricsData, setMetricsData] = useState({ todayCount: 0, trend: 0, revenue: 0, waiting: 0 });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
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

  // Patient Search Logic
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (data) setSearchResults(data);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, supabase]);

  const metrics = [
    { label: "Today's Patients", value: metricsData.todayCount.toString(), trend: `${metricsData.trend >= 0 ? '+' : ''}${metricsData.trend}% vs last week`, trendColor: metricsData.trend >= 0 ? '#10b981' : '#ef4444', icon: IconHealing, bg: '#eaddf9' },
    { label: "Today's Revenue", value: `₹${metricsData.revenue.toLocaleString()}`, trend: 'Live Assessment', trendColor: '#64748b', icon: IconRevenue, bg: '#ebdcff' },
    { label: 'Waiting', value: `${metricsData.waiting} Patients`, trend: 'Queue Status', trendColor: '#10b981', icon: IconWait, bg: '#ffdeaa' },
  ];

  const quickActions = [
    { label: 'Register New Patient', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>, href: `/portal/prescription?doctorName=${encodeURIComponent(activeDoctorName)}` },
    { label: 'Digital Prescription', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>, href: `/portal/prescription?doctorName=${encodeURIComponent(activeDoctorName)}` },
    { label: 'Discharge Summary', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>, href: '/portal/summary' },
    { label: 'View Patients Hub', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, href: '/portal/doctor/patients' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.dashboardHeader}>
        <h2>Welcome back, Dr. {doctorFirstName}.</h2>
        <p>You’ve seen {metricsData.todayCount} patients today.</p>
      </div>

      <div className={styles.bentoGrid}>
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

          {/* Patient Queue */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <div>
                <h4>Today's Patients</h4>
                <p style={{ fontSize: 13, color: 'var(--sanctuary-ink-l)', marginTop: 4 }}>Recent Patient Visits</p>
              </div>
            </div>

            <div className={styles.queueList}>
              {recentPatients.map((p) => (
                <div key={p.id} className={styles.queueItem}>
                  <div className={styles.patientInfo}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--sanctuary-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--sanctuary-primary)' }}>
                      {p.patients?.name?.[0]}
                    </div>
                    <div>
                      <p className={styles.patientName}>{p.patients?.name}</p>
                      <p className={styles.patientType}>{p.patients?.age}Y • {p.patients?.gender}</p>
                    </div>
                  </div>
                  <div className={styles.timeCol}>
                    <p>Visit Type</p>
                    <p>{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <span className={styles.statusBadge} style={{ backgroundColor: 'var(--sanctuary-primary)', color: '#fff' }}>
                      COMPLETED
                    </span>
                  </div>
                  <Link href={`/portal/doctor/patients/${p.patient_id}`} style={{ color: 'var(--sanctuary-ink-l)', textDecoration: 'none' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </Link>
                </div>
              ))}
              {recentPatients.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sanctuary-ink-l)' }}>
                  <p>No patients recorded yet today.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.quickActions}>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sanctuary-primary)', marginBottom: 16 }}>Quick Actions</h4>
            
            <div className={styles.searchContainer}>
              <label className={styles.searchLabel}>Find or Add Patient</label>
              <div className={styles.searchInputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchInputIcon}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  className={styles.searchField} 
                  placeholder="Name or Phone Number..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchTerm.length >= 2 && (
                <div className={styles.searchResults}>
                  {isSearching ? (
                    <div className={styles.noResults}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map(p => (
                        <div key={p.id} className={styles.searchItem} onClick={() => window.location.href = `/portal/doctor/patients/${p.id}`}>
                          <div>
                            <p className={styles.searchItemName}>{p.name}</p>
                            <p className={styles.searchItemInfo}>{p.contact} • {p.age}Y • {p.gender}</p>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                      ))}
                      <button className={styles.addNewBtn} onClick={() => window.location.href = `/portal/prescription?newName=${searchTerm}`}>
                        + Register as New Patient
                      </button>
                    </>
                  ) : (
                    <div className={styles.noResults}>
                      <p>No patient found with "{searchTerm}"</p>
                      <button className={styles.addNewBtn} onClick={() => window.location.href = `/portal/prescription?newName=${searchTerm}`}>
                        + Register "{searchTerm}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.actionList}>
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className={styles.actionButton}>
                  <div className={styles.actionButtonIcon}>
                     {action.icon}
                  </div>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
