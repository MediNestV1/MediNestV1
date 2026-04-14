'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import styles from './view.module.css';

// Types (Mirrored from main page)
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

export default function FullResultPreview() {
  const router = useRouter();
  const { clinic, loading: clinicLoading } = useClinic();
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    const draftStr = localStorage.getItem('discharge_summary_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        
        // Migration logic for preview page too (consistency)
        const migrate = (val: any) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim()) {
            return val.split('\n')
                      .map(s => s.replace(/^[•\-\*]\s*/, '').trim())
                      .filter(Boolean);
          }
          return [];
        };

        const migratedSummary = {
          ...draft,
          complaints: migrate(draft.complaints),
          findings: migrate(draft.findings),
          treatment: migrate(draft.treatment),
          advice: migrate(draft.advice)
        };
        
        setSummary(migratedSummary);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  if (clinicLoading || !summary) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading document preview...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={styles.btnBack} onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Editor
          </button>
          <div style={{ color: 'var(--sanctuary-ink-l)', fontSize: 13, fontWeight: 600 }}>Preview Mode</div>
        </div>

        <div className={styles.headerActions}>
           <button className={styles.btnPrint} onClick={() => window.print()}>
             🖨️ Print Document
           </button>
        </div>
      </header>

      <main className={styles.viewport}>
        <div className={styles.previewDoc}>
          <table className={styles.printableTable}>
            <thead>
              <tr>
                <td>
                  <div className={styles.previewHeader}>
                    <h2>{clinic?.name || 'Clinic Name'}</h2>
                    <p>{clinic?.address || 'Address details...'}</p>
                    <div style={{ marginTop: 12, fontSize: 15, fontWeight: 900, textDecoration: 'underline', letterSpacing: '1px' }}>DISCHARGE SUMMARY</div>
                  </div>

                  <div className={styles.previewInfoGrid}>
                    <div><b>Patient Name:</b> {summary.patientName || <span className={styles.emptyPlaceholder}>[Not Provided]</span>}</div>
                    <div><b>Reg / IPD No:</b> {summary.regNo || '---'}</div>
                    <div><b>Age / Sex:</b> {summary.age}Y / {summary.sex}</div>
                    <div><b>Consultant:</b> Dr. {summary.doctor || '---'}</div>
                    <div><b>Date of Admission:</b> {summary.doa ? new Date(summary.doa).toLocaleString() : '---'}</div>
                    <div><b>Date of Discharge:</b> {summary.dod ? new Date(summary.dod).toLocaleString() : '---'}</div>
                  </div>
                </td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <div className={styles.previewSection}>
                    <h4>Final Diagnosis</h4>
                    <p>{summary.diagnosis || <span className={styles.emptyPlaceholder}>Pending diagnosis...</span>}</p>
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Chief Complaints & History</h4>
                    {summary.complaints.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {summary.complaints.map((c, i) => <li key={i} style={{ marginBottom: 6 }}>• {c}</li>)}
                      </ul>
                    ) : <p className={styles.emptyPlaceholder}>No complaints recorded.</p>}
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Physical Findings & Investigations</h4>
                    {summary.findings.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {summary.findings.map((f, i) => <li key={i} style={{ marginBottom: 6 }}>• {f}</li>)}
                      </ul>
                    ) : <p className={styles.emptyPlaceholder}>No findings recorded.</p>}
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Treatment & Medications During Stay</h4>
                    {summary.treatment.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {summary.treatment.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>• {t}</li>)}
                      </ul>
                    ) : <p>Conservative management.</p>}
                  </div>

                  {summary.medicines.length > 0 && (
                    <div className={styles.previewSection}>
                      <h4>Medications Advised on Discharge</h4>
                      <table className={styles.medTable}>
                        <thead>
                          <tr><th>Medicine Name</th><th>Frequency</th><th>Duration</th></tr>
                        </thead>
                        <tbody>
                          {summary.medicines.map(m => (
                            <tr key={m.id}>
                              <td>{m.name || '---'}</td>
                              <td>{m.frequency}</td>
                              <td>{m.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className={styles.previewSection}>
                    <h4>Follow-up Advice & Instructions</h4>
                    {summary.advice.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {summary.advice.map((a, i) => <li key={i} style={{ marginBottom: 6 }}>• {a}</li>)}
                      </ul>
                    ) : <p>General post-discharge care.</p>}
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td>
                  <div style={{ paddingTop: 60, textAlign: 'right', borderTop: '1px solid #000', marginTop: 40 }}>
                    <div style={{ fontSize: 13, fontWeight: 900 }}>Dr. {summary.doctor || '(Authorized Signature)'}</div>
                    <div style={{ fontSize: 11, color: '#444' }}>Clinic Consultant / Chief Resident</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>Generated via MediNest EMR Platform</div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}
