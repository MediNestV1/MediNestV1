'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Phone, 
  Award, 
  Stethoscope, 
  Clock, 
  BadgeCheck,
  Building,
  Home
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function DoctorProfilePage() {
  const { doctors, clinic, refresh } = useClinic();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'general' | 'professional' | 'clinic'>('general');
  const [name, setName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [timings, setTimings] = useState('');
  const [expiry, setExpiry] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || '');
      setClinicAddress(clinic.address || '');
    }
    if (doctors && doctors.length > 0) {
      const doc = doctors[0];
      setName(doc.name || '');
      setQualification(doc.qualification || '');
      setSpecialty(doc.specialty || '');
      setPhone(doc.phone || doc.contact || '');
      setEmail(doc.contact_email || '');
      setDob(doc.dob || '');
      setGender(doc.gender || '');
      setRegNumber(doc.registration_number || '');
      setExperience(doc.experience_years?.toString() || '');
      setTimings(doc.timings || '');
      setExpiry(doc.license_expiry_date || '');
      setPhotoUrl(doc.profile_photo_url || '');
    }
  }, [doctors, clinic]);

  const handleSave = async () => {
    if (!doctors || doctors.length === 0) return;
    setIsSaving(true);
    try {
      const activeDoc = doctors[0];
      
      // 1. Update Global Profile (doctors table)
      const { error: globalErr } = await supabase
        .from('doctors')
        .update({ 
          name, 
          qualification, 
          specialty, 
          contact: phone || null, 
          phone: phone || null, // Sync both fields for safety
          contact_email: email || null,
          dob: dob || null,
          gender: gender || null,
          registration_number: regNumber || null,
          license_expiry_date: expiry || null,
          profile_photo_url: photoUrl || null,
          experience_years: parseInt(experience) || 0
        })
        .eq('id', activeDoc.doctor_id);

      if (globalErr) throw globalErr;

      // 2. Update Clinic Context (clinic_doctors table)
      const { error: clinicErr } = await supabase
        .from('clinic_doctors')
        .update({ 
          timings
        })
        .eq('id', activeDoc.id);

      if (clinicErr) throw clinicErr;

      // 3. Update Clinic Profile
      if (clinic) {
        const { error: clinicUpdErr } = await supabase
          .from('clinics')
          .update({ 
            name: clinicName,
            address: clinicAddress
          })
          .eq('id', clinic.id);
        if (clinicUpdErr) throw clinicUpdErr;
      }

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
        {/* Improved Header Area */}
        <div className={styles.headerCard}>
          <div className={styles.avatarSection}>
            {photoUrl ? (
              <img src={photoUrl} alt={name} className={styles.avatar} style={{ objectFit: 'cover' }} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
            <div className={styles.headerText}>
              <div className={styles.nameRow}>
                <h2 className={styles.doctorName}>{name || 'Your Name'}</h2>
                <BadgeCheck size={20} className={styles.verifiedIcon} />
              </div>
              <p className={styles.doctorRole}>{specialty || 'Specialty not set'}</p>
            </div>
          </div>
          
          <div className={styles.tabNav}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <User size={18} />
              <span>General Info</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'professional' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              <Briefcase size={18} />
              <span>Professional Details</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'clinic' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('clinic')}
            >
              <Building size={18} />
              <span>Clinic Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={styles.contentArea}>
          {activeTab === 'general' ? (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Basic Information</h3>
              
              <div className={styles.field}>
                <label><User size={14} /> Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Pradeep Jain"
                />
              </div>

                <div className={styles.field}>
                  <label><Briefcase size={14} /> Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. doctor@medinest.ai"
                  />
                </div>

                <div className={styles.twoCol}>
                  <div className={styles.field}>
                    <label><Calendar size={14} /> Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label><User size={14} /> Gender</label>
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

                <div className={styles.field}>
                  <label><Phone size={14} /> Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>
            </div>
          ) : activeTab === 'professional' ? (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Professional Details</h3>

              <div className={styles.field}>
                <label><Award size={14} /> Qualification</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MBBS, MD (Medicine)"
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label><Stethoscope size={14} /> Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Cardiologist"
                  />
                </div>
                <div className={styles.field}>
                  <label><BadgeCheck size={14} /> Medical Reg. Number</label>
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
                  <label><Award size={14} /> Experience (Years)</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label><Clock size={14} /> Consultation Timings</label>
                <input
                  type="text"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  placeholder="e.g. Mon-Sat: 10 AM - 2 PM, 5 PM - 8 PM"
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label><Calendar size={14} /> License Expiry Date</label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label><User size={14} /> Profile Photo URL</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Clinic Details</h3>
              <p className={styles.cardSubtitle}>Update your hospital or clinic branding information.</p>
              
              <div className={styles.field}>
                <label><Building size={14} /> Hospital / Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. City Care Hospital"
                />
              </div>

              <div className={styles.field}>
                <label><Home size={14} /> Clinic Address</label>
                <textarea
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="e.g. 123 Medical Avenue, Healthcare City"
                  rows={3}
                  className={styles.textarea}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : saved ? '✓ Profile Saved' : 'Save Profile Changes'}
          </button>
        </div>
      </main>
    </div>
  );
}
