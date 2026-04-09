'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';
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
  
  // --- HYDRATION GUARD ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // --- MULTI-LANG STATE ---
  const [selectedLang, setSelectedLang] = useState<'English' | 'Hindi'>('English');
  const [hindiCache, setHindiCache] = useState<any>(null);
  const [isGeneratingHindi, setIsGeneratingHindi] = useState(false);

  async function generateAiSummary(currentRx: Prescription, pt: Patient | null, lang: 'English' | 'Hindi' = 'English') {
    if (lang === 'Hindi') setIsGeneratingHindi(true);
    try {
      console.log(`🤖 Triggering ${lang} AI Summary (Stateless: ${lang === 'Hindi'})...`);
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${id}/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: pt?.name || 'Patient',
          complaints: currentRx.complaints,
          findings: currentRx.findings,
          medicines: typeof currentRx.medicines === 'string' ? JSON.parse(currentRx.medicines) : currentRx.medicines,
          advice: currentRx.advice,
          followUp: currentRx.valid_till,
          lang: lang,
          persist: lang === 'English' // Only save English to DB
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${lang} AI Summary Generated:`, result);
        if (result.summary) {
          if (lang === 'English') {
            setRx(prev => prev ? ({ ...prev, ai_summary: result.summary }) : null);
          } else {
            setHindiCache(result.summary);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${lang} AI Trigger Error:`, err);
    } finally {
      if (lang === 'Hindi') setIsGeneratingHindi(false);
    }
  }

  async function fetchRxData() {
    const supabase = createClient();
    try {
      console.log('🔄 Fetching/Refreshing RX data...');
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
    if (rx && !rx.ai_summary && !loading) {
      generateAiSummary(rx, patient);
    }
  }, [rx?.id, !!rx?.ai_summary, loading]);

  const activeSummary = selectedLang === 'English' ? rx?.ai_summary : hindiCache;
  const followUpDate = rx?.valid_till;
  const meds = rx?.medicines ? (typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines) : [];

  if (!mounted) return null;

  return (
    <>
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <div className={styles.pillContainer}>
          <div 
            className={styles.pillActive} 
            style={{ 
              transform: `translateX(${selectedLang === 'English' ? '0' : '100%'})`,
              backgroundColor: '#1a1a1a'
            }}
          ></div>
          <button 
            className={`${styles.pillBtn} ${selectedLang === 'English' ? styles.btnTextActive : ''}`}
            onClick={() => setSelectedLang('English')}
          >
            English
          </button>
          <button 
            className={`${styles.pillBtn} ${selectedLang === 'Hindi' ? styles.btnTextActive : ''}`}
            onClick={() => {
              setSelectedLang('Hindi');
              if (!hindiCache && rx) generateAiSummary(rx, patient, 'Hindi');
            }}
          >
            हिन्दी
          </button>
        </div>
      </nav>

      <div className={styles.container} style={{ paddingTop: '80px' }}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Fetching your digital prescription...</p>
          </div>
        ) : (error || !rx) ? (
          <div className={styles.errorContainer}>
            <h1>Oops!</h1>
            <p>{error || 'We couldn\'t find that prescription.'}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : (
          <>
            {activeSummary || isGeneratingHindi ? (
              <div className={styles.aiContainer}>
                <div className={styles.aiHeaderCard}>
                  <div className={styles.aiBadge}>
                    <span>✦</span> Secure AI Agent Record
                  </div>

                  {isGeneratingHindi ? (
                    <div style={{ padding: '20px 0' }}>
                      <div className={styles.aiLoadingPulse} style={{ width: '30px', height: '30px', marginBottom: '15px' }}></div>
                      <p style={{ opacity: 0.8 }}>तैयार किया जा रहा है... (Creating Hindi version)</p>
                    </div>
                  ) : (
                    <>
                      <h1 className={styles.aiGreeting}>{activeSummary?.greeting}</h1>
                      <p className={styles.aiCondition}>{activeSummary?.condition}</p>
                    </>
                  )}
                </div>

                {!isGeneratingHindi && activeSummary && (
                  <div className={styles.aiGrid}>
                    <div className={`${styles.aiStepCard} ${styles.medCard}`}>
                      <div className={styles.cardIcon}>💊</div>
                      <div className={styles.cardTitle}>{selectedLang === 'Hindi' ? 'आपकी दवाइयां' : 'Your Medicines'}</div>
                      <div className={styles.cardContent}>
                        <ul className={styles.aiList}>
                          {activeSummary.medicines?.map((m: any, i: number) => (
                            <li key={i}>
                              <strong>{m.name}</strong>: {m.purpose}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className={`${styles.aiStepCard} ${styles.timelineCard}`}>
                      <div className={styles.cardIcon}>⏳</div>
                      <div className={styles.cardTitle}>{selectedLang === 'Hindi' ? 'उम्मीद' : 'What to Expect'}</div>
                      <p className={styles.cardContent}>{activeSummary.expectations}</p>
                    </div>

                    <div className={`${styles.aiStepCard} ${styles.aiFullWidth} ${styles.careCard}`}>
                      <div className={styles.cardIcon}>🥗</div>
                      <div className={styles.cardTitle}>{selectedLang === 'Hindi' ? 'आहार और देखभाल' : 'Care & Diet Instructions'}</div>
                      <p className={styles.cardContent}>{activeSummary.care}</p>
                    </div>

                    <div className={`${styles.aiStepCard} ${styles.warningCard}`}>
                      <div className={styles.cardIcon}>🚨</div>
                      <div className={styles.cardTitle}>{selectedLang === 'Hindi' ? 'खतरे के संकेत' : 'Warning Signs'}</div>
                      <ul className={styles.warningList}>
                        {activeSummary.warnings?.map((w: string, i: number) => (
                          <li key={i}><span>!</span> {w}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={`${styles.aiStepCard} ${styles.nextStepCard}`}>
                      <div className={styles.cardIcon}>📅</div>
                      <div className={styles.cardTitle}>{selectedLang === 'Hindi' ? 'अगला कदम' : 'Next Steps'}</div>
                      <p className={styles.cardContent}>{activeSummary.next_steps}</p>
                    </div>
                  </div>
                )}
                <div style={{textAlign: 'center', opacity: 0.5, fontSize: '12px', marginBottom: '20px'}}>
                  {selectedLang === 'Hindi' ? 'पूरी औपचारिक पर्ची के लिए नीचे स्क्रॉल करें ↓' : 'Scroll down for formal clinical prescription ↓'}
                </div>
              </div>
            ) : (
              <div className={styles.aiLoadingHero}>
                <div className={styles.aiLoadingPulse}></div>
                <div className={styles.aiBadge}>AI Assistant is preparing your guide...</div>
                <p>Analyzing prescription data and crafting your personalized care summary.</p>
              </div>
            )}

            <div className={styles.paper}>
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
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print Prescription
        </button>
      </div>
    </>
  );
}
