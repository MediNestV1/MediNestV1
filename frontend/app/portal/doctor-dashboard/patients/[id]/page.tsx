'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';
import Link from 'next/link';
import { API_BASE_URL, authenticatedFetch } from '@/lib/api';

interface Patient {
  id: string;
  name: string;
  contact?: string;
  age?: number;
  gender?: string;
  created_at: string;
}

interface Visit {
  visit_date: string;
  created_at?: string;
  doctor: string;
  complaints: string;
  findings: string;
  medicines: any[];
  advice: string;
  prescription_id: string;
}

interface Snapshot {
  keyConditions: string[];
  currentMedications: any[];
  recentVisitsSummary: string;
}

export default function PatientHub({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Patient Summary');

  const supabase = createClient();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/patient-history/${patientId}`);
        const data = await response.json();

        if (data.patient) setPatient(data.patient);
        if (data.visits) setVisits(data.visits);
        if (data.summary) setSnapshot(data.summary);
      } catch (err) {
        console.error('Error fetching patient hub data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  if (loading) return <div className={styles.loading}>Initializing Clinical Hub...</div>;

  const navItems = [
    { label: 'Patient Summary', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { label: 'Clinical History', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
    { label: 'Medications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.5 20.5a7 7 0 1 1 9.9-9.9l-6.3 6.3a3.5 3.5 0 1 1-4.9-4.9l5.1-5.1"></path></svg> },
    { label: 'Lab Results', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v8l-8 12h20l-8-12V2"></path><line x1="6" y1="12" x2="18" y2="12"></line></svg> },
    { label: 'Encounters', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> },
  ];

  // Helper: Aggregate all medications
  const allMeds = visits.reduce((acc: any[], v) => {
    const medsWithDate = v.medicines.map(m => ({ ...m, date: v.visit_date, doctor: v.doctor }));
    return [...acc, ...medsWithDate];
  }, []);

  const renderSummary = () => (
    <>
       <section className={styles.snapshotCard}>
          <div className={styles.snapGroup}>
             <h4>Bio-Metrics</h4>
             <div className={styles.snapValue}>{patient?.name}</div>
             <div style={{ marginTop: 8, opacity: 0.8 }}>{patient?.age} / {patient?.gender}</div>
             <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>{patient?.contact}</div>
          </div>

          <div className={styles.snapGroup}>
             <h4>⚠️ Key Conditions</h4>
             <ul className={styles.conditionList}>
                {snapshot?.keyConditions ? snapshot.keyConditions.map((c, i) => (
                  <li key={i}>{c}</li>
                )) : <li>{loading ? 'Calculated...' : 'No conditions found'}</li>}
             </ul>
             <h4 style={{ marginTop: 24 }}>💊 Current Medications</h4>
             <ul className={styles.conditionList}>
                {snapshot?.currentMedications ? snapshot.currentMedications.map((m, i) => (
                  <li key={i}>{typeof m === 'object' ? m.name : m}</li>
                )) : <li>{loading ? 'Analyzing Rx...' : 'None listed'}</li>}
             </ul>
          </div>

          <div className={styles.snapGroup}>
             <div className={styles.visitSummary}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                   <span style={{ fontWeight: 800, fontSize: 13 }}>RECENT VISITS</span>
                </div>
                <p className={styles.summaryText}>{snapshot?.recentVisitsSummary}</p>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', color: '#f59e0b', fontSize: 13, fontWeight: 800 }}>
                   IMPORTANT: Revisit for follow-up as advised.
                </div>
             </div>
          </div>
       </section>
       
       <div className={styles.sectionBox}>
          <h3>Quick Profile</h3>
          <div className={styles.profileGrid}>
             <div className={styles.profileItem}><strong>Contact:</strong> {patient?.contact}</div>
             <div className={styles.profileItem}><strong>Age:</strong> {patient?.age} Years</div>
             <div className={styles.profileItem}><strong>Gender:</strong> {patient?.gender}</div>
             <div className={styles.profileItem}><strong>Joined:</strong> {new Date(patient?.created_at || '').toLocaleDateString()}</div>
          </div>
       </div>
    </>
  );

  const renderHistory = () => (
    <>
       <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search clinical notes..." style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }} />
       </div>

       <section className={styles.timelineSection}>
          {visits.map((visit, index) => (
            <div key={visit.prescription_id} className={styles.timelineItem}>
               <div className={styles.timelineMarker} />
               <div className={styles.timelineCard}>
                  <div className={styles.timelineHeader}>
                     <div className={styles.visitMeta}>
                        <h3>Consultation - {visit.doctor}</h3>
                        <p>{new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date(visit.created_at || visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                     <span className={`${styles.badge} ${styles.badgeFollowUp}`}>COMPLETED Visit</span>
                  </div>

                  <div className={styles.visitDetails}>
                     <div className={styles.detailBlock}>
                        <h5>Chief Complaints</h5>
                        <div className={styles.complaintList}>
                           <p style={{ fontSize: 15, lineHeight: 1.6, color: '#334155' }}>• {visit.complaints}</p>
                           {visit.findings && <p style={{ fontSize: 15, lineHeight: 1.6, color: '#334155' }}>• {visit.findings}</p>}
                        </div>

                        <h5>Prescribed Medications</h5>
                        <div className={styles.medList}>
                           {visit.medicines.map((m, mi) => (
                             <div key={mi} className={styles.medCardSmall}>
                                <div className={styles.medIcon}>💊</div>
                                <div className={styles.medInfo}>
                                   <h6>{m.name}</h6>
                                   <p>{m.dose} • {m.freq} • {m.dur}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className={styles.detailBlock}>
                        <h5>Doctor's Advice</h5>
                        <div className={styles.doctorNote}>
                           <p style={{ fontStyle: 'italic', color: '#475569', lineHeight: 1.7 }}>
                             "{visit.advice}"
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {visits.length === 0 && (
            <div className={styles.emptyState}>No visits found.</div>
          )}
       </section>
    </>
  );

  const renderMedications = () => (
    <div className={styles.sectionBox}>
       <h3>All Historical Medications</h3>
       <table className={styles.hubTable}>
          <thead>
             <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Prescribed On</th>
                <th>Doctor</th>
             </tr>
          </thead>
          <tbody>
             {allMeds.map((m, i) => (
               <tr key={i}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.dose}</td>
                  <td>{m.freq}</td>
                  <td>{m.dur}</td>
                  <td>{new Date(m.date).toLocaleDateString()}</td>
                  <td>{m.doctor}</td>
               </tr>
             ))}
             {allMeds.length === 0 && (
               <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No medications found.</td></tr>
             )}
          </tbody>
       </table>
    </div>
  );

  const renderLabs = () => (
    <div className={styles.emptyHubState}>
       <div className={styles.emptyIcon}>🧪</div>
       <h2>No Lab Results Yet</h2>
       <p>Laboratory integrations and reports for {patient?.name} will appear here.</p>
       <button className={styles.btnSecondary} style={{ marginTop: 24 }}>Upload Report</button>
    </div>
  );

  const renderEncounters = () => (
    <div className={styles.sectionBox}>
       <h3>Clinical Encounters</h3>
       <table className={styles.hubTable}>
          <thead>
             <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Specialty</th>
                <th>Practitioner</th>
                <th>Status</th>
                <th>Actions</th>
             </tr>
          </thead>
          <tbody>
             {visits.map((v, i) => (
               <tr key={i}>
                  <td>{new Date(v.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{new Date(v.created_at || v.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>General Practice</td>
                  <td>{v.doctor}</td>
                  <td><span className={styles.badge} style={{ background: '#e0f2fe', color: '#0369a1' }}>COMPLETED</span></td>
                  <td>
                     <button className={styles.tableAction} onClick={() => { setActiveTab('Clinical History'); }}>View Record</button>
                  </td>
               </tr>
             ))}
             {visits.length === 0 && (
               <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No encounters found.</td></tr>
             )}
          </tbody>
       </table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Hub Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
               <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sanctuary-lavender)', color: 'var(--sanctuary-primary)', fontSize: 32, fontWeight: 900 }}>
                 {patient?.name?.[0]}
               </div>
            </div>
            <h3 className={styles.profileName}>{patient?.name}</h3>
            <p className={styles.profileId}>ID: {patientId.slice(0, 8).toUpperCase()}</p>
          </div>

          <nav className={styles.nav}>
            {navItems.map(item => (
              <button 
                key={item.label} 
                className={`${styles.navLink} ${activeTab === item.label ? styles.activeNavLink : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Hub Content area */}
        <main className={styles.content}>
           <div className={styles.hubHeader}>
              <h2 className={styles.patientTitle}>{activeTab}</h2>
              <div className={styles.actionGroup}>
                 <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => router.push(`/portal/digital-prescription?patientId=${patientId}`)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Visit
                 </button>
                 <button className={`${styles.actionBtn} ${styles.btnSecondary}`}>Export History</button>
              </div>
           </div>

           {activeTab === 'Patient Summary' && renderSummary()}
           {activeTab === 'Clinical History' && renderHistory()}
           {activeTab === 'Medications' && renderMedications()}
           {activeTab === 'Lab Results' && renderLabs()}
           {activeTab === 'Encounters' && renderEncounters()}
        </main>
      </div>
    </DashboardLayout>
  );
}
