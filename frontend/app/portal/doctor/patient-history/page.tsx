// file: mnm-nextjs/app/portal/doctor/patient-history/page.tsx
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createClient } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import styles from './page.module.css';

interface Visit {
  visit_date: string;
  notes: string | null;
  prescription: any;
}

interface Patient {
  id: string;
  name: string;
  contact?: string; // using contact instead of mobile based on prescription schema
  created_at: string;
}

function PatientHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams?.get('patientId');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summary, setSummary] = useState<string>('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  // Load patients if no ID is provided
  useEffect(() => {
    if (patientId) return;
    
    const fetchPatients = async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setPatientList(data);
      }
      setIsSearching(false);
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [patientId, searchTerm]);

  // Load specific patient history if ID is provided
  useEffect(() => {
    if (!patientId) return;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    fetch(`${apiUrl}/api/patient-history/${patientId}`)
      .then(async r => {
        if (!r.ok) {
           const errText = await r.text();
           console.error("Backend Error Response:", errText);
           throw new Error(`Failed to fetch patient history: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        setPatient(data.patient);
        setVisits(data.visits);
        setSummary(data.summary);
      })
      .catch(err => {
        console.error('Patient history fetch error:', err);
        setPatient({ id: patientId, name: "Error Loading Data", created_at: "" });
        setSummary("Failed to load patient summary. Please ensure your backend is running.");
      });
  }, [patientId]);

  const exportPDF = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`patient_${patient?.name || 'history'}.pdf`);
  };

  // UI for selecting a patient
  if (!patientId) {
    return (
      <div className={styles.page}>
        <TopBar title="Patient History Search" backHref="/portal/doctor" />
        <main className={styles.container}>
          <h1 className={styles.title}>Select Patient</h1>
          <input 
            type="text" 
            placeholder="Search patient by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}
          />
          
          {isSearching ? <p>Searching...</p> : (
            <ul className={styles.visitList}>
              {patientList.map(p => (
                <li key={p.id} className={styles.visitItem} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => router.push(`/portal/doctor/patient-history?patientId=${p.id}`)}>
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.contact && `📞 ${p.contact}`}</span>
                  </div>
                  <button className={styles.pdfBtn} style={{ margin: 0 }}>View History</button>
                </li>
              ))}
              {patientList.length === 0 && <p>No patients found. Create one by writing a prescription first!</p>}
            </ul>
          )}
        </main>
      </div>
    );
  }

  if (!patient) return <p className={styles.loading}>Loading patient history…</p>;

  return (
    <div className={styles.page}>
      <TopBar title="Patient History" backHref="/portal/doctor/patient-history" />
      <main className={styles.container}>
        <h1 className={styles.title}>Patient History – {patient.name}</h1>
        <section id="pdf-content" className={styles.snapshot}>
          <pre>{summary}</pre>
        </section>
        <button className={styles.pdfBtn} onClick={exportPDF}>📥 Export as PDF</button>
        <hr />
        <h2 className={styles.sub}>Visit Details</h2>
        <ul className={styles.visitList}>
          {visits.map((v, i) => {
            let medsList = [];
            if (v.prescription?.medicines) {
              try {
                medsList = typeof v.prescription.medicines === 'string' 
                  ? JSON.parse(v.prescription.medicines) 
                  : v.prescription.medicines;
              } catch (e) {
                console.error("Failed to parse medicines", e);
              }
            }

            return (
              <li key={i} className={styles.visitItem} style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '1.2rem', color: '#0d6e56' }}>{new Date(v.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</strong>
                  {v.prescription?.doctor_name && <span style={{ backgroundColor: '#e6f4f1', color: '#0d6e56', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>By {v.prescription.doctor_name}</span>}
                </div>
                
                {v.notes && (
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderLeft: '4px solid #0d6e56', borderRadius: '4px', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <p style={{ margin: 0, color: '#444' }}>{v.notes}</p>
                  </div>
                )}
                
                {medsList.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1rem' }}>💊 Prescribed Medicines</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead style={{ backgroundColor: '#f1f1f1' }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Medicine</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Dose/Freq</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Duration</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medsList.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}><strong>{m.type}. {m.name}</strong></td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#555' }}>{m.dose} {m.freq}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#555' }}>{m.dur || m.duration}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#555' }}>{m.inst} {m.note ? `(${m.note})` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {v.prescription?.advice && (
                   <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fdfbf7', border: '1px solid #f3e9d2', borderRadius: '6px' }}>
                     <h4 style={{ margin: '0 0 6px 0', color: '#8a6d3b', fontSize: '1rem' }}>📌 Doctor's Advice & Follow-up</h4>
                     <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#555', fontSize: '0.95rem' }}>{v.prescription.advice}</p>
                   </div>
                )}
              </li>
            );
          })}
          {visits.length === 0 && <p>No previous visits found for this patient.</p>}
        </ul>
      </main>
    </div>
  );
}

export default function PatientHistory() {
  return (
    <Suspense fallback={<p className={styles.loading}>Loading Data...</p>}>
      <PatientHistoryContent />
    </Suspense>
  );
}
