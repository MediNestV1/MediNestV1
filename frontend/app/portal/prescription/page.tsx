'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Image from 'next/image';

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

function PrescriptionPageContent() {
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
  const [doctor, setDoctor] = useState('');
  const [followUp, setFollowUp] = useState('');

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
  const [mDurCustom, setMDurCustom] = useState('');
  const [mInst, setMInst] = useState('');
  const [mNote, setMNote] = useState('');

  const commonMeds = ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Cefixime 100mg', 'Cetirizine 5mg', 'ORS Sachet', 'Zinc Syrup'];
  const commonCC = ['Fever', 'Cough', 'Cold', 'Loose Motion', 'Body Ache'];
  
  const selectedDoctorObj = doctors.find(d => d.name === doctor);

  const addMed = () => {
    if (!mName) return;
    const finalDur = mDur === 'Custom...' ? mDurCustom : mDur;
    setMeds([...meds, {
      id: Date.now().toString(),
      name: mName,
      type: mType,
      dose: mDose,
      freq: mFreq,
      duration: finalDur,
      instructions: mInst,
      note: mNote
    }]);
    setMName(''); setMDose(''); setMNote(''); setMDurCustom('');
  };

  const removeMed = (id: string) => setMeds(meds.filter(m => m.id !== id));

  const handleSave = async () => {
    if (!ptName) { alert('Please enter patient name.'); return; }
    if (!selectedDoctorObj) { alert('Please select a consulting doctor.'); return; }
    setIsSaving(true);
    const supabase = createClient();
    try {
      let patientId: string;
      const { data: existing } = await supabase.from('patients').select('id').eq('name', ptName).eq('contact', ptPhone).limit(1);
      if (existing && existing.length > 0) {
        patientId = existing[0].id;
        await supabase.from('patients').update({ age: ptAge, gender: ptSex, clinic_id: clinic?.id }).eq('id', patientId);
      } else {
        const { data: neu, error: cError } = await supabase.from('patients').insert([{ name: ptName, contact: ptPhone, age: ptAge, gender: ptSex, clinic_id: clinic?.id }]).select().single();
        if (cError) throw cError;
        patientId = neu.id;
      }
      const displayFollowUp = followUp ? new Date(followUp).toLocaleDateString('en-IN') : '';
      const finalAdvice = displayFollowUp ? `${advice}\n\n[REVISIT DATE: ${displayFollowUp}]` : advice;

      const { data: pData, error } = await supabase.from('prescriptions').insert([{
        patient_id: patientId,
        doctor_id: selectedDoctorObj.id,
        complaints: cc,
        findings: findings,
        medicines: JSON.stringify(meds),
        advice: finalAdvice,
        date: date,
        weight: ptWeight,
        clinic_id: clinic?.id,
        doctor_name: doctor || selectedDoctorObj?.name || 'Dr. Consultant'
      }]).select('id').single();
      if (error) throw error;
      setSavedRxId(pData.id);
      alert('Prescription saved successfully!');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setIsSaving(false); }
  };

  const [savedRxId, setSavedRxId] = useState<string | null>(null);

  const shareWhatsApp = () => {
    if (!savedRxId && !ptName) { alert('Please save first.'); return; }
    const rawPhone = ptPhone.replace(/\D/g, '');
    let cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    const shareUrl = `${window.location.origin}/view/${savedRxId}`;
    const msg = `🏥 *${clinic?.name}*\nHello *${ptName}*,\nYour digital prescription is ready:\n🔗 ${shareUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadPDF = async () => {
    if (!rxPaperRef.current) return;
    const canvas = await html2canvas(rxPaperRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Rx_${ptName}.pdf`);
  };

  const quickAdd = (setter: any, val: string) => setter((prev: string) => prev ? (prev.includes(val) ? prev : prev + ', ' + val) : val);

  return (
    <div className="min-h-screen mesh-gradient animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto p-4 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ── Form Panel ── */}
          <div className="flex-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-premium p-8 lg:p-12 border border-slate-100">
              <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Prescription</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Precision Medical Console · v2.5</p>
              </header>

              <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-10 overflow-hidden border border-slate-100">
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'info' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>1. Patient Vitals</button>
                <button onClick={() => setActiveTab('rx')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'rx' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2. Medications</button>
              </div>

              {activeTab === 'info' ? (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consulting Doctor</label>
                      <select value={doctor} onChange={e => setDoctor(e.target.value)} className="input-medical !bg-slate-50">
                        <option value="">Select Doctor...</option>
                        {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Name</label>
                       <input type="text" value={ptName} onChange={e => setPtName(e.target.value)} placeholder="Full Legal Name" className="input-medical" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                       <input type="tel" value={ptPhone} onChange={e => setPtPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" className="input-medical" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Date</label>
                       <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-medical" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 col-span-full">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Age</label><input type="text" value={ptAge} onChange={e => setPtAge(e.target.value)} className="input-medical text-center" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Sex</label><select value={ptSex} onChange={e => setPtSex(e.target.value)} className="input-medical"><option>Male</option><option>Female</option><option>Other</option></select></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Weight (Kg)</label><input type="text" value={ptWeight} onChange={e => setPtWeight(e.target.value)} className="input-medical text-center" /></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Chief Complaints</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                       {commonCC.map(t => <button key={t} onClick={() => quickAdd(setCc, t)} className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 rounded-full text-[10px] font-black tracking-tight transition-colors border border-slate-200">{t}</button>)}
                     </div>
                     <textarea rows={2} value={cc} onChange={e => setCc(e.target.value)} className="input-medical min-h-[100px]" placeholder="Patient's primary symptoms..." />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Final Diagnosis</label>
                    <textarea rows={2} value={findings} onChange={e => setFindings(e.target.value)} className="input-medical" placeholder="Professional clinical findings..." />
                  </div>
                  
                  <button onClick={() => setActiveTab('rx')} className="btn-medical w-full justify-between h-14 !rounded-2xl">
                    <span>Continue to Medications</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="flex gap-2">
                          <select value={mType} onChange={e => setMType(e.target.value)} className="input-medical !w-24 px-1 text-center font-bold !bg-white">
                             <option>Tab</option><option>Cap</option><option>Syp</option><option>Inj</option><option>Drop</option>
                          </select>
                          <input list="med-list" value={mName} onChange={e => setMName(e.target.value)} placeholder="Medicine name" className="input-medical flex-1 !bg-white" />
                          <datalist id="med-list">{commonMeds.map(m => <option key={m} value={m} />)}</datalist>
                       </div>
                       <input type="text" value={mDose} onChange={e => setMDose(e.target.value)} placeholder="Dose (e.g. 500mg)" className="input-medical !bg-white" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <select value={mFreq} onChange={e => setMFreq(e.target.value)} className="input-medical !bg-white"><option value="">Freq</option><option>1-0-0</option><option>0-1-0</option><option>0-0-1</option><option>1-0-1</option><option>1-1-1</option><option>SOS</option></select>
                       <select value={mDur} onChange={e => setMDur(e.target.value)} className="input-medical !bg-white"><option value="">Dur</option><option>3 Days</option><option>5 Days</option><option>1 Week</option><option>1 Month</option><option>Custom...</option></select>
                       <select value={mInst} onChange={e => setMInst(e.target.value)} className="input-medical !bg-white"><option value="">Timing</option><option>After Meal</option><option>Before Meal</option><option>Empty Stomach</option></select>
                    </div>
                    <button onClick={addMed} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs tracking-widest uppercase hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">+ Add to Prescription</button>
                  </div>

                  {meds.length > 0 && (
                    <div className="space-y-3">
                       {meds.map(m => (
                         <div key={m.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-cyan-200 transition-colors group">
                           <div>
                              <p className="font-black text-slate-900">{m.type}. {m.name} <span className="text-cyan-600 ml-1">{m.dose}</span></p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{[m.freq, m.duration, m.instructions].filter(Boolean).join(' • ')}</p>
                           </div>
                           <button onClick={() => removeMed(m.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                           </button>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="space-y-8 pt-8 border-t border-slate-100">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">General Advice</label>
                        <textarea value={advice} onChange={e => setAdvice(e.target.value)} className="input-medical min-h-[80px]" placeholder="Rest, diet settings..." />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Specific Follow-up Date</label>
                        <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className="input-medical" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <button onClick={handleSave} className="flex flex-col items-center justify-center p-4 bg-cyan-600 text-white rounded-3xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 transition-all gap-2 group">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17,3H5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V7L17,3M12,19A3,3 0 1,1 12,13A3,3 0 1,1 12,19M15,9H5V5H15V9Z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Save Rx</span>
                     </button>
                     <button onClick={downloadPDF} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-3xl hover:border-cyan-300 transition-all gap-2 group">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-slate-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">PDF</span>
                     </button>
                     <button onClick={shareWhatsApp} className="flex flex-col items-center justify-center p-4 bg-emerald-500 text-white rounded-3xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all gap-2 group">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.04,2C6.58,2,2.13,6.45,2.13,11.91c0,1.75,0.45,3.45,1.32,4.95L2,22l5.25-1.38c1.45,0.79,3.08,1.21,4.74,1.21c5.44,0,9.89-4.45,9.89-9.91C21.89,6.45,17.5,2,12.04,2z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                     </button>
                     <button onClick={() => window.print()} className="flex flex-col items-center justify-center p-4 bg-slate-900 text-white rounded-3xl shadow-lg hover:bg-black transition-all gap-2 group">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Print</span>
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className="hidden xl:block w-[450px]">
            <div className="sticky top-24 bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-100 overflow-hidden" ref={rxPaperRef}>
               {/* Rx Watermark */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-slate-50/50 pointer-events-none select-none z-0">Rx</div>
               
               <div className="relative z-10 space-y-10">
                  {/* Rx Header */}
                  <header className="flex justify-between items-start border-b-4 border-cyan-600 pb-8">
                     <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight">{doctor ? `Dr. ${doctor}` : 'Consulting Doctor'}</p>
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">{selectedDoctorObj?.qualification || 'Medical Specialist'}</p>
                        <p className="text-[9px] font-bold text-slate-400">{selectedDoctorObj?.specialty || 'MediNest Partner'}</p>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-md font-black text-slate-900 uppercase tracking-tighter">{clinic?.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 truncate max-w-[150px]">{clinic?.address || 'Clinic Location'}</p>
                        <p className="text-[10px] font-black text-slate-400">P: {clinic?.phone || '000-111-2222'}</p>
                     </div>
                  </header>

                  {/* Patient Info Bar */}
                  <div className="bg-slate-50/80 p-5 rounded-2xl grid grid-cols-2 gap-y-4 gap-x-8 text-[11px] font-black text-slate-600 border border-slate-100">
                     <div className="truncate">NAME: <span className="text-slate-900 uppercase ml-1">{ptName || '________________'}</span></div>
                     <div className="text-right">DATE: <span className="text-slate-900 ml-1">{new Date(date).toLocaleDateString('en-IN')}</span></div>
                     <div>AGE/SEX: <span className="text-slate-900 uppercase ml-1">{ptAge || '--'} / {ptSex[0]}</span></div>
                     <div className="text-right">WT: <span className="text-slate-900 ml-1">{ptWeight ? `${ptWeight}Kg` : '--'}</span></div>
                  </div>

                  {/* Rx Body */}
                  <div className="min-h-[400px] py-10">
                     <div className="text-5xl font-black text-cyan-600 mb-8 select-none">Rx</div>
                     <div className="space-y-6">
                        {meds.map(m => (
                          <div key={m.id} className="space-y-1">
                             <p className="text-sm font-black text-slate-900 leading-tight">{m.type}. {m.name} <span className="text-cyan-600 ml-1">{m.dose}</span></p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{[m.freq, m.duration, m.instructions].filter(Boolean).join(' • ')}</p>
                             {m.note && <p className="text-[9px] font-medium text-slate-400 italic">* {m.note}</p>}
                          </div>
                        ))}
                        {meds.length === 0 && <p className="text-slate-300 font-bold italic text-sm">Medications will appear here...</p>}
                     </div>
                     
                     {(cc || findings) && (
                       <div className="pt-10 space-y-4">
                          {cc && <p className="text-[10px] font-bold text-slate-400 leading-relaxed"><b className="text-slate-600 uppercase tracking-widest mr-2">C/C:</b> {cc}</p>}
                          {findings && <p className="text-[10px] font-bold text-slate-400 leading-relaxed"><b className="text-slate-600 uppercase tracking-widest mr-2">Findings:</b> {findings}</p>}
                       </div>
                     )}
                  </div>

                  {/* Footer */}
                  <footer className="pt-8 border-t border-slate-100 space-y-6">
                     {advice && (
                       <div className="p-4 bg-cyan-50/30 rounded-xl border border-cyan-100">
                          <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-1">Doctor's Advice</p>
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">{advice}</p>
                       </div>
                     )}
                     
                     <div className="flex justify-between items-end">
                        {followUp && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proposed Follow-Up</p>
                             <p className="text-sm font-black text-cyan-600">{new Date(followUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        )}
                        <div className="text-right">
                           <div className="w-24 h-1 border-b-2 border-slate-900 ml-auto mb-2" />
                           <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Medical Signature</p>
                        </div>
                     </div>
                  </footer>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PrescriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="spinner border-cyan-600 !border-t-transparent" /></div>}>
      <PrescriptionPageContent />
    </Suspense>
  );
}
