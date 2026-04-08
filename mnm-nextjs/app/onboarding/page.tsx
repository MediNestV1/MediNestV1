'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import styles from './page.module.css';

interface Doctor {
  name: string;
  qualification: string;
  contact: string;
  specialty: string;
  is_active: boolean;
  display_order: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  // Step 1 state
  const [clinicName, setClinicName] = useState('');
  const [clinicNameHindi, setClinicNameHindi] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [step1Error, setStep1Error] = useState('');

  // Step 2 state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [docName, setDocName] = useState('');
  const [docQual, setDocQual] = useState('');
  const [docContact, setDocContact] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goStep2 = () => {
    if (!clinicName) { setStep1Error('Clinic name is required.'); return; }
    if (!phone) { setStep1Error('Phone number is required.'); return; }
    setStep1Error('');
    setStep(2);
    window.scrollTo(0, 0);
  };

  const addDoctor = () => {
    if (!docName.trim()) return;
    setDoctors(prev => [...prev, {
      name: docName.trim(),
      qualification: docQual.trim(),
      contact: docContact.trim(),
      specialty: docSpecialty.trim() || 'General Medicine',
      is_active: true,
      display_order: doctors.length,
    }]);
    setDocName(''); setDocQual(''); setDocContact(''); setDocSpecialty('');
  };

  const removeDoctor = (i: number) => {
    setDoctors(prev => prev.filter((_, idx) => idx !== i).map((d, j) => ({ ...d, display_order: j })));
  };

  const handleSubmit = async () => {
    if (doctors.length === 0 && !confirm('You have not added any doctors. Continue without adding?')) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const fullAddress = [address, city].filter(Boolean).join(', ');
      const { data: clinic, error: clinicErr } = await supabase.from('clinics').insert({
        name: clinicName,
        name_hindi: clinicNameHindi || null,
        phone, address: fullAddress,
        tagline: tagline || 'Quality Healthcare for All',
        email: user.email,
        owner_user_id: user.id,
        status: 'pending',
      }).select().single();

      if (clinicErr) throw clinicErr;

      if (doctors.length > 0) {
        const docsWithClinic = doctors.map(d => ({ ...d, clinic_id: clinic.id }));
        await supabase.from('clinic_doctors').insert(docsWithClinic);
      }

      setStep(3);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setStep2Error(err.message || 'Submission failed. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.bg}>
      <div className={styles.card}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className={styles.cardHead}>
              <div className={styles.stepLabel}>Step 1 of 3</div>
              <h2>Tell us about your clinic 🏥</h2>
              <p>This info will appear on all your bills and prescriptions</p>
            </div>
            <div className={styles.cardBody}>
              {step1Error && <div className={styles.errMsg}>{step1Error}</div>}
              <div className="field"><label>Clinic / Hospital Name *</label>
                <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Green Valley Medical Center" autoFocus /></div>
              <div className="field"><label>Clinic Name in Hindi (optional)</label>
                <input type="text" value={clinicNameHindi} onChange={e => setClinicNameHindi(e.target.value)} placeholder="e.g. हरित घाटी चिकित्सा केन्द्र" /></div>
              <div className={styles.row2}>
                <div className="field"><label>Phone Number *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-XXXXXXXXXX" /></div>
                <div className="field"><label>City / Location</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lucknow, UP" /></div>
              </div>
              <div className="field"><label>Full Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Street, Area, Pin Code…" /></div>
              <div className="field"><label>Clinic Tagline</label>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Quality Care for Every Child" /></div>
            </div>
            <div className={styles.btnRow}>
              <button className="btn-primary" onClick={goStep2}>Next: Add Doctors →</button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className={styles.cardHead}>
              <div className={styles.stepLabel}>Step 2 of 3</div>
              <h2>Add your doctors 👨‍⚕️</h2>
              <p>You can edit this later from your settings page</p>
            </div>
            <div className={styles.cardBody}>
              {step2Error && <div className={styles.errMsg}>{step2Error}</div>}
              <div className={styles.doctorsList}>
                {doctors.map((d, i) => (
                  <div key={i} className={styles.doctorCard}>
                    <div className={styles.doctorAvatar}>{d.name[0].toUpperCase()}</div>
                    <div className={styles.doctorInfo}>
                      <div className={styles.doctorName}>{d.name}{d.qualification ? ` (${d.qualification})` : ''}</div>
                      <div className={styles.doctorMeta}>{d.specialty}{d.contact ? ` · ${d.contact}` : ''}</div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeDoctor(i)}>×</button>
                  </div>
                ))}
              </div>
              <div className={styles.addDoctorForm}>
                <h4>+ Add a Doctor</h4>
                <div className="field"><label>Doctor's Name *</label>
                  <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dr. Pradeep Kumar" /></div>
                <div className={styles.row2}>
                  <div className="field"><label>Qualification</label>
                    <input type="text" value={docQual} onChange={e => setDocQual(e.target.value)} placeholder="MBBS, MD" /></div>
                  <div className="field"><label>Contact Number</label>
                    <input type="tel" value={docContact} onChange={e => setDocContact(e.target.value)} placeholder="98XXXXXXXX" /></div>
                </div>
                <div className="field"><label>Specialty</label>
                  <input type="text" value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} placeholder="Pediatrics, General Medicine…" /></div>
                <button className={styles.btnAddDoc} onClick={addDoctor}>+ Add Doctor to List</button>
              </div>
            </div>
            <div className={styles.btnRow}>
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Submit for Approval'}
              </button>
            </div>
          </>
        )}

        {/* Step 3 - Waiting */}
        {step === 3 && (
          <div className={styles.waitingScreen}>
            <div className={styles.waitingIcon}>⏳</div>
            <h2>You're on the waitlist!</h2>
            <p>Your clinic registration has been submitted. Our team will review and approve your account — usually within 24 hours.</p>
            <div className={styles.waitingBadge}>🔔 Status: Pending Approval</div>
            <br /><br />
            <p style={{ fontSize: 13, color: '#94a3b8' }}>You'll be able to log in and access your dashboard once approved.</p>
          </div>
        )}
      </div>
    </div>
  );
}
