'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

// Types
interface Medicine {
  id: string;
  name: string;
  frequency: string;
  duration: string;
}

interface SummaryData {
  patientName: string; age: string; sex: string; regNo: string; doa: string; dod: string; doctor: string; 
  diagnosis: string; 
  complaints: string[]; 
  findings: string[]; 
  treatment: string[]; 
  advice: string[]; 
  medicines: Medicine[];
}

interface Suggestion {
  field: string;
  index: number;
  text: string;
  fullText: string;
}

const SECTION_SEQUENCE = ['complaints', 'findings', 'treatment', 'advice'];

export default function DischargeSummaryRedesign() {
  const router = useRouter();
  const { clinic, doctors, loading: clinicLoading } = useClinic();
  const supabase = createClient();

  // 1. Unified State
  const [summary, setSummary] = useState<SummaryData>({
    patientName: '', age: '', sex: 'Male', regNo: '', doa: '', dod: '', doctor: '', 
    diagnosis: '', complaints: [], findings: [], treatment: [], advice: [], medicines: []
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  
  // UX Feedback State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Refs for debounce
  const suggestTimer = useRef<NodeJS.Timeout | null>(null);

  // 2. Load Draft with Migration Logic
  useEffect(() => {
    const draftStr = localStorage.getItem('discharge_summary_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        const migrate = (val: any) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim()) {
            return val.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
          }
          return [];
        };
        setSummary({
          ...draft,
          complaints: migrate(draft.complaints),
          findings: migrate(draft.findings),
          treatment: migrate(draft.treatment),
          advice: migrate(draft.advice)
        });
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // 3. Auto-save
  const saveDraft = useCallback((data: SummaryData) => {
    localStorage.setItem('discharge_summary_draft', JSON.stringify(data));
    setLastSaved(new Date());
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  }, []);

  useEffect(() => {
    if (autoSaveStatus === 'idle') {
      const timer = setTimeout(() => {
        setAutoSaveStatus('saving');
        saveDraft(summary);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [summary, saveDraft, autoSaveStatus]);

  const updateField = (field: keyof SummaryData, value: any) => {
    setSummary(prev => ({ ...prev, [field]: value }));
  };

  // --- SMART ASSIST ENGINE ---
  const fetchSmartSuggestion = async (field: string, index: number, currentText: string) => {
    if (!currentText || currentText.trim().split(' ').length < 2) {
      setActiveSuggestion(null);
      return;
    }

    // Context-aware Intelligent Completion Mock
    const input = currentText.toLowerCase();
    let suggestion = "";

    const diag = summary.diagnosis.toLowerCase();
    
    // Logic for Complaints
    if (field === 'complaints') {
      if (input.includes('chest pain')) {
        if (diag.includes('acs') || diag.includes('heart')) suggestion = "radiating to left arm and sweating";
        else suggestion = "associated with breathlessness";
      }
      else if (input.includes('fever')) suggestion = "associated with chills and rigor";
      else if (input.includes('cough')) suggestion = "with yellowish expectoration for 3 days";
    }
    // Logic for Findings
    else if (field === 'findings') {
      if (input.includes('pulse')) suggestion = "88/min, regular, all peripheral pulses felt";
      else if (input.includes('bp')) suggestion = "130/80 mmHg in right arm supine position";
      else if (input.includes('chest')) suggestion = "bilateral air entry normal, no added sounds";
    }
    // Logic for Treatment
    else if (field === 'treatment') {
      if (input.includes('nebulization')) suggestion = "with Duolin and Budecort every 6 hours";
      else if (input.includes('iv fluids')) suggestion = "RL @ 100ml/hr for 24 hours";
    }
    // Logic for Advice
    else if (field === 'advice') {
      if (input.includes('review')) suggestion = "in Cardiology OPD after 7 days with follow-up ECG";
      else if (input.includes('avoid')) suggestion = "strenuous physical activity and lifting heavy weights";
      else if (input.includes('salt')) suggestion = "restricted diet (less than 5g per day)";
    }

    if (suggestion) {
      setActiveSuggestion({ field, index, text: suggestion, fullText: currentText + suggestion });
    } else {
      setActiveSuggestion(null);
    }
  };

  const handleMedicineChange = (id: string, field: keyof Medicine, value: string) => {
    setSummary(prev => ({
      ...prev,
      medicines: prev.medicines.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const addMedicine = () => {
    const newMed: Medicine = { id: Date.now().toString(), name: '', frequency: '', duration: '' };
    setSummary(prev => ({ ...prev, medicines: [...prev.medicines, newMed] }));
  };

  const removeMedicine = (id: string) => {
    setSummary(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) }));
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // AI Assist (Legacy bulk generator)
  const handleSuggestDiagnosis = async () => {
    if (summary.complaints.length === 0) return alert('Please enter patient complaints first.');
    setAiLoading('diagnosis');
    try {
      const resp = await fetch('/api/recommendations/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cc: summary.complaints.join(', '), 
          findings: summary.findings.join(', '), 
          age: summary.age, 
          gender: summary.sex 
        })
      });
      const data = await resp.json();
      if (data.success && data.suggestions.probable_diagnosis) {
        updateField('diagnosis', data.suggestions.probable_diagnosis);
      }
    } catch (e) {
      console.error('AI diagnosis error', e);
    } finally {
      setAiLoading(null);
    }
  };

  const handleImproveAdvice = async () => {
    if (summary.advice.length === 0) return alert('Please enter some advice points first.');
    setAiLoading('advice');
    setTimeout(() => {
      const suggestions = [
        "High protein, low salt diet recommended",
        "Strict bed rest for next 3 days",
        "Immediate ER visit if fever (>101°F) returns"
      ];
      setSummary(prev => ({
        ...prev,
        advice: [...prev.advice, ...suggestions]
      }));
      setAiLoading(null);
      showToast('AI suggested 3 new advice points');
    }, 1500);
  };

  const handleSaveAndNext = () => {
    if (!activeSection) return;
    const currentIndex = SECTION_SEQUENCE.indexOf(activeSection);
    if (currentIndex !== -1 && currentIndex < SECTION_SEQUENCE.length - 1) {
      const nextSection = SECTION_SEQUENCE[currentIndex + 1];
      showToast(`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} saved`);
      setActiveSection(nextSection);
    } else {
      showToast('All clinical sections completed');
      setActiveSection(null);
    }
  };

  // --- REUSABLE STRUCTURED LIST COMPONENT WITH SMART ASSIST ---
  const BulletListEditor = ({ 
    field, 
    items, 
    placeholder 
  }: { 
    field: keyof SummaryData, 
    items: string[], 
    placeholder: string 
  }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const updateItem = (index: number, val: string) => {
      const newItems = [...items];
      newItems[index] = val;
      updateField(field, newItems);

      // Debounced Suggestion Trigger
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      suggestTimer.current = setTimeout(() => {
        fetchSmartSuggestion(field, index, val);
      }, 500);
    };

    const acceptSuggestion = (index: number) => {
      if (activeSuggestion && activeSuggestion.index === index) {
        const newItems = [...items];
        newItems[index] = activeSuggestion.fullText;
        updateField(field, newItems);
        setActiveSuggestion(null);
      }
    };

    const addItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index + 1, 0, "");
      updateField(field, newItems);
      setActiveSuggestion(null);
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    };

    const removeItem = (index: number) => {
      if (items.length <= 1) {
        updateField(field, [""]);
        return;
      }
      const newItems = items.filter((_, i) => i !== index);
      updateField(field, newItems);
      setActiveSuggestion(null);
      setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 0);
    };

    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Tab' && activeSuggestion && activeSuggestion.index === index) {
        e.preventDefault();
        acceptSuggestion(index);
      } else if (e.key === 'Escape') {
        setActiveSuggestion(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addItem(index);
      } else if (e.key === 'Backspace' && items[index] === "" && items.length > 1) {
        e.preventDefault();
        removeItem(index);
      }
    };

    return (
      <div className={styles.bulletListContainer}>
        {items.length === 0 ? (
          <button className={styles.btnAddPoint} onClick={() => updateField(field, [""])}>
            + Start adding {field}
          </button>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className={styles.bulletRow}>
              <div className={styles.bulletMarker} />
              <div className={styles.inputWrapper}>
                 <input
                   ref={el => { inputRefs.current[idx] = el }}
                   className={styles.bulletInput}
                   value={item}
                   onChange={(e) => updateItem(idx, e.target.value)}
                   onKeyDown={(e) => onKeyDown(e, idx)}
                   onBlur={() => setTimeout(() => setActiveSuggestion(null), 200)}
                   placeholder={idx === 0 ? placeholder : "Next point..."}
                 />
                 {activeSuggestion && activeSuggestion.field === field && activeSuggestion.index === idx && (
                   <div className={`${styles.ghostText} ${styles.active}`}>
                     <span style={{ color: 'transparent', visibility: 'hidden' }}>{item}</span>
                     {activeSuggestion.text}
                     <span className={styles.ghostHint}>TAB</span>
                   </div>
                 )}
              </div>
              <button 
                className={styles.btnRemovePoint} 
                onClick={() => removeItem(idx)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          ))
        )}
        <button className={styles.btnAddPoint} onClick={() => addItem(items.length - 1)}>
          + Add another point
        </button>
      </div>
    );
  };

  const handleFinalSubmit = async () => {
    if (!summary.patientName) return alert('Patient Name is required');
    setIsSaving(true);
    try {
      const { error } = await supabase.from('discharge_summaries').insert([{
        patient_name: summary.patientName, reg_no: summary.regNo, age_sex: `${summary.age} / ${summary.sex}`,
        doctor_name: summary.doctor, date_admission: summary.doa, date_discharge: summary.dod,
        diagnosis: summary.diagnosis, 
        complaints: JSON.stringify(summary.complaints), 
        findings: JSON.stringify(summary.findings),
        treatment: JSON.stringify(summary.treatment), 
        medicines: JSON.stringify(summary.medicines),
        advice: JSON.stringify(summary.advice), 
        clinic_id: clinic?.id
      }]);
      if (error) throw error;
      localStorage.removeItem('discharge_summary_draft');
      alert('Discharge Summary finalized successfully!');
      window.print();
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatus = (val: any) => {
    if (!val) return styles.dotRed;
    if (Array.isArray(val)) {
      if (val.length === 0) return styles.dotRed;
      if (typeof val[0] === 'string') return val.some(s => s?.trim()) ? styles.dotGreen : styles.dotRed;
      if (typeof val[0] === 'object') return val.some((m: any) => m.name?.trim()) ? styles.dotGreen : styles.dotRed;
      return styles.dotGreen;
    }
    if (typeof val === 'string') return val.trim() ? styles.dotGreen : styles.dotRed;
    return styles.dotGreen;
  };

  const renderClinicalCard = (title: string, field: keyof SummaryData, icon: React.ReactNode, placeholder: string) => {
    const items = summary[field] as string[];
    const value = items.filter(s => s.trim()).join(', ');
    return (
      <div className={styles.summaryCard} onClick={() => setActiveSection(field)} style={{ cursor: 'pointer' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{icon}{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`${styles.statusDot} ${getStatus(items)}`} />
            <button className={styles.btnEditMini}>Edit</button>
          </div>
        </div>
        <div className={styles.previewContent}>
          {value || <span className={styles.emptyPlaceholder}>{placeholder}</span>}
        </div>
      </div>
    );
  };

  const renderFocusEditor = () => {
    if (!activeSection) return null;
    const field = activeSection as keyof SummaryData;
    const items = summary[field] as string[];
    const label = activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    const isLastSection = SECTION_SEQUENCE.indexOf(activeSection) === SECTION_SEQUENCE.length - 1;

    return (
      <div className={styles.focusEditorOverlay}>
        <header className={styles.editorHeader}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button className={styles.btnBack} onClick={() => setActiveSection(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Exit
            </button>
            {autoSaveStatus !== 'idle' && (
              <div className={`${styles.saveIndicator} ${styles[autoSaveStatus]}`}>
                <div className={styles.statusIndicatorDot} />
                {autoSaveStatus === 'saving' ? 'Saving...' : 'Draft Saved'}
              </div>
            )}
          </div>
          <div className={styles.editorTitle}>Editing {label}</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            {field === 'advice' && (
               <button className={styles.aiAssistBtn} onClick={handleImproveAdvice} disabled={!!aiLoading}>
                 {aiLoading === 'advice' ? '⚡ Refining...' : '✨ AI Assist'}
               </button>
            )}
          </div>
        </header>

        <section className={styles.editorBody}>
           <div className={styles.editorContainer}>
              <div className={styles.editorCard}>
                 <BulletListEditor 
                    field={field} 
                    items={items.length === 0 ? [""] : items} 
                    placeholder={`Enter patient ${activeSection} point...`} 
                 />
                 <div className={styles.cardFooter}>
                    <button className={styles.btnSaveBack} onClick={handleSaveAndNext}>
                      {isLastSection ? 'Save & Finish Summary' : `Save & Next Section`}
                    </button>
                 </div>
              </div>
           </div>
        </section>
      </div>
    );
  };

  if (clinicLoading) return null;

  return (
    <>
      {toast && <div className={styles.toast} role="alert">{toast}</div>}
      {activeSection && renderFocusEditor()}
      <div className={styles.page} style={{ display: activeSection ? 'none' : 'block' }}>
        <TopBar title="Discharge Summary" backHref="/portal/doctor-dashboard" />
        <main className={styles.main}>
          <div className={styles.layout}>
            <section className={styles.leftColumn}>
              <div className={styles.summaryCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Patient Context
                  </div>
                  <div className={`${styles.statusDot} ${getStatus(summary.patientName)}`} />
                </div>
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" value={summary.patientName} onChange={e => updateField('patientName', e.target.value)} placeholder="Amit Sharma" />
                </div>
                <div className={styles.patientBrief}>
                  <div className={styles.briefItem}>
                    <div className="field" style={{ flex: 1 }}><label>Age</label><input type="text" value={summary.age} onChange={e => updateField('age', e.target.value)} /></div>
                    <div className="field" style={{ flex: 1, marginLeft: 10 }}><label>Sex</label>
                      <select value={summary.sex} onChange={e => updateField('sex', e.target.value)}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="field"><label>Registration / IPD ID</label><input type="text" value={summary.regNo} onChange={e => updateField('regNo', e.target.value)} /></div>
                  <div className="field"><label>Adm. Date</label><input type="datetime-local" value={summary.doa} onChange={e => updateField('doa', e.target.value)} /></div>
                  <div className="field"><label>Dis. Date</label><input type="datetime-local" value={summary.dod} onChange={e => updateField('dod', e.target.value)} /></div>
                  <div className="field">
                    <label>Admitting Doctor</label>
                    <select value={summary.doctor} onChange={e => updateField('doctor', e.target.value)}>
                      <option value="">Select Doctor...</option>
                      {doctors?.map((d: any) => <option key={d.id} value={d.name}>Dr. {d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard} style={{ background: 'var(--sanctuary-gray-low)' }}>
                <div className={styles.cardTitle} style={{ fontSize: 11, color: 'var(--sanctuary-ink-l)' }}>STATUS OVERVIEW</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className={styles.briefItem}><label>Draft Status</label> <span>{lastSaved ? 'Saved Locally' : 'Not Saved'}</span></div>
                  <div className={styles.briefItem}><label>Last Sync</label> <span>{lastSaved ? lastSaved.toLocaleTimeString() : '--'}</span></div>
                </div>
              </div>
            </section>

            <section className={styles.centerColumn}>
              <div className={`${styles.summaryCard} ${styles.diagnosisHighlight}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 21 1.9-1.9A11.5 11.5 0 0 1 12 21a11.5 11.5 0 0 1 0-23 11.5 11.5 0 0 1 7.1 18.9l1.9 1.9"/></svg>
                    Diagnosis
                  </div>
                  <button className={styles.aiAssistBtn} onClick={handleSuggestDiagnosis} disabled={aiLoading === 'diagnosis'}>
                    {aiLoading === 'diagnosis' ? '⚡ Analyzing...' : '✨ Suggest Diagnosis'}
                  </button>
                </div>
                <input 
                  className={styles.bulletInput}
                  value={summary.diagnosis} 
                  onChange={e => updateField('diagnosis', e.target.value)}
                  placeholder="Final Clinical Diagnosis..."
                />
              </div>
              <div className={styles.clinicalSplit}>
                {renderClinicalCard('Complaints', 'complaints', null, 'Chief complaints & history...')}
                {renderClinicalCard('Findings', 'findings', null, 'Physical findings & investigations...')}
              </div>
              {renderClinicalCard('Treatment Given', 'treatment', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 'Procedures...')}
              <div className={styles.summaryCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.5 3.5a2.121 2.121 0 0 1 3 3L7 13l-4 1 1-4 6.5-6.5z"/></svg>Medications</div>
                  <div className={`${styles.statusDot} ${getStatus(summary.medicines)}`} />
                </div>
                <div className={styles.medTableWrapper}>
                  <table className={styles.medTable}>
                    <thead><tr><th style={{ width: 40 }}>#</th><th>Medicine</th><th>Freq</th><th>Dur</th><th style={{ width: 40 }}></th></tr></thead>
                    <tbody>
                      {summary.medicines.map((m, idx) => (
                        <tr key={m.id}>
                          <td>{idx + 1}</td>
                          <td><input className={styles.medInput} value={m.name} onChange={e => handleMedicineChange(m.id, 'name', e.target.value)} /></td>
                          <td><input className={styles.medInput} value={m.frequency} onChange={e => handleMedicineChange(m.id, 'frequency', e.target.value)} /></td>
                          <td><input className={styles.medInput} value={m.duration} onChange={e => handleMedicineChange(m.id, 'duration', e.target.value)} /></td>
                          <td><button className={styles.btnRemoveMed} onClick={() => removeMedicine(m.id)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className={styles.btnAddMed} onClick={addMedicine}>+ Add Medicine Item</button>
              </div>
              {renderClinicalCard('Advice & Follow-up', 'advice', null, 'Rest, diet, lifestyle changes...')}
            </section>

            <section className={styles.rightColumn}>
               <div className={`${styles.previewDoc} ${isPreviewExpanded ? styles.expandedPreview : styles.collapsedPreview}`}>
                  <table className={styles.printableTable}>
                    <thead>
                      <tr>
                        <td>
                          <div className={styles.previewHeader}>
                             <h2>{clinic?.name}</h2>
                             <p>{clinic?.address}</p>
                             <div style={{ marginTop: 12, fontSize: 14, fontWeight: 900, textDecoration: 'underline' }}>DISCHARGE SUMMARY</div>
                          </div>
                          <div className={styles.previewInfoGrid}>
                             <div><b>Patient:</b> {summary.patientName}</div>
                             <div><b>Reg No:</b> {summary.regNo}</div>
                             <div><b>Age/Sex:</b> {summary.age}/{summary.sex[0]}</div>
                             <div><b>Consultant:</b> {summary.doctor}</div>
                             <div><b>DOA:</b> {summary.doa}</div>
                             <div><b>DOD:</b> {summary.dod}</div>
                          </div>
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className={styles.previewSection}><h4>Final Diagnosis</h4><p>{summary.diagnosis}</p></div>
                          <div className={styles.previewSection}><h4>Complaints</h4><ul style={{ listStyle: 'none', padding: 0 }}>{summary.complaints.map((c, i) => <li key={i}>• {c}</li>)}</ul></div>
                          <div className={styles.previewSection}><h4>Findings</h4><ul style={{ listStyle: 'none', padding: 0 }}>{summary.findings.map((f, i) => <li key={i}>• {f}</li>)}</ul></div>
                          {summary.medicines.length > 0 && <div className={styles.previewSection}><h4>Medications</h4><table className={styles.medTable} style={{ fontSize: 11 }}><tbody>{summary.medicines.map(m => <tr key={m.id}><td>{m.name}</td><td>{m.frequency}</td><td>{m.duration}</td></tr>)}</tbody></table></div>}
                          <div className={styles.previewSection}><h4>Advice</h4><ul style={{ listStyle: 'none', padding: 0 }}>{summary.advice.map((a, i) => <li key={i}>• {a}</li>)}</ul></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {!isPreviewExpanded && <div className={styles.previewFade} />}
                  <button className={styles.btnTogglePreview} onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}>{isPreviewExpanded ? "Show Less" : "Read More"}</button>
               </div>
               <div className={styles.actionStack}>
                  <button className={`${styles.btnAction} btn-primary`} style={{ padding: '18px', background: 'var(--sanctuary-primary)', color: '#fff' }} onClick={() => router.push('/portal/discharge-summary/view')}>
                    👁 View & Print Discharge Summary
                  </button>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: 12, opacity: 0.7 }} onClick={() => localStorage.removeItem('discharge_summary_draft')}>Clear Clinical Draft</button>
               </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
