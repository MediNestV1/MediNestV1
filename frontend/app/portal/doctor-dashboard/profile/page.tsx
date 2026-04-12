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
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [timings, setTimings] = useState('');
  const [fees, setFees] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      const doc = doctors[0];
      setName(doc.name || '');
      setQualification(doc.qualification || '');
      setSpecialty(doc.specialty || '');
      setPhone(doc.phone || doc.contact || '');
      setEmail(doc.email || '');
      setGender(doc.gender || '');
      setDob(doc.dob || '');
      setRegNumber(doc.registration_number || '');
      setExperience(doc.experience_years?.toString() || '');
      setTimings(doc.timings || '');
      setFees(doc.fees?.toString() || '');
    }
  }, [doctors]);

  const handleSave = async () => {
    if (!doctors || doctors.length === 0) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_doctors')
        .update({ 
          name, 
          qualification, 
          specialty, 
          phone,
          email,
          gender,
          dob: dob || null,
          registration_number: regNumber,
          experience_years: parseInt(experience) || 0,
          timings,
          fees: parseInt(fees) || 0
        })
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

        {/* Basic Information */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Personal Information</h3>

          <div className={styles.twoCol}>
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
              <label>Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className={styles.select}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. pradeep@example.com"
              />
            </div>
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

        {/* Professional Details */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Professional Details</h3>

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
              <label>Medical Reg. Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. MCI 12345"
              />
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label>Experience (Years)</label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <div className={styles.field}>
              <label>Consultation Fees (₹)</label>
              <input
                type="number"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Consultation Timings</label>
            <input
              type="text"
              value={timings}
              onChange={(e) => setTimings(e.target.value)}
              placeholder="e.g. Mon-Sat: 10 AM - 2 PM, 5 PM - 8 PM"
            />
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
