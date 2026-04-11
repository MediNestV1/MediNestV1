'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './page.module.css';

interface Medicine {
  id: string;
  name: string;
  type: string;
  dose: string;
  freq: string;
  duration: string;
  instructions: string;
  note: string;
}

export default function PrescriptionPage() {
  const searchParams = useSearchParams();
  const { clinic, doctors } = useClinic();
  const [activeTab, setActiveTab] = useState<'info' | 'rx'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const rxPaperRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ptName, setPtName] = useState('');
  const [ptPhone, setPtPhone] = useState('');
  const [ptAge, setPtAge] = useState('');
  const [ptSex, setPtSex] = useState('Male');
  const [ptWeight, setPtWeight] = useState('');
  const [doctor, setDoctor] = useState(searchParams.get('doctorName') || '');
  const [followUp, setFollowUp] = useState(''); // Stores Date string

  // 🔍 Patient Search & Snapshot
  const [ptSuggestions, setPtSuggestions] = useState<any[]>([]);
  const [isLoadingPts, setIsLoadingPts] = useState(false);
  const [ptSnapshot, setPtSnapshot] = useState<any>(null);

  const [cc, setCc] = useState('');
  const [findings, setFindings] = useState('');

  const [meds, setMeds] = useState<Medicine[]>([]);
  const [advice, setAdvice] = useState('');

  // Med Form
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState('Tab');
  const [mDose, setMDose] = useState('');
  const [mFreq, setMFreq] = useState('');
  const [mDur, setMDur] = useState('');
  const [showCustomDur, setShowCustomDur] = useState(false);
  const [mInst, setMInst] = useState('');
  const [mNote, setMNote] = useState('');

  // 🏥 Medicine Database Suggestion Logic
  const [dbSuggestions, setDbSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const skipSearchRef = useRef(false);
  const skipPtSearchRef = useRef(false);
  const supabase = createClient();

  // 🚀 Real-time Patient Lookup
  useEffect(() => {
    if (!ptPhone || ptPhone.length < 3) {
      setPtSuggestions([]);
      return;
    }

    if (skipPtSearchRef.current) {
        skipPtSearchRef.current = false;
        return;
    }

    const fetchPatients = async () => {
      setIsLoadingPts(true);
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .ilike('contact', `%${ptPhone}%`)
          .limit(5);
        
        if (!error && data) {
          setPtSuggestions(data);
        }
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setIsLoadingPts(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [ptPhone]);

  // 🏥 Set Default Doctor if missing
  useEffect(() => {
    if (!doctor && doctors.length > 0) {
      setDoctor(doctors[0].name);
    }
  }, [doctors, doctor]);

  const handleSelectPatient = async (p: any) => {
    skipPtSearchRef.current = true;
    setPtName(p.name);
    setPtPhone(p.contact);
    setPtAge(p.age || '');
    setPtSex(p.gender || 'Male');
    setPtSuggestions([]);

    // Fetch AI Snapshot for selected patient
    try {
        const res = await fetch(`${API_BASE_URL}/api/patient-history/${p.id}`);
        const data = await res.json();
        if (data && data.summary) {
            setPtSnapshot(data.summary);
        }
    } catch (err) {
        console.error('Error fetching patient snapshot:', err);
    }
  };

  useEffect(() => {
    if (!mName || mName.length < 2) {
      setDbSuggestions([]);
      return;
    }

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        // Call the search_medicines RPC function
        const { data, error } = await supabase.rpc('search_medicines', { search_term: mName });
        
        if (!error && data) {
          setDbSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [mName]);

  const handleSelectMedicine = (med: any) => {
    skipSearchRef.current = true;
    setMName(med.name);
    if (med.category) setMType(med.category);
    if (med.strength) setMDose(med.strength);
    setDbSuggestions([]); // Hide suggestions after selection
  };

  const addMed = () => {
    if (!mName) return;
    setMeds([...meds, {
      id: Date.now().toString(),
      name: mName,
      type: mType,
      dose: mDose,
      freq: mFreq,
      duration: mDur,
      instructions: mInst,
      note: mNote
    }]);
    setMName('');
    setMDose('');
    setMNote('');
    setMFreq('');
    setMDur('');
    setShowCustomDur(false);
    setMInst('');
    setDbSuggestions([]);
  };


  const commonCC = ['Fever', 'Cough', 'Cold', 'Loose Motion', 'Vomiting', 'Body Ache', 'Weakness'];
  const commonAdvice = ['Drink plenty of fluids', 'Rest for 2-3 days', 'Light diet', 'Monitor temperature', 'Follow-up if fever persists'];

  // Current Doctor Data
  const selectedDoctorObj = doctors.find(d => d.name === doctor);

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
  };


  const handleSave = async () => {
    if (!ptName) { alert('Please enter patient name.'); return; }
    if (!selectedDoctorObj) { alert('Please select a consulting doctor.'); return; }

    setIsSaving(true);
    const supabase = createClient();

    // STRICT SANITIZATION: Clean phone number to exactly 10 digits for DB constraint
    const cleanPhone = ptPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      setIsSaving(false);
      return;
    }

    try {
      let patientId: string;
      const { data: existing, error: pError } = await supabase
        .from('patients')
        .select('id')
        .eq('name', ptName)
        .eq('contact', cleanPhone)
        .limit(1);

      if (pError) throw pError;

      if (existing && existing.length > 0) {
        patientId = existing[0].id;
        await supabase.from('patients').update({ age: ptAge, gender: ptSex, clinic_id: clinic?.id, contact: cleanPhone }).eq('id', patientId);
      } else {
        const { data: neu, error: cError } = await supabase
          .from('patients')
          .insert([{ name: ptName, contact: cleanPhone, age: ptAge, gender: ptSex, clinic_id: clinic?.id }])
          .select()
          .single();
        if (cError) throw cError;
        patientId = neu.id;
      }

      // Format follow-up date for display
      const displayFollowUp = followUp ? new Date(followUp).toLocaleDateString('en-IN') : '';
      const finalAdvice = displayFollowUp ? `${advice}\n\n[REVISIT DATE: ${displayFollowUp}]` : advice;

      // Insert prescription and return share_id
      const { data: pData, error } = await supabase.from('prescriptions').insert([{
        patient_id: patientId,
        doctor_id: selectedDoctorObj.id,
        complaints: cc,
        findings: findings,
        medicines: JSON.stringify(meds.map(m => ({
          type: m.type,
          name: m.name,
          dose: m.dose,
          freq: m.freq,
          dur: m.duration,
          inst: m.instructions,
          note: m.note
        }))),
        advice: finalAdvice,
        date: date,
        weight: ptWeight,
        clinic_id: clinic?.id,
        doctor_name: doctor || selectedDoctorObj?.name || 'Dr. Consultant'
      }]).select('id').single();

      if (error) throw error;

      // Update local ID for use in sharing
      if (pData?.id) {
        setSavedRxId(pData.id);
      }

      alert('Prescription saved successfully!');
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Error: ' + (err.message || 'Check database permissions.'));
    } finally {
      setIsSaving(false);
    }
  };

  const [savedRxId, setSavedRxId] = useState<string | null>(null);

  const shareWhatsApp = () => {
    if (!savedRxId && !ptName) {
      alert('Please save the prescription first to generate a link.');
      return;
    }

    const rawPhone = ptPhone.replace(/\D/g, '');
    let cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;

    // Construct the public link
    const baseUrl = window.location.origin;
    const shareUrl = savedRxId ? `${baseUrl}/view/${savedRxId}` : '(Error: Save needed)';

    const displayFollowUp = (followUp && !isNaN(new Date(followUp).getTime()))
      ? new Date(followUp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      : 'As advised';

    const msg = `🏥 *${clinic?.name || 'MediNest Clinic'}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${ptName}*,\n\n` +
      `Your digital prescription from *Dr. ${doctor || 'Medical Officer'}* is ready. You can view it here:\n` +
      `🔗 ${shareUrl}\n\n` +
      `📅 *Follow-up Date:* ${displayFollowUp}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_Thank you for your visit!_ 🙏`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadImage = async () => {
    if (!rxPaperRef.current) return;
    const canvas = await html2canvas(rxPaperRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `Prescription_${ptName}_${date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadPDF = async () => {
    if (!rxPaperRef.current) return;
    const canvas = await html2canvas(rxPaperRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Prescription_${ptName}_${date}.pdf`);
  };

  const quickAdd = (setter: any, val: string) => {
    setter((prev: string) => prev ? (prev.includes(val) ? prev : prev + ', ' + val) : val);
  };

  const isEmpty = meds.length === 0 && !ptName && !cc && !findings;

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.container}>
          
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`} 
              onClick={() => setActiveTab('info')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              1. Patient & Clinical Notes
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'rx' ? styles.tabActive : ''}`} 
              onClick={() => setActiveTab('rx')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.5 20.5a7 7 0 1 1 9.9-9.9l-6.3 6.3a3.5 3.5 0 1 1-4.9-4.9l5.1-5.1"></path></svg>
              2. Prescribe Medicines
            </button>
          </div>

          <div className={styles.grid}>
            {/* 🏥 LEFT: ACTION PANEL */}
            <div className={styles.formPanel}>

            {activeTab === 'info' && (
                <div className={styles.tabContent}>
                  <div className={styles.panelBlock}>
                    <h3 className={styles.blockTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Doctor & Patient Details
                    </h3>
                    
                    <div className={styles.field}>
                      <label>Consulting Doctor</label>
                      <select value={doctor} onChange={e => setDoctor(e.target.value)}>
                        <option value="">Select Doctor...</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field} style={{ position: 'relative' }}>
                      <label>Search Patient (Phone/ID)</label>
                      <input 
                        type="tel" 
                        className={styles.mainSearchInput}
                        value={ptPhone} 
                        onChange={e => { skipPtSearchRef.current = false; setPtPhone(e.target.value); }} 
                        placeholder="Start typing phone..." 
                        autoComplete="off"
                        autoFocus
                      />
                      {ptSuggestions.length > 0 && (
                        <div className={styles.suggestionsDropdown}>
                          {ptSuggestions.map((p) => (
                            <div key={p.id} className={styles.suggestionItem} onClick={() => handleSelectPatient(p)}>
                              <div className={styles.sugMain}>
                                <span className={styles.sugName}>{p.name}</span>
                                <span className={styles.sugCat}>{p.contact}</span>
                              </div>
                              <div className={styles.sugSub}>{p.age} yrs • {p.gender}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isLoadingPts && <div className={styles.sugLoading}>Searching...</div>}
                    </div>

                    {ptSnapshot && (
                      <div className={styles.aiSnapshotBox}>
                        <div className={styles.snapshotHeader}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                          Clinical Intelligence Snapshot
                        </div>
                        <div className={styles.snapshotData}>
                          <strong>Key Diagnoses / Conditions</strong>
                          {ptSnapshot.keyConditions?.join(' • ') || 'Initial visit analysis...'}
                          
                          <strong>Active Medications</strong>
                          {ptSnapshot.currentMedications?.map((m: any) => typeof m === 'object' ? m.name : m).join(' • ') || 'No maintenance drugs recorded.'}
                        </div>
                      </div>
                    )}

                    <div className={styles.field}><label>Patient Name</label><input type="text" value={ptName} onChange={e => setPtName(e.target.value)} placeholder="Full Name" /></div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className={styles.field}><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                      <div className={styles.field}><label>Age (Yrs)</label><input type="text" value={ptAge} onChange={e => setPtAge(e.target.value)} placeholder="Age" /></div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className={styles.field}><label>Sex</label><select value={ptSex} onChange={e => setPtSex(e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                      <div className={styles.field}><label>Weight (Kg)</label><input type="text" value={ptWeight} onChange={e => setPtWeight(e.target.value)} placeholder="Weight" /></div>
                    </div>
                  </div>

                  <div className={styles.panelBlock}>
                    <h3 className={styles.blockTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Consultation Details
                    </h3>
                    <div className={styles.field}>
                      <label>Chief Complaints</label>
                      <div className={styles.quickTags}>{commonCC.map(t => <button key={t} className={styles.tag} onClick={() => quickAdd(setCc, t)}>{t}</button>)}</div>
                      <textarea rows={3} value={cc} onChange={e => setCc(e.target.value)} placeholder="Symptoms..." />
                    </div>
                    <div className={styles.field}><label>Diagnosis / Observations</label><textarea rows={3} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Clinical findings..." /></div>
                  </div>
                  
                  <button className={styles.btnEx} onClick={() => setActiveTab('rx')} style={{ width: '100%', height: '54px', marginBottom: '20px' }}>
                    Next Step: Prescribe Medicines →
                  </button>
                </div>
              )}

            {activeTab === 'rx' && (
                <div className={styles.tabContent}>
                  <div className={styles.panelBlock}>
                    <h3 className={styles.blockTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.5 20.5a7 7 0 1 1 9.9-9.9l-6.3 6.3a3.5 3.5 0 1 1-4.9-4.9l5.1-5.1"></path></svg>
                      Prescribe Medicine
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div className={styles.field} style={{ width: '120px', marginBottom: 0 }}>
                        <select value={mType} onChange={e => setMType(e.target.value)}><option>Tab</option><option>Cap</option><option>Syp</option><option>Inj</option><option>Drop</option><option>Oint</option></select>
                      </div>
                      <div className={styles.field} style={{ flex: 1, position: 'relative', marginBottom: 0 }}>
                        <input 
                          type="text" 
                          value={mName} 
                          onChange={e => { skipSearchRef.current = false; setMName(e.target.value); }} 
                          placeholder="Medicine Name or Symptom..." 
                          autoComplete="off"
                        />
                        {dbSuggestions.length > 0 && (
                          <div className={styles.suggestionsDropdown}>
                            {dbSuggestions.map((med) => (
                              <div key={med.id} className={styles.suggestionItem} onClick={() => {
                                skipSearchRef.current = true;
                                setMName(med.name);
                                setMType(med.type || 'Tab');
                                setMDose(med.default_dose || '');
                                setMFreq(med.default_freq || '');
                                setMDur(med.default_dur || '');
                                setMInst(med.default_inst || '');
                                setDbSuggestions([]);
                              }}>
                                <div className={styles.sugMain}>
                                  <span className={styles.sugName}>{med.name}</span>
                                  <span className={styles.sugCat}>{med.category}</span>
                                </div>
                                <div className={styles.sugSub}>{med.strength || med.composition}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className={styles.field}><label>Dosage</label><input type="text" value={mDose} onChange={e => setMDose(e.target.value)} placeholder="Ex: 500mg" /></div>
                      <div className={styles.field}><label>Frequency</label>
                         <select value={mFreq} onChange={e => setMFreq(e.target.value)}>
                            <option value="">Select...</option>
                            <option>1-0-1</option>
                            <option>1-1-1</option>
                            <option>1-0-0</option>
                            <option>0-0-1</option>
                            <option>SOS</option>
                            <option>QID</option>
                         </select>
                      </div>
                      <div className={styles.field}>
                        <label>Duration</label>
                        {!showCustomDur ? (
                          <select value={mDur} onChange={e => e.target.value === 'Custom' ? setShowCustomDur(true) : setMDur(e.target.value)}>
                            <option value="">Duration...</option>
                            {['1 Day', '3 Days', '5 Days', '7 Days', '15 Days', '1 Month'].map(d => <option key={d} value={d}>{d}</option>)}
                            <option value="Custom">Custom...</option>
                          </select>
                        ) : (
                          <input type="text" value={mDur} onChange={e => setMDur(e.target.value)} placeholder="Ex: 10 Days" onBlur={() => !mDur && setShowCustomDur(false)} autoFocus />
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.field}><label>Special Instructions</label><input type="text" value={mInst} onChange={e => setMInst(e.target.value)} placeholder="Ex: Before meals" /></div>
                    <div className={styles.field}><label>Internal Note</label><input type="text" value={mNote} onChange={e => setMNote(e.target.value)} placeholder="Internal remarks" /></div>
                    
                    <button className={styles.btnEx} onClick={() => {
                      if (!mName) return;
                      setMeds([...meds, { id: Math.random().toString(), name: mName, type: mType, dose: mDose, freq: mFreq, duration: mDur, instructions: mInst, note: mNote }]);
                      setMName(''); setMDose(''); setMFreq(''); setMDur(''); setMInst(''); setMNote('');
                    }} style={{ background: 'var(--primary-accent)' }}>
                      Add to Prescription +
                    </button>
                  </div>

                  <div className={styles.panelBlock}>
                    <h3 className={styles.blockTitle}>Advice & Follow-up</h3>
                    <div className={styles.field}><label>General Advice</label><textarea rows={3} value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Lifestyle recommendations..." /></div>
                    <div className={styles.field}><label>Follow-up Date</label><input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} /></div>
                  </div>
                  
                  <div className={styles.exportRow}>
                    <button className={styles.btnEx} onClick={handleSave} disabled={isSaving}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      {isSaving ? 'Processing...' : 'Finish & Save Rx'}
                    </button>
                    <button className={`${styles.btnEx} ${styles.btnExSecondary}`} onClick={downloadPDF} title="Download PDF Preview">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    </button>
                    {savedRxId && (
                       <button className={`${styles.btnEx} ${styles.btnExSecondary}`} onClick={shareWhatsApp} title="Share to Patient">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                       </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 📄 RIGHT: DIGITAL PREVIEW */}
            <div className={styles.previewPanel}>
              <div id="rx-to-pdf" ref={rxPaperRef} className={`${styles.rxCard} ${isEmpty ? styles.emptyTheme : styles.finalTheme}`}>
                
                {isEmpty && (
                  <div className={styles.watermarkContainer}>
                    <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                )}

                <header className={styles.rxHeader}>
                  {!isEmpty ? (
                    <>
                      <div className={styles.hospBlock}>
                        <h1 className={styles.hospName} style={{ color: 'var(--primary-deep)' }}>{clinic?.name || 'MediNest Sanctuary'}</h1>
                        <p className={styles.hospSlogan}>{clinic?.tagline || 'HEALTH IS WEALTH'}</p>
                        <div className={styles.hospPhone} style={{ color: 'var(--primary-deep)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {clinic?.phone || '+91 7380520394'}
                        </div>
                      </div>
                      <div className={styles.centerLogo}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </div>
                      <div className={styles.drBlock}>
                        <h2 className={styles.drName}>Dr. {doctor || 'Consultant'}</h2>
                        <p className={styles.drQual}>{selectedDoctorObj?.qualification || 'Consulting Physician • M.B.B.S, M.D.'}</p>
                        <p className={styles.drSmall}>Reg No: {selectedDoctorObj?.reg_no || '1C0FF459'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.drBlock} style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                        <h2 className={styles.drName} style={{ color: 'var(--empty-primary)' }}>Dr. {doctor || 'Consultant Name'}</h2>
                        <p className={styles.drQual}>M.B.B.S., M.D.</p>
                        <p className={styles.drSmall}>General Consultant</p>
                      </div>
                      <div className={styles.centerLogo} style={{ background: 'transparent', border: '3px solid var(--empty-primary)', color: 'var(--empty-primary)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </div>
                      <div className={styles.hospBlock} style={{ textAlign: 'right' }}>
                        <h1 className={styles.hospName} style={{ color: 'var(--empty-primary)' }}>{clinic?.name || 'Sitapur Shishu Kendra'}</h1>
                        <p className={styles.hospSlogan}>Health is Wealth</p>
                        <div className={styles.hospPhone} style={{ color: 'var(--empty-primary)', justifyContent: 'flex-end' }}>
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                           {clinic?.phone || '+91 7380520394'}
                        </div>
                      </div>
                    </>
                  )}
                </header>

                <div className={`${styles.rxInfoBar} ${isEmpty ? styles.emptyInfoBar : ''}`}>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>NAME:</span>
                    <span className={styles.infoValue} style={{ color: isEmpty ? 'var(--empty-primary)' : '' }}>{ptName || '___________'}</span>
                  </div>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>AGE/SEX:</span>
                    <span className={styles.infoValue} style={{ color: isEmpty ? 'var(--empty-primary)' : '' }}>{ptAge || '___'} / {ptSex[0] || 'M'}</span>
                  </div>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>WT:</span>
                    <span className={styles.infoValue} style={{ color: isEmpty ? 'var(--empty-primary)' : '' }}>{ptWeight ? `${ptWeight} Kg` : '____'}</span>
                  </div>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>DATE:</span>
                    <span className={styles.infoValue} style={{ color: isEmpty ? 'var(--empty-primary)' : '' }}>{date ? new Date(date).toLocaleDateString('en-GB') : '11/4/2026'}</span>
                  </div>
                </div>

                <div className={styles.rxMainBody}>
                  <aside className={styles.bodyLeftColumn} style={{ borderRight: isEmpty ? '2px solid var(--empty-primary)' : '1px solid var(--border-soft)' }}>
                    <div className={styles.sectionHeader} style={{ color: isEmpty ? 'var(--empty-primary)' : '', borderColor: isEmpty ? 'var(--empty-primary)' : '' }}>C/C (CHIEF COMPLAINTS)</div>
                    <div className={styles.notesText} style={{ minHeight: '80px', opacity: cc ? 1 : 0.4 }}>
                      {cc || (isEmpty ? '' : 'Fever, Cough, etc...')}
                    </div>
                    
                    <div className={styles.sectionHeader} style={{ color: isEmpty ? 'var(--empty-primary)' : '', borderColor: isEmpty ? 'var(--empty-primary)' : '' }}>O/E & FINDINGS</div>
                    <div className={styles.notesText} style={{ minHeight: '80px', opacity: findings ? 1 : 0.4 }}>
                      {findings || (isEmpty ? '' : 'Stable vitals, Chest clear...')}
                    </div>
                  </aside>
                  
                  <main className={styles.bodyRightColumn}>
                    <div className={styles.rxBigLogo} style={{ color: isEmpty ? 'var(--empty-primary)' : '' }}>Rx</div>
                    
                    <div className={styles.medsList}>
                      {meds.map((m, idx) => (
                        <div key={m.id} className={styles.previewMedItem}>
                          <div className={styles.pmMainRow}>
                            <div className={styles.pmName}>{idx + 1}. {m.type} {m.name}</div>
                            <div className={styles.pmDose}>{m.dose}</div>
                          </div>
                          <div className={styles.pmDetailsRow}>
                            {m.freq} — {m.duration} — {m.instructions}
                          </div>
                          {m.note && <div className={styles.pmNote}>* {m.note}</div>}
                        </div>
                      ))}
                      {meds.length === 0 && (
                        <p style={{ color: isEmpty ? 'var(--empty-primary)' : '#cbd5e1', fontStyle: 'italic', opacity: 0.5 }}>
                          Prescribe medications...
                        </p>
                      )}
                    </div>

                    <div className={styles.adviceBlock}>
                        <div className={styles.sectionHeader} style={{ color: isEmpty ? 'var(--empty-primary)' : '', borderColor: isEmpty ? 'var(--empty-primary)' : '' }}>Adv. (Advice/Instructions)</div>
                        <div className={styles.notesText}>{advice || (isEmpty ? '' : 'General rest.')}</div>
                        {followUp && (
                          <div className={styles.revisitDate}>
                            [REVISIT DATE: {new Date(followUp).toLocaleDateString('en-GB')}]
                          </div>
                        )}
                        {isEmpty && <div style={{ marginTop: '20px', fontWeight: 800, color: 'var(--empty-primary)', fontSize: '13px' }}>[REVISIT DATE: 16/4/2026]</div>}
                    </div>
                  </main>
                </div>

                <footer className={styles.rxFooterLine}>
                  {!isEmpty ? (
                    <div className={styles.addressLine}>
                      <div className={styles.addressText}>
                        {clinic?.address || '29/1C Kings and queens residency infront of Knowledge park 3, Greater Noida, GREATER NOIDA'}<br/>
                        Ph: {clinic?.phone || '+91 7380520394'}
                      </div>
                      <div className={styles.footerRightCol}>
                        {clinic?.name?.toUpperCase() || 'MEDI NEST'} • DIGITAL CLINICAL RECORD
                      </div>
                    </div>
                  ) : (
                    <div className={styles.centeredAddress}>
                      <div className={styles.pinIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      </div>
                      {clinic?.address || '29/1C Kings and queens residency infront of Knowledge park 3, Greater Noida, GREATER NOIDA'}
                    </div>
                  )}
                </footer>
                
                <div className={`${styles.rxFooterAesthetic} ${isEmpty ? styles.emptyFooterBar : ''}`}>
                  <div className={styles.bottomBar}>
                    {isEmpty ? (
                      <span className={styles.footerLegal}>Digital Document - Child Healthcare Expert - MediNest EHR</span>
                    ) : (
                      <span className={styles.footerLegal}>Certified Clinical Document • {clinic?.name || 'MediNest Sanctuary'} • Verified Record</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
