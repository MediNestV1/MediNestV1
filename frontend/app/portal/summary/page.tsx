'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface MedItem {
  id: string;
  name: string;
  frequency: string;
  duration: string;
}

export default function SummaryPage() {
  const { clinic, doctors } = useClinic();
  
  const [ptName, setPtName] = useState('');
  const [ptAge, setPtAge] = useState('');
  const [ptSex, setPtSex] = useState('Male');
  const [regNo, setRegNo] = useState('');
  const [doa, setDoa] = useState('');
  const [dod, setDod] = useState('');
  const [doctor, setDoctor] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [complaints, setComplaints] = useState('');
  const [findings, setFindings] = useState('');
  const [treatment, setTreatment] = useState('');
  
  const [meds, setMeds] = useState<MedItem[]>([]);
  const [advice, setAdvice] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const addMed = () => {
    setMeds([...meds, { id: Date.now().toString(), name: '', frequency: '', duration: '' }]);
  };

  const updateMed = (id: string, field: keyof MedItem, value: string) => {
    setMeds(meds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    if (!ptName) return alert('Patient Name is required');
    
    setIsSaving(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase.from('discharge_summaries').insert([{
        patient_name: ptName,
        reg_no: regNo,
        age_sex: `${ptAge} / ${ptSex}`,
        doctor_name: doctor,
        date_admission: doa,
        date_discharge: dod,
        diagnosis: diagnosis,
        complaints: complaints,
        findings: findings,
        treatment: treatment,
        medicines: JSON.stringify(meds),
        advice: advice,
        clinic_id: clinic?.id
      }]);

      if (error) throw error;
      
      alert('Discharge Summary saved successfully!');
      window.print();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Failed to save summary: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <TopBar title="Discharge Summary" backHref="/portal/doctor" />
      
      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Form Side */}
          <div className={styles.formPanel}>
             <div className={styles.panelBlock}>
                <h3 className={styles.blockTitle}>Admission Details</h3>
                <div className="field">
                   <label>Patient Full Name</label>
                   <input type="text" value={ptName} onChange={e => setPtName(e.target.value)} placeholder="e.g. Amit Sharma" />
                </div>
                <div className={styles.row3}>
                   <div className="field"><label>Age</label><input type="text" value={ptAge} onChange={e => setPtAge(e.target.value)} placeholder="Yrs" /></div>
                   <div className="field">
                      <label>Sex</label>
                      <select value={ptSex} onChange={e => setPtSex(e.target.value)}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                   </div>
                   <div className="field"><label>Reg/IPD No.</label><input type="text" value={regNo} onChange={e => setRegNo(e.target.value)} /></div>
                </div>
                <div className={styles.row2}>
                   <div className="field"><label>Date of Admission</label><input type="datetime-local" value={doa} onChange={e => setDoa(e.target.value)} /></div>
                   <div className="field"><label>Date of Discharge</label><input type="datetime-local" value={dod} onChange={e => setDod(e.target.value)} /></div>
                </div>
                <div className="field">
                   <label>Admitting Doctor</label>
                   <select value={doctor} onChange={e => setDoctor(e.target.value)}>
                     <option value="">Select Doctor...</option>
                     {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                   </select>
                </div>
             </div>

             <div className={styles.panelBlock}>
                <h3 className={styles.blockTitle}>Clinical Summary</h3>
                <div className="field">
                   <label>Final Diagnosis</label>
                   <textarea rows={2} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Main diagnoses..."></textarea>
                </div>
                <div className="field">
                   <label>Presenting Complaints</label>
                   <textarea rows={2} value={complaints} onChange={e => setComplaints(e.target.value)} placeholder="Reason for admission..."></textarea>
                </div>
                <div className="field">
                   <label>Positive Clinical Findings</label>
                   <textarea rows={2} value={findings} onChange={e => setFindings(e.target.value)} placeholder="O/E, Investigations..."></textarea>
                </div>
                <div className="field">
                   <label>Details of Treatment Given</label>
                   <textarea rows={3} value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Procedures, medications during stay..."></textarea>
                </div>
             </div>

             <div className={styles.panelBlock}>
                <h3 className={styles.blockTitle}>Discharge Medication</h3>
                {meds.map((m, idx) => (
                   <div key={m.id} className={styles.medRow}>
                      <div className={styles.mIdx}>{idx+1}</div>
                      <input type="text" className={styles.iName} value={m.name} onChange={e => updateMed(m.id, 'name', e.target.value)} placeholder="Medicine name & dose" />
                      <input type="text" className={styles.iFreq} value={m.frequency} onChange={e => updateMed(m.id, 'frequency', e.target.value)} placeholder="Frequency" />
                      <input type="text" className={styles.iDur} value={m.duration} onChange={e => updateMed(m.id, 'duration', e.target.value)} placeholder="Duration" />
                      <button className={styles.btnRemove} onClick={() => removeMed(m.id)}>×</button>
                   </div>
                ))}
                <button className={styles.btnAddItem} onClick={addMed}>+ Add Medicine</button>
             </div>
             
             <div className={styles.panelBlock}>
                <h3 className={styles.blockTitle}>Discharge Advice & Follow-up</h3>
                <div className="field">
                   <textarea rows={3} value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Rest, diet, when to follow-up..."></textarea>
                </div>
             </div>
          </div>

          {/* Preview Side */}
          <div className={styles.previewPanel}>
             <div className={styles.docCard}>
                <div className={styles.docHeader}>
                   <h2>{clinic?.name}</h2>
                   <p>{clinic?.address} | {clinic?.phone}</p>
                   <div className={styles.docTitle}>DISCHARGE SUMMARY</div>
                </div>

                <div className={styles.docInfoGrid}>
                   <div><b>Patient Name:</b> {ptName}</div>
                   <div><b>Reg No:</b> {regNo}</div>
                   <div><b>Age/Sex:</b> {ptAge && ptSex ? `${ptAge}Y / ${ptSex[0]}` : ''}</div>
                   <div><b>Doctor:</b> {doctor}</div>
                   <div><b>DOA:</b> {doa ? new Date(doa).toLocaleString('en-IN') : ''}</div>
                   <div><b>DOD:</b> {dod ? new Date(dod).toLocaleString('en-IN') : ''}</div>
                </div>

                <div className={styles.docBody}>
                   {diagnosis && <div className={styles.dsSection}><h4>FINAL DIAGNOSIS</h4><p>{diagnosis}</p></div>}
                   {complaints && <div className={styles.dsSection}><h4>PRESENTING COMPLAINTS</h4><p>{complaints}</p></div>}
                   {findings && <div className={styles.dsSection}><h4>CLINICAL FINDINGS</h4><p>{findings}</p></div>}
                   {treatment && <div className={styles.dsSection}><h4>TREATMENT GIVEN</h4><p>{treatment}</p></div>}
                   
                   {meds.length > 0 && (
                     <div className={styles.dsSection}>
                        <h4>DISCHARGE MEDICATION</h4>
                        <table className={styles.dsTable}>
                           <thead><tr><th>Medicine</th><th>Frequency</th><th>Duration</th></tr></thead>
                           <tbody>
                             {meds.map(m => (
                               <tr key={m.id}>
                                  <td>{m.name}</td><td>{m.frequency}</td><td>{m.duration}</td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                   )}

                   {advice && <div className={styles.dsSection}><h4>ADVICE ON DISCHARGE / FOLLOW-UP</h4><p>{advice}</p></div>}
                </div>
                
                <div className={styles.docSign}>
                   <div className={styles.signLine}>Consultant Signature</div>
                </div>
             </div>

             <div style={{ marginTop: 16 }}>
               <button className="btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>Save & Print Summary</button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
