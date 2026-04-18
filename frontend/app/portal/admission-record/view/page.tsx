'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useClinic } from '@/context/ClinicContext';
import styles from './view.module.css';

export default function AdmissionRecordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const { clinic, loading: clinicLoading } = useClinic();
  const supabase = createClient();
  
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      if (!id || !clinic?.id) return setLoading(false);
      const { data, error } = await supabase
        .from('admission_records')
        .select('*')
        .eq('id', id)
        .eq('clinic_id', clinic.id)
        .single();
        
      if (!error && data) {
        setRecord(data);
      }
      setLoading(false);
    }
    fetchRecord();
  }, [id, clinic?.id]);

  if (clinicLoading || loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Admission Record...</div>;
  if (!record) return <div style={{ padding: 40, textAlign: 'center' }}>Record not found or access denied.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={styles.btnBack} onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Patient Record
          </button>
          <div style={{ color: 'var(--sanctuary-ink-l)', fontSize: 13, fontWeight: 600 }}>Archived Record</div>
        </div>
        <button className={styles.btnPrint} onClick={() => window.print()}>🖨️ Print</button>
      </header>

      <main className={styles.viewport}>
        <div className={styles.previewDoc}>
          <table className={styles.printableTable}>
             <thead>
               <tr>
                 <td>
                   <div className={styles.previewHeader}>
                     <h2>{clinic?.name || 'Clinic'}</h2>
                     <p>{clinic?.address || ''}</p>
                     <div style={{ marginTop: 12, fontSize: 15, fontWeight: 900, textDecoration: 'underline' }}>ADMISSION RECORD</div>
                   </div>
                   <div className={styles.previewInfoGrid}>
                     <div><b>Patient Name:</b> {record.patient_name}</div>
                     <div><b>Admission ID:</b> {record.id.slice(0, 8).toUpperCase()}</div>
                     <div><b>Age / Sex:</b> {record.age_sex}</div>
                     <div><b>Contact:</b> {record.contact || '---'}</div>
                     <div><b>Department:</b> {record.department || '---'}</div>
                     <div><b>Ward / Bed:</b> {record.ward || '---'} / {record.bed || '---'}</div>
                     <div><b>Consultant:</b> Dr. {record.doctor_name || '---'}</div>
                     <div><b>Admission Date:</b> {new Date(record.date_admission).toLocaleString()}</div>
                     <div><b>Admission Source:</b> {record.admission_type || 'OPD'}</div>
                     <div style={{ marginTop: 4 }}>
                        <b>Triage Level:</b> 
                        <span style={{ 
                           marginLeft: 8, 
                           padding: '2px 10px', 
                           borderRadius: 4, 
                           fontSize: 11, 
                           fontWeight: 900, 
                           textTransform: 'uppercase',
                           background: record.severity === 'Severe' ? '#ef4444' : record.severity === 'Moderate' ? '#f59e0b' : '#10b981',
                           color: '#fff'
                        }}>
                           {record.severity || 'Mild'}
                        </span>
                     </div>
                     <div style={{ gridColumn: 'span 2', marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <b>Comorbidities:</b> {[
                          record.has_diabetes && "Diabetes",
                          record.has_hypertension && "Hypertension",
                          record.has_thyroid && "Thyroid"
                        ].filter(Boolean).join(', ') || 'None'}
                     </div>
                   </div>
                 </td>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td>
                   {record.allergies && (
                     <div className={styles.previewSection} style={{ border: '2px solid #ef4444', padding: 12, borderRadius: 8, background: '#fef2f2' }}>
                       <h4 style={{ color: '#ef4444', margin: 0 }}>⚠️ CRITICAL ALLERGIES</h4>
                       <p style={{ color: '#991b1b', fontWeight: 800, fontSize: 16 }}>{record.allergies}</p>
                     </div>
                   )}
                   {record.past_surgeries && (
                     <div className={styles.previewSection}>
                       <h4>Previous Surgeries</h4>
                       <p>{record.past_surgeries}</p>
                     </div>
                   )}
                   <div className={styles.previewSection}>
                     <h4>Provisional Diagnosis</h4>
                     <p>{record.diagnosis}</p>
                   </div>
                   {record.doctor_observations && (
                     <div className={styles.previewSection} style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: 12 }}>
                       <h4 style={{ color: '#8b5cf6' }}>Doctor Observations</h4>
                       <p style={{ fontStyle: 'italic' }}>{record.doctor_observations}</p>
                     </div>
                   )}
                   {record.hpi && (
                     <div className={styles.previewSection}>
                       <h4>History of Present Illness (HPI)</h4>
                       <p style={{ whiteSpace: 'pre-wrap' }}>{record.hpi}</p>
                     </div>
                   )}
                   <div className={styles.previewSection}>
                     <h4>Chief Complaints</h4>
                     <ul style={{ paddingLeft: 20 }}>{Array.isArray(record.complaints) && record.complaints.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
                   </div>
                   <div className={styles.previewSection}>
                     <h4>Clinical Findings</h4>
                     <ul style={{ paddingLeft: 20 }}>{Array.isArray(record.findings) && record.findings.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
                   </div>
                   <div className={styles.previewSection}>
                     <h4>Investigations Advised</h4>
                     <ul style={{ paddingLeft: 20 }}>{Array.isArray(record.investigations) && record.investigations.map((inv: string, i: number) => <li key={i}>{inv}</li>)}</ul>
                   </div>
                   <div className={styles.previewSection}>
                     <h4>Initial Treatment Plan</h4>
                     <ul style={{ paddingLeft: 20 }}>{Array.isArray(record.treatment_plan) && record.treatment_plan.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
                   </div>
                 </td>
               </tr>
             </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
