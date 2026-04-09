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
    async function fetchData(retryCount = 0) {
      const supabase = createClient();
      try {
        // 1. Fetch Prescription
        const { data: rxData, error: rxError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', id)
          .single();

        if (rxError) {
          if (retryCount < 3) {
            console.log(`Rx not found, retrying in 2s... (Attempt ${retryCount + 1}/3)`);
            setTimeout(() => fetchData(retryCount + 1), 2000);
            return;
          }
          throw rxError;
        }
        
        setRx(rxData);

        // --- SUB-TRIGGER: Hybrid AI Fallback ---
        if (!rxData.ai_summary) {
          console.log('🤖 Summary missing on view - triggering fallback AI...');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://medinestv1.onrender.com';
          const rxDataForAI = {
            patient_id: rxData.patient_id,
            complaints: rxData.complaints,
            findings: rxData.findings,
            medicines: typeof rxData.medicines === 'string' ? JSON.parse(rxData.medicines) : rxData.medicines,
            advice: rxData.advice,
            // Note: Patient name will be fetched in step 2
          };

          fetch(`${apiUrl}/api/prescriptions/${id}/ai-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rxData: rxDataForAI })
          }).catch(e => console.error('AI Fallback trigger failed:', e));
        }

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

    // --- Polling for AI Summary ---
    const intervalId = setInterval(async () => {
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
        <p>Fetching your digital prescription guide...</p>
      </div>
    );
  }

  if (error || !rx) {
    return (
      <div className={styles.errorContainer}>
        <h1>Hang Tight!</h1>
        <p>We're finalizing your digital prescription. Please try again in a few seconds.</p>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  const meds = typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines;
  const followUpDate = rx.advice?.match(/\[REVISIT DATE: (.*?)\]/)?.[1] || rx.valid_till;

  // Helper to safely render AI medicine items (prevents React Error #31)
  const formatAiMed = (m: any) => {
    if (typeof m === 'string') return m;
    if (typeof m === 'object' && m !== null) {
      // Format medicine object: "Name - Dose (Instructions)"
      const parts = [
        m.name || m.medicine || '',
        m.dose || m.dosage || '',
        m.instructions || m.frequency || m.freq || m.duration || ''
      ].filter(Boolean);
      return parts.join(' - ');
    }
    return String(m);
  };

  return (
    <div className={styles.container}>
      {/* 🤖 SECTION 1: AI Summary Companion (Now Top) */}
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
                {rx.ai_summary.medicines?.map((m: any, i: number) => (
                  <li key={i}>{formatAiMed(m)}</li>
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
          </div>
        </div>
      ) : (
        <div className={styles.aiLoadingHero}>
          <div className={styles.aiLoadingBadge}>AI Assistant is preparing your guide...</div>
          <div className={styles.aiLoadingPulse}></div>
          <p>Please wait a moment while I prepare a friendly summary of your prescription.</p>
        </div>
      )}

      <div className={styles.divider}>
        <span>FORMAL PRESCRIPTION</span>
      </div>

      {/* 🧾 SECTION 2: Formal Prescription Paper (Now Below Summary) */}
      <div className={styles.paper}>
        {/* Clinic Header */}
        <header className={styles.header}>
          <div className={styles.clinicHeader}>
            <div className={styles.clinicInfo}>
              <h1 className={styles.clinicName}>{clinic?.name || 'MediNest Clinic'}</h1>
              <p className={styles.tagline}>{clinic?.tagline || 'Your Health, Our Priority'}</p>
              <div className={styles.clinicContact}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                <span>{clinic?.phone || 'Contact Info'}</span>
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

        {/* Patient Bar */}
        <div className={styles.patientBar}>
          <div className={styles.pItem}><strong>Patient:</strong> {patient?.name || 'N/A'}</div>
          <div className={styles.pItem}><strong>Age/Sex:</strong> {patient?.age || 'N/A'} / {patient?.gender || 'N/A'}</div>
          <div className={styles.pItem}><strong>Weight:</strong> {rx.weight || 'N/A'} kg</div>
          <div className={styles.pItem}><strong>Date:</strong> {new Date(rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>

        {/* Clinical Section */}
        <div className={styles.dualColumn}>
          <div className={styles.leftCol}>
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Chief Complaints</h4>
              <p className={styles.text}>{rx.complaints || 'None listed'}</p>
            </div>
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Clinical Findings</h4>
              <p className={styles.text}>{rx.findings || 'None listed'}</p>
            </div>
          </div>
          <div className={styles.rightCol}>
            <div className={styles.rxIcon}>℞</div>
            <div className={styles.medsList}>
              {meds.map((m: any, i: number) => (
                <div key={i} className={styles.medItem}>
                  <div className={styles.medHeader}>
                    {i + 1}. <strong>{m.name}</strong> 
                    <span className={styles.medDose}>{m.dosage || m.dose}</span>
                  </div>
                  {m.note && <div className={styles.medNote}>{m.note}</div>}
                  <div className={styles.medSchedule}>
                    {m.freq} — {m.dur || m.duration} — {m.inst || m.instructions}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.adviceSection}>
              <h4 className={styles.sectionTitle}>Advice / Lifestyle</h4>
              <p className={styles.text}>{rx.advice || 'Follow as advised'}</p>
            </div>

            <div className={styles.footer}>
              <div className={styles.followUp}>
                <div className={styles.followUpCard}>
                  <div className={styles.followUpLabel}>FOLLOW UP</div>
                  <div className={styles.followUpValue}>
                    {followUpDate ? new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'As advised'}
                  </div>
                </div>
              </div>
              <div className={styles.doctorSig}>
                <div className={styles.sigLine}></div>
                <p>Doctor's Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print Prescription
        </button>
      </div>

    </div>
  );
}
