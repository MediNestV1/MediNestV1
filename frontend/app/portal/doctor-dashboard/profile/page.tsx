'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function DoctorProfilePage() {
  const { doctors, refresh } = useClinic();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      const doc = doctors[0];
      setName(doc.name || '');
      setQualification(doc.qualification || '');
      setSpecialty(doc.specialty || '');
      setPhone(doc.phone || '');
    }
  }, [doctors]);

  const handleSave = async () => {
    if (!doctors || doctors.length === 0) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_doctors')
        .update({ name, qualification, specialty, phone })
        .eq('id', doctors[0].id);
      if (error) throw error;
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      alert('Error saving profile: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR';

  return (
    <div className={styles.page}>
      <TopBar title="Doctor Profile" backHref="/portal/doctor-dashboard" />

      <main className={styles.main}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <h2 className={styles.doctorName}>{name || 'Your Name'}</h2>
            <p className={styles.doctorRole}>{specialty || 'Specialty not set'}</p>
          </div>
        </div>

        {/* Form */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Personal Details</h3>

          <div className={styles.field}>
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Pradeep Jain"
            />
          </div>

          <div className={styles.field}>
            <label>Qualification</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MBBS, MD (Medicine)"
            />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label>Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiologist"
              />
            </div>
            <div className={styles.field}>
              <label>Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </div>

        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : saved ? '✓ Profile Saved' : 'Save Profile'}
        </button>
      </main>
    </div>
  );
}
