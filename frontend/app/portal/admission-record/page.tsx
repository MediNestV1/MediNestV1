'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL, authenticatedFetch } from '@/lib/api';
import styles from './page.module.css';

// Types
interface SummaryData {
  patientName: string; phone: string; age: string; sex: string; doctor: string; ward: string; bed: string; department: string; date_admission: string; 
  severity: string; admission_type: string;
  has_diabetes: boolean; has_hypertension: boolean; has_thyroid: boolean; past_surgeries: string; allergies: string;
  doctor_observations: string;
  attachments: { name: string; url: string; type: string; size: number }[];
  vitals: string; // Keep for legacy / fallback
  vitals_bp_sys: string;
  vitals_bp_dia: string;
  vitals_pulse: string;
  vitals_temp: string;
  vitals_spo2: string;
  complaints: string[]; 
  hpi: string;
  findings: string[]; 
  diagnosis: string;
  investigations: string[]; 
  treatment_plan: string[]; 
}

interface Suggestion {
  field: string;
  index: number;
  text: string;
  fullText: string;
}

const SECTION_SEQUENCE = ['complaints', 'findings', 'investigations', 'treatment_plan'];

interface BulletListEditorProps {
  field: keyof SummaryData;
  items: string[];
  placeholder: string;
  updateField: (field: keyof SummaryData, value: any) => void;
  autoSaveStatus: string;
  setAutoSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;
  suggestTimer: React.MutableRefObject<NodeJS.Timeout | null>;
  activeSuggestion: Suggestion | null;
  setActiveSuggestion: (suggestion: Suggestion | null) => void;
  fetchSmartSuggestion: (field: string, index: number, currentText: string) => void;
}

const ChipInputEditor = ({ items, updateField, field, placeholder }: any) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!items.includes(inputValue.trim())) {
        updateField(field, [...items, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && items.length > 0) {
      updateField(field, items.slice(0, -1));
    }
  };

  const removeChip = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    updateField(field, next);
  };

  return (
    <div className={styles.bulletListContainer} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
      <div className={styles.chipGroup}>
        {items.map((item: string, idx: number) => (
          <div key={idx} className={styles.chip}>
            {item}
            <button className={styles.chipRemove} onClick={() => removeChip(idx)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ))}
        <input 
          className={styles.chipInput}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={items.length === 0 ? placeholder : "Add more..."}
        />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Press ENTER to add tag • BACKSPACE to remove
      </div>
    </div>
  );
};

const BulletListEditor = ({ 
  field, items, placeholder, updateField, autoSaveStatus, setAutoSaveStatus,
  suggestTimer, activeSuggestion, setActiveSuggestion, fetchSmartSuggestion
}: BulletListEditorProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateItem = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    updateField(field, newItems);

    if (autoSaveStatus !== 'idle') setAutoSaveStatus('idle');

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSmartSuggestion(field, index, val);
    }, 300);
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
            <button className={styles.btnRemovePoint} onClick={() => removeItem(idx)}>
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

export default function AdmissionRecordRedesign() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docNameParam = searchParams.get('docName');
  const { clinic, doctors, loading: clinicLoading } = useClinic();
  const supabase = createClient();

  const [summary, setSummary] = useState<SummaryData>({
    patientName: '', phone: '', age: '', sex: 'Male', doctor: '', ward: '', bed: '', department: '', date_admission: new Date().toISOString().slice(0, 16), 
    severity: 'Mild', admission_type: 'OPD',
    has_diabetes: false, has_hypertension: false, has_thyroid: false, past_surgeries: '', allergies: '',
    doctor_observations: '',
    attachments: [],
    vitals: '',
    vitals_bp_sys: '', vitals_bp_dia: '', vitals_pulse: '', vitals_temp: '', vitals_spo2: '',
    diagnosis: '', hpi: '', complaints: [], findings: [], investigations: [], treatment_plan: []
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    hpi: false,
    investigations: false,
    treatment_plan: false
  });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const suggestTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const draftStr = localStorage.getItem('admission_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        // Merge with initial state to avoid 'undefined' fields for older drafts
        setSummary(prev => ({ 
          ...prev, 
          ...draft,
          // Explicitly handle fields that might be missing in older drafts
          ward: draft.ward || '',
          bed: draft.bed || '',
          department: draft.department || '',
          diagnosis: draft.diagnosis || '',
          hpi: draft.hpi || '',
          has_diabetes: !!draft.has_diabetes,
          has_hypertension: !!draft.has_hypertension,
          has_thyroid: !!draft.has_thyroid,
          past_surgeries: draft.past_surgeries || '',
          allergies: draft.allergies || '',
          severity: draft.severity || 'Mild',
          admission_type: draft.admission_type || 'OPD',
          doctor_observations: draft.doctor_observations || '',
          attachments: draft.attachments || [],
          vitals: draft.vitals || '',
          vitals_bp_sys: draft.vitals_bp_sys || '',
          vitals_bp_dia: draft.vitals_bp_dia || '',
          vitals_pulse: draft.vitals_pulse || '',
          vitals_temp: draft.vitals_temp || '',
          vitals_spo2: draft.vitals_spo2 || ''
        }));
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    } else {
      // Defaulting logic for new records
      if (docNameParam) {
        setSummary(prev => ({ ...prev, doctor: docNameParam }));
      } else if (doctors && doctors.length > 0) {
        setSummary(prev => ({ ...prev, doctor: doctors[0].name }));
      }
    }
  }, [docNameParam, doctors]);

  const saveDraft = useCallback((data: SummaryData) => {
    localStorage.setItem('admission_draft', JSON.stringify(data));
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

  const fetchSmartSuggestion = async (field: string, index: number, currentText: string) => {
    if (!currentText || currentText.trim().split(' ').length < 2) {
      setActiveSuggestion(null);
      return;
    }
    const input = currentText.toLowerCase();
    let baseSuggestion = "";
    
    if (field === 'complaints') {
      if (input.includes('fever')) baseSuggestion = " associated with chills and rigor";
      else if (input.includes('chest pain')) baseSuggestion = " radiating to left arm with breathlessness";
      else if (input.includes('abdominal pain')) baseSuggestion = " associated with nausea and vomiting";
      else if (input.includes('headache')) baseSuggestion = " thumping type associated with photophobia";
      else if (input.includes('breathless')) baseSuggestion = " on exertion associated with orthopnea";
    } else if (field === 'investigations') {
      if (input.includes('cbc')) baseSuggestion = " and LFT, KFT, Serum Electrolytes";
      else if (input.includes('xray')) baseSuggestion = " chest PA view";
      else if (input.includes('ct scan')) baseSuggestion = " abdomen and pelvis with contrast";
      else if (input.includes('usg')) baseSuggestion = " whole abdomen for internal pathology";
      else if (input.includes('ecg')) baseSuggestion = " 12 lead for cardiac evaluation";
    } else if (field === 'treatment_plan') {
      if (input.includes('iv')) baseSuggestion = " Fluids (NS/RL) 100ml/hr";
      else if (input.includes('inj')) baseSuggestion = " Pantop 40mg IV OD";
      else if (input.includes('antibiotic')) baseSuggestion = " coverage as per hospital protocol";
      else if (input.includes('tab')) baseSuggestion = " PCM 650mg SOS for fever";
    }

    if (baseSuggestion) {
      const sigWord = baseSuggestion.trim().split(' ')[0];
      if (input.includes(sigWord)) { setActiveSuggestion(null); return; }
      const suggestionText = currentText.endsWith(' ') ? baseSuggestion.trim() : baseSuggestion;
      const full = currentText.endsWith(' ') ? currentText + baseSuggestion.trim() : currentText + baseSuggestion;
      setActiveSuggestion({ field, index, text: suggestionText, fullText: full });
    } else {
      setActiveSuggestion(null);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max 10MB.`);
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${clinic?.id}/${fileName}`;

      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));

      const { data, error } = await supabase.storage
        .from('medical-records')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('Upload error:', error);
        showToast(`Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[file.name];
          return next;
        });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(filePath);

      setSummary(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        }]
      }));

      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[file.name];
        return next;
      });
      showToast(`${file.name} attached`);
    }
  };

  const handleDeleteAttachment = async (index: number) => {
    if (!confirm('Remove this attachment?')) return;
    const item = summary.attachments[index];
    
    // Attempt to extract path from URL
    try {
      const path = item.url.split('public/medical-records/')[1];
      if (path) {
        await supabase.storage.from('medical-records').remove([path]);
      }
    } catch (e) { console.error('Delete storage error', e); }

    const newAttachments = [...summary.attachments];
    newAttachments.splice(index, 1);
    updateField('attachments', newAttachments);
    showToast('Attachment removed');
  };

  const handleSaveAndNext = () => {
    if (!activeSection) return;
    const currentIndex = SECTION_SEQUENCE.indexOf(activeSection);
    if (currentIndex !== -1 && currentIndex < SECTION_SEQUENCE.length - 1) {
      const nextSection = SECTION_SEQUENCE[currentIndex + 1];
      showToast(`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} saved`);
      setActiveSection(null);
      setTimeout(() => setActiveSection(nextSection), 10);
    } else {
      showToast('All clinical sections completed');
      setActiveSection(null);
    }
  };

  const handlePreviousSection = () => {
    if (!activeSection) return;
    const currentIndex = SECTION_SEQUENCE.indexOf(activeSection);
    if (currentIndex > 0) {
      const prevSection = SECTION_SEQUENCE[currentIndex - 1];
      showToast(`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} saved`);
      setActiveSection(null);
      setTimeout(() => setActiveSection(prevSection), 10);
    }
  };

  const handleFinalSubmit = async () => {
    if (!summary.patientName) return alert('Patient Name is required');
    setIsSaving(true);
    try {
      let patientId: string | null = null;
      if (clinic?.id) {
        let existingPatient = null;
        if (summary.phone) {
          const { data } = await supabase.from('patients').select('*').eq('contact', summary.phone).eq('clinic_id', clinic.id).maybeSingle();
          existingPatient = data;
        }
        if (!existingPatient) {
          const { data } = await supabase.from('patients').select('*').eq('name', summary.patientName).eq('clinic_id', clinic.id).limit(1).maybeSingle();
          existingPatient = data;
        }

        if (existingPatient?.id) {
          patientId = existingPatient.id;
          const newAge = parseInt(summary.age);
          if ((newAge && existingPatient.age !== newAge) || 
              (summary.sex && existingPatient.gender !== summary.sex) || 
              (summary.phone && existingPatient.contact !== summary.phone) ||
              (existingPatient.has_diabetes !== summary.has_diabetes) ||
              (existingPatient.has_hypertension !== summary.has_hypertension) ||
              (existingPatient.has_thyroid !== summary.has_thyroid) ||
              (summary.allergies && existingPatient.allergies !== summary.allergies) ||
              (summary.past_surgeries && existingPatient.past_surgeries !== summary.past_surgeries)
          ) {
            await supabase.from('patients').update({
              age: newAge || existingPatient.age, 
              gender: summary.sex || existingPatient.gender, 
              contact: summary.phone || existingPatient.contact,
              has_diabetes: summary.has_diabetes,
              has_hypertension: summary.has_hypertension,
              has_thyroid: summary.has_thyroid,
              allergies: summary.allergies || existingPatient.allergies,
              past_surgeries: summary.past_surgeries || existingPatient.past_surgeries
            }).eq('id', patientId);
          }
        } else {
          const { data: newPatient } = await supabase.from('patients').insert({
            name: summary.patientName, 
            contact: summary.phone || '0000000000', 
            age: parseInt(summary.age) || null, 
            gender: summary.sex, 
            clinic_id: clinic.id,
            has_diabetes: summary.has_diabetes,
            has_hypertension: summary.has_hypertension,
            has_thyroid: summary.has_thyroid,
            allergies: summary.allergies,
            past_surgeries: summary.past_surgeries
          }).select('id').single();
          if (newPatient?.id) patientId = newPatient.id;
        }
      }

      const { error } = await supabase.from('admission_records').insert([{
        patient_name: summary.patientName, age_sex: `${summary.age} / ${summary.sex}`, contact: summary.phone,
        doctor_name: summary.doctor, ward: summary.ward, bed: summary.bed, department: summary.department, date_admission: summary.date_admission,
        severity: summary.severity, admission_type: summary.admission_type,
        doctor_observations: summary.doctor_observations,
        attachments: summary.attachments,
        vitals: summary.vitals,
        vitals_bp_sys: summary.vitals_bp_sys ? parseInt(summary.vitals_bp_sys) : null,
        vitals_bp_dia: summary.vitals_bp_dia ? parseInt(summary.vitals_bp_dia) : null,
        vitals_pulse: summary.vitals_pulse ? parseInt(summary.vitals_pulse) : null,
        vitals_temp: summary.vitals_temp ? parseFloat(summary.vitals_temp) : null,
        vitals_spo2: summary.vitals_spo2 ? parseInt(summary.vitals_spo2) : null,
        has_diabetes: summary.has_diabetes, has_hypertension: summary.has_hypertension, has_thyroid: summary.has_thyroid,
        past_surgeries: summary.past_surgeries, allergies: summary.allergies,
        diagnosis: summary.diagnosis, hpi: summary.hpi,
        complaints: summary.complaints, findings: summary.findings,
        investigations: summary.investigations, treatment_plan: summary.treatment_plan, 
        clinic_id: clinic?.id, patient_id: patientId
      }]);
      if (error) throw error;
      localStorage.removeItem('admission_draft');
      alert('Admission Record finalized and linked to patient!');
      if (patientId) {
        router.push(`/portal/doctor-dashboard/patients/${patientId}`);
      } else {
        router.push('/portal/doctor-dashboard');
      }
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all records? This will delete the current draft.')) {
      setSummary({
        patientName: '', phone: '', age: '', sex: 'Male', doctor: '', ward: '', bed: '', department: '', date_admission: new Date().toISOString().slice(0, 16), 
        severity: 'Mild', admission_type: 'OPD',
        has_diabetes: false, has_hypertension: false, has_thyroid: false, past_surgeries: '', allergies: '',
        doctor_observations: '',
        attachments: [],
        vitals: '',
        diagnosis: '', hpi: '', complaints: [], findings: [], investigations: [], treatment_plan: []
      });
      localStorage.removeItem('admission_draft');
      setLastSaved(null);
      showToast('Records cleared');
    }
  };

  const getStatus = (val: any) => {
    if (!val) return styles.dotRed;
    if (Array.isArray(val)) return val.some(s => s?.trim()) ? styles.dotGreen : styles.dotRed;
    if (typeof val === 'string') return val.trim() ? styles.dotGreen : styles.dotRed;
    return styles.dotGreen;
  };

  const getVitalsAlerts = (data: SummaryData) => {
    const alerts = [];
    if (data.vitals_temp && parseFloat(data.vitals_temp) > 101) {
      alerts.push({ type: 'warning', label: `⚠️ High Fever detected (${data.vitals_temp}°F)` });
    }
    if (data.vitals_spo2 && parseInt(data.vitals_spo2) < 94) {
      alerts.push({ type: 'critical', label: `🚨 Critical Low SpO2 (${data.vitals_spo2}%)` });
    }
    return alerts;
  };

  const renderClinicalCard = (title: string, field: keyof SummaryData, icon: React.ReactNode, placeholder: string) => {
    const items = summary[field] as string[];
    const value = items.filter(s => s.trim()).join(', ');
    const isCollapsible = ['investigations', 'treatment_plan'].includes(field as string);
    const isCollapsed = collapsed[field as string];

    return (
      <div className={styles.summaryCard} style={{ cursor: 'default' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{icon}{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`${styles.statusDot} ${getStatus(items)}`} />
            {isCollapsible && (
              <button 
                className={styles.btnToggleSection} 
                onClick={() => setCollapsed(prev => ({ ...prev, [field as string]: !isCollapsed }))}
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </button>
            )}
            <button className={styles.btnEditMini} onClick={() => setActiveSection(field)}>Edit</button>
          </div>
        </div>
        {!isCollapsed && (
          <div className={styles.previewContent}>
            {field === 'complaints' && items.length > 0 ? (
               <div className={styles.chipGroup}>
                  {items.map((it, i) => (
                    <div key={i} className={styles.chip}>{it}</div>
                  ))}
               </div>
            ) : (
               value || <span className={styles.emptyPlaceholder}>{placeholder}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFocusEditor = () => {
    if (!activeSection) return null;
    const field = activeSection as keyof SummaryData;
    const items = summary[field] as string[];
    const label = activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('_', ' ');
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
             {field === 'treatment_plan' && (
                <button className={styles.aiAssistBtn} onClick={() => {
                  setSummary(p => ({...p, treatment_plan: [...p.treatment_plan, "Start IV Antibiotics", "Monitor vitals Q4H"]}));
                  showToast('AI suggested treatment protocol');
                }}>✨ AI Assist</button>
             )}
           </div>
        </header>
        <section className={styles.editorBody}>
           <div className={styles.editorContainer}>
              <div className={styles.editorCard}>
                 {activeSection === 'complaints' || activeSection === 'findings' ? (
                    <ChipInputEditor field={field} items={items} updateField={updateField} placeholder={`Enter ${label.toLowerCase()}...`} />
                 ) : (
                    <BulletListEditor field={field} items={items.length === 0 ? [""] : items} placeholder={`Enter patient ${label} point...`} updateField={updateField} autoSaveStatus={autoSaveStatus} setAutoSaveStatus={setAutoSaveStatus} suggestTimer={suggestTimer} activeSuggestion={activeSuggestion} setActiveSuggestion={setActiveSuggestion} fetchSmartSuggestion={fetchSmartSuggestion} />
                 )}
                 <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: SECTION_SEQUENCE.indexOf(activeSection) > 0 ? 'space-between' : 'flex-end', width: '100%' }}>
                    {SECTION_SEQUENCE.indexOf(activeSection) > 0 && (<button className="btn-secondary" style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, borderRadius: 12 }} onClick={handlePreviousSection}>← Previous Section</button>)}
                    <button className={styles.btnSaveBack} onClick={handleSaveAndNext}>{isLastSection ? 'Save & Finish' : 'Save & Next Section'}</button>
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
        <TopBar title="Admission Record" backHref="/portal/doctor-dashboard" />
        <main className={styles.main}>
          <div className={styles.layout}>
            <section className={styles.leftColumn}>
              {/* --- 30% Sidebar: Context & Admin --- */}
              <div className={styles.summaryCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Patient Context
                  </div>
                  <div className={`${styles.statusDot} ${getStatus(summary.patientName)}`} />
                </div>
                <div className="field"><label>Full Name</label><input type="text" value={summary.patientName || ''} onChange={e => updateField('patientName', e.target.value)} /></div>
                <div className={styles.patientBrief}>
                  <div className={styles.briefItem}>
                    <div className="field" style={{ flex: 1 }}><label>Age</label><input type="text" value={summary.age || ''} onChange={e => updateField('age', e.target.value)} /></div>
                    <div className="field" style={{ flex: 1, marginLeft: 10 }}><label>Sex</label><select value={summary.sex || 'Male'} onChange={e => updateField('sex', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                  <div className="field"><label>Phone Number</label><input type="tel" value={summary.phone || ''} onChange={e => updateField('phone', e.target.value)} /></div>
                  <div className="field"><label>Department</label><input type="text" value={summary.department || ''} onChange={e => updateField('department', e.target.value)} placeholder="e.g. Cardiology, Orthopedics" /></div>
                  <div className={styles.briefItem}>
                    <div className="field" style={{ flex: 1 }}><label>Ward</label><input type="text" value={summary.ward || ''} onChange={e => updateField('ward', e.target.value)} placeholder="Ward A" /></div>
                    <div className="field" style={{ flex: 1, marginLeft: 10 }}><label>Bed No.</label><input type="text" value={summary.bed || ''} onChange={e => updateField('bed', e.target.value)} placeholder="102" /></div>
                  </div>
                  <div className={styles.briefItem}>
                    <div className="field" style={{ flex: 1 }}><label>Admission Source</label><select value={summary.admission_type} onChange={e => updateField('admission_type', e.target.value)}><option>OPD</option><option>Emergency</option><option>Referral</option></select></div>
                    <div className="field" style={{ flex: 1, marginLeft: 10 }}><label>Triage / Severity</label>
                       <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          {['Mild', 'Moderate', 'Severe'].map(lvl => (
                            <button 
                              key={lvl} 
                              onClick={() => updateField('severity', lvl)}
                              className={`${styles.triageBtn} ${summary.severity === lvl ? styles.active : ''} ${styles[lvl.toLowerCase()]}`}
                            >
                              {lvl}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                  <div className="field"><label>Adm. Date & Time</label><input type="datetime-local" value={summary.date_admission || ''} onChange={e => updateField('date_admission', e.target.value)} /></div>
                  <div className="field"><label>Attending Doctor</label><select value={summary.doctor || ''} onChange={e => updateField('doctor', e.target.value)}><option value="">Select...</option>{doctors?.map((d: any) => <option key={d.id} value={d.name}>Dr. {d.name}</option>)}</select></div>
                </div>
              </div>

              <div className={styles.summaryCard} style={{ borderTop: '4px solid #ef4444' }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Alerts & History
                  </div>
                  {summary.allergies?.trim() && (
                    <div className={styles.allergyBadge}>🔴 Allergies</div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                   <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={summary.has_diabetes} onChange={e => updateField('has_diabetes', e.target.checked)} />
                      Dia.
                   </label>
                   <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={summary.has_hypertension} onChange={e => updateField('has_hypertension', e.target.checked)} />
                      HTN
                   </label>
                   <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={summary.has_thyroid} onChange={e => updateField('has_thyroid', e.target.checked)} />
                      Thy.
                   </label>
                </div>
                <div className="field">
                  <label style={{ color: '#ef4444', fontWeight: 900 }}>⚠️ Critical Allergies</label>
                  <textarea 
                    value={summary.allergies || ''} 
                    onChange={e => updateField('allergies', e.target.value)} 
                    placeholder="List all drug or environmental allergies..." 
                    style={{width: '100%', minHeight: 60, border: '1px solid #fecaca', background: '#fef2f2', padding: 12, borderRadius: 8, outline: 'none', fontSize: 13}}
                  ></textarea>
                </div>
                <div className="field">
                  <label>Past Surgeries</label>
                  <input type="text" value={summary.past_surgeries || ''} onChange={e => updateField('past_surgeries', e.target.value)} placeholder="e.g. Appendectomy (2018)" />
                </div>
              </div>

              <div className={styles.summaryCard} style={{ marginTop: 12 }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      Attachments
                    </div>
                  </div>
                  <div className={styles.uploadZone}>
                    <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className={styles.fileInputHidden} id="file-upload" />
                    <label htmlFor="file-upload" className={styles.uploadLabel}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                       <span>Upload Reports</span>
                    </label>
                  </div>
                  <div className={styles.attachmentList}>
                    {summary.attachments.map((file, i) => (
                      <div key={i} className={styles.attachmentItem}>
                        <div style={{ flex: 1, minWidth: 0 }}><div className={styles.fileName}>{file.name}</div><div className={styles.fileMeta}>{(file.size / 1024 / 1024).toFixed(2)} MB</div></div>
                        <div style={{ display: 'flex', gap: 10 }}>
                           <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.btnFileAction}>View</a>
                           <button onClick={() => handleDeleteAttachment(i)} className={styles.btnFileDelete}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </section>

            <section className={styles.rightColumn}>
              {/* --- 70% Main Area: Clinical Data --- */}
              <div className={`${styles.summaryCard} ${styles.diagnosisHighlight}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>🧠 Provisional Diagnosis</div>
                </div>
                <input className={styles.bulletInput} value={summary.diagnosis || ''} onChange={e => updateField('diagnosis', e.target.value)} placeholder="Provisional Admission Diagnosis..." />
              </div>

              <div className={styles.summaryCard}>
                 <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>📝 History of Present Illness (HPI)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div className={`${styles.statusDot} ${getStatus(summary.hpi)}`} />
                       <button 
                          className={styles.btnToggleSection} 
                          onClick={() => setCollapsed(prev => ({ ...prev, hpi: !collapsed.hpi }))}
                        >
                          {collapsed.hpi ? 'Expand' : 'Collapse'}
                       </button>
                    </div>
                 </div>
                 {!collapsed.hpi && (
                   <textarea value={summary.hpi || ''} onChange={e => updateField('hpi', e.target.value)} placeholder="Elaborate on the patient's symptoms..." style={{width: '100%', minHeight: 80, border: 'none', resize: 'vertical', background: '#f8fafc', padding: 12, borderRadius: 8, outline: 'none', fontSize: 14}}></textarea>
                 )}
              </div>

              <div className={styles.summaryCard} style={{ borderLeft: '4px solid #ef4444' }}>
                 <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>❤️ Baseline Vitals</div>
                    <div className={`${styles.statusDot} ${getStatus(summary.vitals_pulse || summary.vitals_bp_sys)}`} />
                 </div>
                 
                 <div className={styles.vitalsGrid}>
                    <div className={styles.vitalInputGroup}>
                       <label>BP (Systolic/Diastolic)</label>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" placeholder="Sys" value={summary.vitals_bp_sys} onChange={e => updateField('vitals_bp_sys', e.target.value)} />
                          <span>/</span>
                          <input type="number" placeholder="Dia" value={summary.vitals_bp_dia} onChange={e => updateField('vitals_bp_dia', e.target.value)} />
                       </div>
                    </div>
                    <div className={styles.vitalInputGroup}>
                       <label>Pulse (BPM)</label>
                       <input type="number" placeholder="72" value={summary.vitals_pulse} onChange={e => updateField('vitals_pulse', e.target.value)} />
                    </div>
                    <div className={styles.vitalInputGroup}>
                       <label>Temp (°F)</label>
                       <input type="number" step="0.1" placeholder="98.6" value={summary.vitals_temp} onChange={e => updateField('vitals_temp', e.target.value)} />
                    </div>
                    <div className={styles.vitalInputGroup}>
                       <label>SpO₂ (%)</label>
                       <input type="number" placeholder="98" value={summary.vitals_spo2} onChange={e => updateField('vitals_spo2', e.target.value)} />
                    </div>
                 </div>

                 {getVitalsAlerts(summary).map((alert, idx) => (
                    <div key={idx} className={`${styles.clinicalAlert} ${alert.type === 'critical' ? styles.criticalAlert : ''}`}>
                       {alert.label}
                    </div>
                 ))}
              </div>

              <div className={styles.summaryCard} style={{ borderLeft: '4px solid #8b5cf6' }}>
                 <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      Doctor Observations
                    </div>
                    <div className={`${styles.statusDot} ${getStatus(summary.doctor_observations)}`} />
                 </div>
                 <textarea value={summary.doctor_observations || ''} onChange={e => updateField('doctor_observations', e.target.value)} placeholder="Additional monitoring requirements or behavioral notes..." style={{width: '100%', minHeight: 100, border: 'none', resize: 'vertical', background: '#f5f3ff', padding: 12, borderRadius: 8, outline: 'none', fontSize: 14, color: '#4c1d95'}}></textarea>
              </div>

              <div className={styles.clinicalSplit}>
                {renderClinicalCard('Complaints', 'complaints', null, 'Chief complaints...')}
                {renderClinicalCard('Findings', 'findings', <span>🩺 </span>, 'Clinical findings...')}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {renderClinicalCard('Investigations Advised', 'investigations', null, 'Lab / Radiology orders...')}
                {renderClinicalCard('Initial Treatment Plan', 'treatment_plan', <span>💊 </span>, 'First line management...')}
              </div>
            </section>
          </div>
        </main>
        
        {/* --- Sticky Bottom Action Bar --- */}
        <div className={styles.stickyBar}>
           <div className={styles.stickyBarInner}>
              <button className={styles.btnClearSticky} onClick={handleClear}>
                🗑️ Clear Records
              </button>
              <button className={styles.btnSaveSticky} onClick={handleFinalSubmit}>
                ✅ Save Admission Record
              </button>
           </div>
        </div>
      </div>
    </>
  );
}
