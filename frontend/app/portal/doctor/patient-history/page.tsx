'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';
import Link from 'next/link';

interface Visit {
  visit_date: string;
  notes: string | null;
  prescription: any;
}

interface Patient {
  id: string;
  name: string;
  contact?: string;
  age?: number;
  gender?: string;
  created_at: string;
}

function PatientHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams?.get('patientId');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summary, setSummary] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  // 1. Fetch patients for grid (Search Mode)
  useEffect(() => {
    if (patientId) return;
    
    const fetchPatients = async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!error && data) {
        setPatientList(data);
      }
      setIsSearching(false);
    };
    
    const delayDebounceFn = setTimeout(fetchPatients, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [patientId, searchTerm, supabase]);

  // 2. Fetch specific history (Detail Mode)
  useEffect(() => {
    if (!patientId) return;
    
    const fetchHistory = async () => {
      // Fetch patient details
      const { data: pData } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (pData) setPatient(pData);

      // Fetch visits (prescriptions)
      const { data: vData } = await supabase.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
      
      if (vData) {
        setVisits(vData.map(v => ({
          visit_date: v.created_at,
          notes: v.advice,
          prescription: v
        })));
        
        // Use advice as a summary placeholder if summary generating logic is complex
        setSummary(vData[0]?.advice || 'No summary available.');
      }
    };
    
    fetchHistory();
  }, [patientId, supabase]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // --- Search View ---
  if (!patientId) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>Patient Portfolio</h1>
              <p>Access comprehensive historical data and treatment paths for your registered patients.</p>
            </div>
            <div className={styles.headerActions}>
               <button className={styles.refineBtn}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                 Refine List
               </button>
               <button className={styles.registerBtn} onClick={() => router.push('/portal/prescription')}>
                 Register New
               </button>
            </div>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                className={styles.searchInput}
                placeholder="Search patients, medical history, or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.patientGrid}>
            {isSearching ? (
              <div className={styles.loading}>
                 <p>Searching records...</p>
              </div>
            ) : patientList.length > 0 ? (
              patientList.map(p => (
                <div key={p.id} className={styles.patientCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>{getInitials(p.name)}</div>
                    <span className={`${styles.badge} ${styles.badgeStable}`}>STABLE</span>
                  </div>
                  <h3 className={styles.patientName}>{p.name}</h3>
                  <p className={styles.patientContact}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                     {p.contact || 'No Contact'}
                  </p>
                  <div className={styles.tagCloud}>
                    <span className={styles.tag}>{p.gender === 'Female' ? 'Maternity' : 'General'}</span>
                    <span className={styles.tag}>{p.age ? `${p.age} Years` : 'Age N/A'}</span>
                    <span className={styles.tag}>Routine Visit</span>
                  </div>
                  <button className={styles.viewBtn} onClick={() => router.push(`/portal/doctor/patient-history?patientId=${p.id}`)}>
                    View History
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No patients found. Get started by registering a new patient.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --- Detail View ---
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.detailHeader}>
           <Link href="/portal/doctor/patient-history" style={{ color: 'var(--sanctuary-ink-l)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontWeight: 600 }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
             Back to Portfolio
           </Link>
           <div className={styles.header}>
              <div className={styles.headerTitle}>
                <h1>History – {patient?.name}</h1>
                <p>{patient?.age}Y • {patient?.gender} • {patient?.contact}</p>
              </div>
              <button className={styles.registerBtn} onClick={() => router.push(`/portal/prescription?patientId=${patientId}`)}>
                Add Visit
              </button>
           </div>
        </div>

        <section className={styles.summarySection}>
           <h3>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
             Clinical Summary
           </h3>
           <div className={styles.summaryContent}>{summary}</div>
        </section>

        <h2 className={styles.visitTitle}>Previous Visits</h2>
        <div className={styles.visitTimeline}>
          {visits.map((v, i) => (
            <div key={i} className={styles.visitItem} style={{ marginBottom: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--sanctuary-primary)' }}>
                   {new Date(v.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}
                 </p>
                 <span className={`${styles.badge} ${styles.badgeFollowUp}`}>COMPLETED</span>
               </div>
               <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, marginBottom: 16 }}>
                 <p style={{ fontWeight: 600, fontSize: 14, color: '#64748b', marginBottom: 8 }}>DIAGNOSIS & ADVICE</p>
                 <p style={{ margin: 0, lineScale: 1.5 }}>{v.notes}</p>
               </div>
            </div>
          ))}
          {visits.length === 0 && (
            <div className={styles.emptyState}>No previous visits recorded.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PatientHistory() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading Data...</div>}>
      <PatientHistoryContent />
    </Suspense>
  );
}
