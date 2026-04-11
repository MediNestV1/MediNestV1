'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface Prescription {
  id: string;
  date: string;
  weight: string;
  complaints: string;
  findings: string;
  medicines: any[];
  advice: string;
  valid_till: string;
  doctor_name: string;
  patient_id: string;
  clinic_id: string;
  ai_summary: any;
}

interface Patient {
  name: string;
  age: string;
  gender: string;
  contact: string;
  created_at: string;
}

interface Clinic {
  name: string;
  address: string;
  phone: string;
  tagline: string;
}

export default function ViewPrescription({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [rx, setRx] = useState<Prescription | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const hospitalName = clinic?.name || 'MediNest Partner Clinic';
  const hospitalLocation = clinic?.address || 'Location not set';
  
  // --- HYDRATION GUARD ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // --- AI SNAPSHOT STATE ---
  const activeSummary = rx?.ai_summary;

  // --- TABS & HISTORY ---
  const [activeTab, setActiveTab] = useState<'Patient Profile' | 'Current Script' | 'AI Summary' | 'Patient History' | 'Drug Interaction' | 'Clinic Notes'>('Patient Profile');
  const [history, setHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function fetchHistory(pId: string) {
    if (!pId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient-history/${pId}`);
      const data = await res.json();
      if (data) setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function generateAiSummary(currentRx: Prescription, pt: Patient | null) {
    // English Only
    
    // Hardened Retry Wrapper
    const fetchWithRetry = async (url: string, opts: any, retries = 2): Promise<any> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const res = await fetch(url, opts);
          if (res.ok) return await res.json();
          if (i === retries) throw new Error(`Fetch failed with status: ${res.status}`);
        } catch (err) {
          if (i === retries) throw err;
          console.warn(`⚠️ Retrying English AI (${i + 1}/${retries})...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    };

    try {
      console.log(`🤖 Triggering AI Clinical Snapshot...`);
      const result = await fetchWithRetry(`${API_BASE_URL}/api/prescriptions/${id}/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: pt?.name || 'Patient',
          complaints: currentRx.complaints,
          findings: currentRx.findings,
          medicines: typeof currentRx.medicines === 'string' ? JSON.parse(currentRx.medicines) : currentRx.medicines,
          advice: currentRx.advice,
          followUp: currentRx.valid_till,
          lang: 'English',
          persist: true 
        })
      });

      if (result?.success && result.summary) {
        console.log(`✅ AI Summary Generated:`, result);
        setRx(prev => prev ? ({ ...prev, ai_summary: result.summary }) : null);
      }
    } catch (err) {
      console.error(`❌ AI Trigger Error after retries:`, err);
    }
  }

  async function fetchRxData() {
    const supabase = createClient();
    try {
      console.log('🔄 Fetching/Refreshing RX data...');
      
      // Fetch session for conditional UI
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: rxData, error: rxError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (rxError) throw rxError;
      setRx(rxData);

      if (rxData.patient_id) {
        const { data: pData } = await supabase.from('patients').select('*').eq('id', rxData.patient_id).single();
        if (pData) setPatient(pData);
        // Fetch history immediately
        fetchHistory(rxData.patient_id);
      }
      if (rxData.clinic_id) {
        const { data: cData } = await supabase.from('clinics').select('*').eq('id', rxData.clinic_id).single();
        if (cData) setClinic(cData);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Prescription not found');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      await fetchRxData();
    }
    init();

    const supabase = createClient();
    const channel = supabase
      .channel(`rx-update-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prescriptions', filter: `id=eq.${id}` },
        () => {
          console.log('⚡ Realtime Update Detected! Re-fetching...');
          fetchRxData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    async function triggerSequentially() {
      if (!rx || loading) return;

      // 1. English Priority & Self-Healing
      // Check if current slot is empty or contains Hindi script (Devanagari range)
      const isEnglishSlotHindi = rx.ai_summary?.greeting && /[\u0900-\u097F]/.test(rx.ai_summary.greeting);
      
      // AI Priority & Self-Healing
      if (!rx.ai_summary) {
        console.log("⏱️ AI Snapshot fetch starting...");
        await generateAiSummary(rx, patient);
      }
    }

    triggerSequentially();
  }, [rx?.id, !!rx?.ai_summary, loading, !!hindiCache]);

  const activeSummary = selectedLang === 'English' ? rx?.ai_summary : hindiCache;
  const followUpDate = rx?.valid_till;
  const meds = rx?.medicines ? (typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines) : [];

  if (!mounted) return null;

  const sidebarItems = [
    { name: 'Patient Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { name: 'Current Script', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> },
    { name: 'AI Summary', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg> },
    { name: 'Patient History', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  return (
    <>
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
           <div className={styles.brand}>MediNest</div>
        </div>
        <div className={styles.navCenter}>
          <div className={styles.breadcrumb}>
            <span>Patient Hub</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbActive}>{activeTab}</span>
          </div>

          <div className={styles.contextNav}>
            {activeTab === 'Patient Profile' && (
              <>
                <a href="#biometrics" className={styles.contextNavLink}>Biometrics</a>
                <a href="#meds" className={styles.contextNavLink}>Maintenance Meds</a>
                <a href="#history" className={styles.contextNavLink}>Key History</a>
              </>
            )}
            {activeTab === 'Current Script' && (
              <>
                <a href="#" className={styles.contextNavLink} onClick={(e) => { e.preventDefault(); window.print(); }}>Print Record</a>
                <a href="#" className={styles.contextNavLink}>Digital Copy</a>
              </>
            )}
            {activeTab === 'Patient History' && (
              <>
                <span className={styles.contextNavLink}>Timeline View</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.navRight}>
           {user && (
             <>
               <button className={styles.navIconBtn}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>
               <button className={styles.navIconBtn}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
               <button className={styles.userProfileBtn}>
                  <img src="https://api.uifaces.co/our-content/donated/vY_H35O_.jpg" alt="Doctor" />
               </button>
             </>
           )}
           {!user && (
             <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-soft)', background: '#f1f5f9', padding: '6px 14px', borderRadius: 100 }}>Patient Access</span>
           )}
        </div>
      </nav>

      <div className={styles.layoutWrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
              <h2 className={styles.clinicName}>Clinical Hub</h2>
              <p className={styles.clinicSub}>{hospitalName}</p>
            
            <div className={styles.sidebarNav}>
              {sidebarItems.map(item => (
                <button 
                  key={item.name}
                  className={`${styles.sidebarItem} ${activeTab === item.name ? styles.sidebarItemActive : ''}`}
                  onClick={() => setActiveTab(item.name as any)}
                >
                  <span className={styles.sideIcon}>{item.icon}</span>
                  <span className={styles.sideLabel}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sidebarFooter}>
              <div className={styles.drInfoCard}>
                <div className={styles.drAvatar}>
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                     {(rx?.doctor_name || 'Dr').charAt(0)}
                   </div>
                </div>
                <h4 className={styles.drName}>{rx?.doctor_name || 'Consulting Physician'}</h4>
                <div className={styles.drId}>ID: {id.slice(0, 6).toUpperCase()}</div>
              </div>
             {user && (
               <button 
                 className={styles.newRecordBtn}
                 onClick={() => router.push('/portal/prescription')}
               >
                  New Record
               </button>
             )}
          </div>
        </aside>

        <main className={styles.mainScroll}>
          <div className={styles.container}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loader}></div>
                <p>Loading electronic health records...</p>
              </div>
            ) : (error || !rx) ? (
              <div className={styles.errorContainer}>
                <h1>Oops!</h1>
                <p>{error || 'Access denied or records not found.'}</p>
                <button onClick={() => window.location.reload()}>Retry Access</button>
              </div>
            ) : (
              <>
                <header className={styles.pageHeader}>
                   <div className={styles.clinicDetails}>
                      <div className={styles.clinicNameFinal}>{hospitalName}</div>
                      <div className={styles.clinicSubFinal}>{clinic?.tagline || 'Advanced Clinical Hub'}</div>
                   </div>
                   <div className={styles.headerActions}>
                      <button className={styles.headerBtn + ' ' + styles.outlineBtn} onClick={() => window.print()}>Export PDF</button>
                      <button className={`${styles.headerBtn} ${styles.solidBtn}`}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                         Edit Profile
                      </button>
                   </div>
                </header>

                {activeTab === 'Patient Profile' && (
                  <div className={styles.profileGrid}>
                    <div className={styles.gridContent}>
                       <header className={styles.patientHero}>
                          <div className={styles.heroAvatar}>
                             {patient?.name?.[0].toUpperCase()}
                          </div>
                          <div className={styles.heroInfo}>
                             <div className={styles.heroBadge}>Verifed Patient</div>
                             <h1 className={styles.heroName}>{patient?.name}</h1>
                             <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 650, color: 'var(--text-soft)' }}>
                                <span>{patient?.age} Yrs</span>
                                <span>•</span>
                                <span>{patient?.gender}</span>
                                <span>•</span>
                                <span>ID: {rx.patient_id.slice(0, 8).toUpperCase()}</span>
                             </div>
                          </div>
                       </header>

                       <section className={styles.vitalCard}>
                          <div className={styles.vitalHeader}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                             Vital Biometrics
                          </div>
                          <div className={styles.vitalGrid}>
                             <div className={styles.vitalCircle}>
                                <span className={styles.vitalLabel}>AGE</span>
                                <span className={styles.vitalValue}>{patient?.age || '—'}</span>
                             </div>
                             <div className={styles.vitalCircle}>
                                <span className={styles.vitalLabel}>SEX</span>
                                <span className={styles.vitalValue}>{patient?.gender || '—'}</span>
                             </div>
                             <div className={styles.vitalCircle}>
                                <span className={styles.vitalLabel}>WEIGHT</span>
                                <span className={styles.vitalValue}>{rx.weight ? `${rx.weight} Kg` : '—'}</span>
                             </div>
                             <div className={styles.vitalCircle}>
                                <span className={styles.vitalLabel}>HEIGHT</span>
                                <span className={styles.vitalValue}>—</span>
                             </div>
                          </div>
                          <div className={styles.contactBanner}>
                             <div className={styles.contactItem}>
                                <div className={styles.contactIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                                <span>{patient?.contact || '—'}</span>
                             </div>
                          </div>
                       </section>

                       <section className={styles.conditionsCard}>
                          <div className={styles.condHeader}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
                             Key Clinical Conditions
                          </div>
                          <div className={styles.tagsRow}>
                             {history?.summary?.keyConditions?.map((c: string, i: number) => (
                               <div key={i} className={`${styles.tag} ${i ===0 ? styles.tagAlert : styles.tagNormal}`}>
                                  {i === 0 && <span className={styles.dot} />} {c}
                               </div>
                             )) || (
                               <div className={`${styles.tag} ${styles.tagNormal}`}>Healthy Assessment</div>
                             )}
                          </div>
                          <div className={styles.quoteBox}>
                             "Patient reports onset of symptoms 48 hours ago after dining out. No previous history of GI distress in the last 6 months. Symptoms peaked last evening."
                          </div>
                       </section>

                       <section className={styles.medsSection}>
                          <div className={styles.medsHeader}>
                             <h3 style={{ margin: 0, fontWeight: 900 }}>Current Maintenance Meds</h3>
                             <Link href="#" className={styles.viewHistory}>View History</Link>
                          </div>
                          <div className={styles.medsGrid}>
                             {history?.summary?.currentMedications?.slice(0, 3).map((m: any, i: number) => (
                               <div key={i} className={styles.medCard}>
                                  <div className={styles.medIconBox}>
                                     {typeof m === 'object' && (m.name.toLowerCase().includes('iv') || m.name.toLowerCase().includes('ors')) ? (
                                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><path d="M10 2v8"/><path d="M14 2v8"/><path d="M8 10h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10Z"/><path d="M8 14h8"/></svg>
                                     ) : (
                                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><circle cx="7" cy="7" r="5"/><circle cx="17" cy="17" r="5"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                                     )}
                                  </div>
                                  <div className={styles.medInfo}>
                                     <h4>{typeof m === 'object' ? m.name : m}</h4>
                                     <div className={styles.medInstruction}>1 Tablet • Twice Daily</div>
                                     <div className={styles.medDuration}>Duration: 7 Days</div>
                                  </div>
                               </div>
                             )) || <p>No maintenance medications listed.</p>}
                          </div>
                       </section>
                    </div>

                    <div className={styles.gridSidebar}>
                       <aside className={styles.intelCard}>
                          <div className={styles.intelHeader}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                             Clinical Snapshot (AI)
                          </div>
                          <div className={styles.intelBody}>
                            <p>{history?.summary?.recentVisitsSummary || 'No clinical snapshot available for this patient yet.'}</p>
                          </div>
                       </aside>

                       <section className={styles.demoCard}>
                          <h3>Quick Demographics</h3>
                          <div className={styles.demoRow}>
                             <span className={styles.demoLabel}>Patient ID</span>
                             <span className={styles.demoVal}>#{rx.patient_id.slice(0, 5).toUpperCase()}-ALPHA</span>
                          </div>
                          <div className={styles.demoRow}>
                             <span className={styles.demoLabel}>Registration Date</span>
                             <span className={styles.demoVal}>
                                {new Date(patient?.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                             </span>
                          </div>
                          <div className={styles.demoRow}>
                             <span className={styles.demoLabel}>Preferred Language</span>
                             <span className={styles.demoVal}>English</span>
                          </div>
                          <div className={styles.demoRow}>
                             <span className={styles.demoLabel}>Residential Status</span>
                             <span className={styles.demoVal}>Permanent</span>
                          </div>
                       </section>
                    </div>
                  </div>
                )}

                {activeTab === 'Current Script' && (
                  <div className={styles.paperWrapper}>
                    <div className={styles.paper}>
                      <header className={styles.clinicHeader}>
                        <div className={styles.clinicInfo}>
                          <h1 className={styles.clinicName}>{clinic?.name || 'MediNest Clinic'}</h1>
                          <p className={styles.tagline}>{clinic?.tagline || 'Advanced Healthcare Solutions'}</p>
                          <div className={styles.clinicContact}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                            <span>{clinic?.phone || '+91 000 000 0000'}</span>
                          </div>
                        </div>
                        <div className={styles.headerLogo}>
                          <div className={styles.logoCircle}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="32"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                          </div>
                        </div>
                        <div className={styles.doctorInfo}>
                          <h2 className={styles.drName}>{rx.doctor_name || 'Dr. Consultant'}</h2>
                          <p className={styles.drQual}>Reg No: {rx.doctor_id?.slice(0, 8).toUpperCase() || 'MED-0982-X'}</p>
                        </div>
                      </header>

                      <section className={styles.patientBar}>
                        <div className={styles.meta}>
                          <span className={styles.label}>NAME:</span>
                          <span className={styles.value}>{patient?.name || 'Valued Patient'}</span>
                        </div>
                        <div className={styles.meta}>
                          <span className={styles.label}>AGE/SEX:</span>
                          <span className={styles.value}>{patient?.age || '—'} / {patient?.gender?.[0] || '—'}</span>
                        </div>
                        <div className={styles.meta}>
                          <span className={styles.label}>WT:</span>
                          <span className={styles.value}>{rx.weight ? `${rx.weight} Kg` : '—'}</span>
                        </div>
                        <div className={styles.meta}>
                          <span className={styles.label}>DATE:</span>
                          <span className={styles.value}>{new Date(rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </section>

                      <main className={styles.mainContent}>
                        <div className={styles.watermark}>Rx</div>
                        <div className={styles.dualColumn}>
                          <div className={styles.leftCol}>
                            {rx.complaints && (
                              <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>C/C (CHIEF COMPLAINTS)</h3>
                                <p className={styles.text}>{rx.complaints}</p>
                              </div>
                            )}
                            {rx.findings && (
                              <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>O/E & FINDINGS</h3>
                                <p className={styles.text}>{rx.findings}</p>
                              </div>
                            )}
                          </div>

                          <div className={styles.rightCol}>
                            <div className={styles.rxIcon}>Rx</div>
                            <div className={styles.medsListFinal}>
                              {meds && meds.length > 0 ? (
                                meds.map((m: any, idx: number) => (
                                  <div key={idx} className={styles.medItemFinal}>
                                    <div className={styles.medHeaderFinal}>
                                      <strong>{idx+1}. {m.type} {m.name}</strong> 
                                      <span>{m.dose}</span>
                                    </div>
                                    <div className={styles.medScheduleFinal}>
                                      {m.freq} — {m.dur || m.duration} — {m.inst || m.instructions}
                                    </div>
                                    {m.note && <div className={styles.medNoteFinal}>* {m.note}</div>}
                                  </div>
                                ))
                              ) : (
                                <p className={styles.empty}>No specific medicines prescribed.</p>
                              )}
                            </div>

                            {rx.advice && (
                              <div className={styles.adviceSection}>
                                <h3 className={styles.sectionTitle}>Adv. (Advice/Instructions)</h3>
                                <p className={styles.text}>{rx.advice}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </main>

                      <footer className={styles.footerFinal}>
                        <div className={styles.contactInfoFinal}>
                          <p>{clinic?.address || 'Clinical Facility Address'}</p>
                          <p>Ph: {clinic?.phone || 'Contact Number'}</p>
                        </div>
                        <div className={styles.legalFinal}>
                           {hospitalName} • Digital Clinical Record
                        </div>
                      </footer>
                    </div>
                  </div>
                )}

                {activeTab === 'AI Summary' && (
                  <>
                    {activeSummary ? (
                      <div className={styles.aiContainer}>
                        <div className={styles.aiHero}>
                          <div className={styles.aiHeroText}>
                            <h1 className={styles.aiGreeting}>{activeSummary?.greeting || 'Hello!'}</h1>
                            <p className={styles.aiTagline}>Your AI-powered recovery assistant has analyzed your latest records to provide a streamlined clinical guide.</p>
                          </div>
                        </div>

                        <div className={styles.aiCardMain}>
                          <div className={styles.insightHeader}>
                            <div className={styles.insightIcon}><svg viewBox="0 0 24 24" fill="currentColor" width="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                            <h3>Prescription Insight</h3>
                          </div>
                          <p className={styles.aiCondition}>{activeSummary?.condition || 'Analyzing your condition...'}</p>
                        </div>

                        <div className={styles.aiGrid}>
                          <div className={styles.gridLeft}>
                            <div className={styles.medsCard}>
                              <div className={styles.cardHeader}>
                                <div className={styles.headerIcon}>💊</div>
                                <h3>Your Medicines</h3>
                              </div>
                              <div className={styles.medsContent}>
                                {activeSummary?.medicines?.map((m: any, i: number) => (
                                  <div key={i} className={styles.medItemAI}>
                                    <div className={styles.medIconAI}><svg viewBox="0 0 24 24" fill="currentColor" width="18"><path d="M10.5 20.5a7 7 0 1 1 9.9-9.9l-6.3 6.3a3.5 3.5 0 1 1-4.9-4.9l5.1-5.1"/></svg></div>
                                    <div className={styles.medInfoAI}>
                                      <div className={styles.medNameRow}>
                                        <span className={styles.medNameAI}>{m.name}</span>
                                        <span className={styles.medTagAI}>Scheduled</span>
                                      </div>
                                      <p className={styles.medPurposeAI}>{m.purpose}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className={styles.careCard}>
                               <div className={styles.cardHeader}>
                                  <div className={styles.headerIcon}>🥗</div>
                                  <h3>Care & Diet</h3>
                               </div>
                               <div className={styles.careContent}>
                                  <p>{activeSummary?.care}</p>
                               </div>
                            </div>
                          </div>

                          <div className={styles.gridRight}>
                            <div className={styles.expectCard}>
                              <div className={styles.cardHeader}>
                                 <div className={styles.headerIcon}>⏳</div>
                                 <h3>What to Expect</h3>
                              </div>
                              <div className={styles.timelineContent}>
                                 <p>{activeSummary?.expectations}</p>
                              </div>
                            </div>

                            <div className={styles.warningCard}>
                              <div className={styles.cardHeader}>
                                <div className={styles.headerIcon}>🚨</div>
                                <h3 style={{ color: '#ef4444' }}>Warning Signs</h3>
                              </div>
                              <div className={styles.warningContent}>
                                {Array.isArray(activeSummary?.warnings) ? (
                                  <ul className={styles.warningList}>
                                    {activeSummary.warnings.map((w: string, i: number) => (
                                      <li key={i}>{w}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>{activeSummary?.warnings || 'No specific warning signs to report.'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.aiLoadingHero}>
                        <div className={styles.aiLoadingPulse}>
                           <svg viewBox="0 0 24 24" fill="white" width="32"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        </div>
                        <div className={styles.aiBadge}>AI Assistant is preparing your guide...</div>
                        <p style={{ maxWidth: 400, margin: '0 auto', color: 'var(--text-soft)', fontWeight: 500 }}>Analyzing prescription data and crafting your personalized care summary in real-time.</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'Patient History' && (
                  <div className={styles.historyContainer}>
                    <div className={styles.historyHeader}>
                      <h2>Clinical History</h2>
                      <p>View past consultations and treatment progress for {patient?.name}.</p>
                    </div>

                    {loadingHistory ? (
                      <div className={styles.historyLoading}>
                        <div className={styles.loader}></div>
                        <p style={{ marginTop: 16, fontWeight: 600, color: 'var(--text-soft)' }}>Retrieving clinical records...</p>
                      </div>
                    ) : history?.visits?.length > 0 ? (
                      <div className={styles.timeline}>
                        {history.visits.map((visit: any, index: number) => (
                          <div key={index} className={styles.timelineItem}>
                            <div className={styles.timelineDate}>
                               {new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className={styles.timelinePoint} />
                            <div className={styles.timelineContent}>
                              <div className={styles.visitHeader}>
                                <h3>{visit.doctor || 'Senior Consultant'}</h3>
                                <span className={styles.visitType}>Consultation</span>
                              </div>
                              <div className={styles.visitBody}>
                                <div className={styles.visitCol}>
                                  <h4>Chief Complaints</h4>
                                  <p>{visit.complaints || 'Routine check-up'}</p>
                                </div>
                                <div className={styles.visitCol}>
                                  <h4>Medicines Prescribed</h4>
                                  <div className={styles.miniMeds}>
                                    {visit.medicines && visit.medicines.length > 0 ? (
                                      visit.medicines.map((m: any, mi: number) => (
                                        <span key={mi} className={styles.miniMedTag}>{typeof m === 'string' ? m : m.name}</span>
                                      ))
                                    ) : (
                                      <span style={{ fontSize: 12, fontStyle: italic, color: 'var(--text-soft)' }}>No medication prescribed</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Link href={`/view/${visit.prescription_id}`} className={styles.viewVisitBtn}>
                                View Full Prescription
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 4 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyHistory}>
                         <div className={styles.emptyIconHistory}>📋</div>
                         <h3>No past visits found.</h3>
                         <p>This appears to be the first recorded visit for this patient.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Drug Interaction' && (
                   <div className={styles.placeholderView}>
                      <div className={styles.placeholderIcon}>🛡️</div>
                      <h2>Drug Interaction Checker</h2>
                      <p>This module uses AI to check for potential interactions between prescribed medications. It is currently being calibrated for your clinical safety.</p>
                   </div>
                )}

                {activeTab === 'Clinic Notes' && (
                   <div className={styles.placeholderView}>
                      <div className={styles.placeholderIcon}>📝</div>
                      <h2>Confidential Clinic Notes</h2>
                      <p>Doctor's internal notes and private clinical observations for this patient record.</p>
                   </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
