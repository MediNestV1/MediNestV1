'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
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
}

interface Clinic {
  name: string;
  address: string;
  phone: string;
  tagline: string;
}

export default function ViewPrescription({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rx, setRx] = useState<Prescription | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      try {
        // 1. Fetch Prescription
        const { data: rxData, error: rxError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', id)
          .single();

        if (rxError) throw rxError;
        setRx(rxData);

        // 2. Fetch Patient
        if (rxData.patient_id) {
          const { data: pData, error: pError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', rxData.patient_id)
            .single();
          if (pError) console.error('Patient fetch error:', pError);
          else setPatient(pData);
        }

        // 3. Fetch Clinic
        if (rxData.clinic_id) {
          const { data: cData, error: cError } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', rxData.clinic_id)
            .single();
          if (cError) console.error('Clinic fetch error:', cError);
          else setClinic(cData);
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Prescription not found');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // --- NEW: Polling for AI Summary ---
    const intervalId = setInterval(async () => {
      // We check if we have rx but NO summary yet
      if (id && !rx?.ai_summary) {
        const supabase = createClient();
        const { data } = await supabase.from('prescriptions').select('ai_summary').eq('id', id).single();
        if (data?.ai_summary) {
          setRx(prev => prev ? ({ ...prev, ai_summary: data.ai_summary }) : null);
          clearInterval(intervalId);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [id, !!rx?.ai_summary]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Fetching your digital prescription...</p>
      </div>
    );
  }

  if (error || !rx) {
    return (
      <div className={styles.errorContainer}>
        <h1>Oops!</h1>
        <p>{error || 'We couldn\'t find that prescription.'}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const meds = typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines;
  const followUpDate = rx.advice?.match(/\[REVISIT DATE: (.*?)\]/)?.[1] || rx.valid_till;

  return (
    <div className={styles.container}>
      {/* 🤖 NEW: AI Summary "First Page" Card */}
      {rx.ai_summary ? (
        <div className={styles.aiCard}>
          <div className={styles.aiBadge}>Doctor's AI Assistant Note</div>
          <h1 className={styles.aiGreeting}>{rx.ai_summary.greeting}</h1>
          <p className={styles.aiIntro}>{rx.ai_summary.visit_reason}</p>
          <div className={styles.aiExplanation}>
            <span className={styles.aiIcon}>💡</span>
            <p>{rx.ai_summary.explanation}</p>
          </div>

          <div className={styles.aiGrid}>
            <div className={styles.aiSection}>
              <h3>💊 Your Medicines:</h3>
              <ul className={styles.aiList}>
                {rx.ai_summary.medicines?.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.aiSection}>
              <h3>🧠 What You Might Feel:</h3>
              <p>{rx.ai_summary.expectations}</p>
            </div>

            <div className={styles.aiSection}>
              <h3>⚠️ Be Careful:</h3>
              <p>{rx.ai_summary.warning}</p>
            </div>

            <div className={styles.aiSection}>
              <h3>🥗 What You Should Do:</h3>
              <p>{rx.ai_summary.lifestyle}</p>
            </div>
          </div>

          <div className={styles.aiFooter}>
            <div className={styles.aiFollowUp}>{rx.ai_summary.follow_up}</div>
            <div className={styles.aiScrollTip}>Scroll down for full formal prescription ↓</div>
          </div>
        </div>
      ) : (
        <div className={styles.aiLoadingHero}>
          <div className={styles.aiLoadingBadge}>AI Assistant is preparing your guide...</div>
          <div className={styles.aiLoadingPulse}></div>
          <p>Please wait a moment while I prepare a friendly summary of your prescription.</p>
        </div>
      )}

      <div className={styles.paper}>
        {/* Clinic Header */}
        <header className={styles.header}>
          <div className={styles.clinicHeader}>
            <div className={styles.clinicInfo}>
              <h1 className={styles.clinicName}>{clinic?.name || 'Sitapur Shishu Kendra'}</h1>
              <p className={styles.tagline}>{clinic?.tagline || 'Health is Wealth'}</p>
              <div className={styles.clinicContact}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                <span>{clinic?.phone || '+917380520394'}</span>
              </div>
            </div>
            <div className={styles.headerLogo}>
              <div className={styles.logoCircle}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              </div>
            </div>
            <div className={styles.doctorInfo}>
              <h2 className={styles.drName}>{rx.doctor_name || 'Dr. Consultant'}</h2>
              <p className={styles.drQual}>MBBS, MD</p>
            </div>
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
            <span className={styles.value}>{new Date(rx.date).toLocaleDateString('en-IN')}</span>
          </div>
        </section>

        {/* Main Body */}
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
              <div className={styles.medsList}>
                {meds && meds.length > 0 ? (
                  meds.map((m: any, idx: number) => (
                    <div key={idx} className={styles.medItem}>
                      <div className={styles.medHeader}>
                        <strong>{m.type}. {m.name}</strong> <span>{m.dose}</span>
                      </div>
                      <div className={styles.medSchedule}>
                        {m.freq} — {m.dur || m.duration} — {m.inst || m.instructions}
                      </div>
                      {m.note && <div className={styles.medNote}>* {m.note}</div>}
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>No specific medicines prescribed.</p>
                )}
              </div>

              {rx.advice && (
                <div className={styles.adviceSection}>
                  <h3 className={styles.sectionTitle}>Adv. (Advice/Instructions)</h3>
                  <p className={styles.text}>{rx.advice.split('\n\n[')[0]}</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Follow-up Section */}
        {followUpDate && (
          <section className={styles.followUp}>
            <div className={styles.followUpCard}>
              <div className={styles.followUpLabel}>FOLLOW-UP VISIT</div>
              <div className={styles.followUpValue}>
                {new Date(followUpDate).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.contactInfo}>
            <p>{clinic?.address || 'Clinic Address'}</p>
            <p>Phone: {clinic?.phone || 'Contact Number'}</p>
          </div>
          <div className={styles.legal}>
            Digital Prescription • Not for Medico-Legal use
          </div>
        </footer>
      </div>

      <div className={styles.actions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print Prescription
        </button>
      </div>
    </div>
  );
}
