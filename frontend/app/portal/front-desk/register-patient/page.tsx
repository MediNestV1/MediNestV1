'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useClinic } from '@/context/ClinicContext';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';

export default function RegisterPatientPage() {
  const { clinic } = useClinic();
  const supabase = createClient();
  
  // Form State
  const [ptName, setPtName] = useState('');
  const [ptPhone, setPtPhone] = useState('');
  const [ptAge, setPtAge] = useState('');
  const [ptSex, setPtSex] = useState('Male');
  const [ptWeight, setPtWeight] = useState('');
  const [ptAddress, setPtAddress] = useState('');
  const [ptBloodGroup, setPtBloodGroup] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    
    // Validation
    if (!ptName.trim()) { setError('Full name is required.'); return; }
    
    const cleanPhone = ptPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedName = ptName.trim().toUpperCase();
      const { data: existingRecords, error: searchError } = await supabase
        .from('patients')
        .select('id, name')
        .eq('name', normalizedName)
        .eq('contact', cleanPhone)
        .eq('clinic_id', clinic.id)
        .limit(1);
      
      const existing = existingRecords?.[0];
      if (searchError) throw searchError;

      if (existing) {
        setError(`Patient with this phone number is already registered as "${existing.name}".`);
        setIsSubmitting(false);
        return;
      }

      // 2. Insert new patient
      const { error: insertError } = await supabase
        .from('patients')
        .insert([{
          name: normalizedName,
          contact: cleanPhone,
          age: ptAge ? parseInt(ptAge) : null,
          gender: ptSex,
          weight: ptWeight ? parseFloat(ptWeight) : null,
          address: ptAddress.trim(),
          blood_group: ptBloodGroup.trim().toUpperCase(),
          clinic_id: clinic.id
        }]);

      if (insertError) throw insertError;

      // 3. Success
      setSuccess(`Success! ${ptName} has been registered.`);
      
      // Clear form for next registration (Continuous Intake)
      setPtName('');
      setPtPhone('');
      setPtAge('');
      setPtSex('Male');
      setPtWeight('');
      setPtAddress('');
      setPtBloodGroup('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err: any) {
      console.error('❌ Registration error details:', err.message || err, err);
      setError(err.message || 'Failed to register patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Register New Patient</h1>
            <p>Gather essential details to create a new clinical profile.</p>
          </header>

          <div className={styles.card}>
            {success && (
              <div className={styles.successMsg}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {success}
              </div>
            )}

            {error && (
              <div className={styles.errorMsg}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className={styles.formGrid}>
                {/* Full Name */}
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="ptName">Patient Full Name</label>
                  <input 
                    id="ptName"
                    type="text" 
                    className={styles.inputBox} 
                    value={ptName} 
                    onChange={e => setPtName(e.target.value.toUpperCase())}
                    placeholder="e.g. RAHUL SHARMA"
                  />
                </div>

                {/* Phone Number */}
                <div className={styles.formField}>
                  <label htmlFor="ptPhone">Contact Number</label>
                  <input 
                    id="ptPhone"
                    type="tel" 
                    className={styles.inputBox} 
                    value={ptPhone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPtPhone(val);
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>

                {/* Age */}
                <div className={styles.formField}>
                  <label htmlFor="ptAge">Age (Years)</label>
                  <input 
                    id="ptAge"
                    type="number" 
                    className={styles.inputBox} 
                    value={ptAge} 
                    onChange={e => setPtAge(e.target.value)}
                    placeholder="e.g. 28"
                  />
                </div>

                {/* Gender */}
                <div className={styles.formField}>
                  <label htmlFor="ptSex">Gender</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      id="ptSex"
                      className={styles.selectBox} 
                      value={ptSex} 
                      onChange={e => setPtSex(e.target.value)}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--sanctuary-primary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className={styles.formField}>
                  <label htmlFor="ptWeight">Weight (Kg)</label>
                  <input 
                    id="ptWeight"
                    type="number" 
                    step="0.1"
                    className={styles.inputBox} 
                    value={ptWeight} 
                    onChange={e => setPtWeight(e.target.value)}
                    placeholder="e.g. 65.5"
                  />
                </div>

                {/* Blood Group */}
                <div className={styles.formField}>
                  <label htmlFor="ptBloodGroup">Blood Group (Optional)</label>
                  <input 
                    id="ptBloodGroup"
                    type="text" 
                    className={styles.inputBox} 
                    value={ptBloodGroup} 
                    onChange={e => setPtBloodGroup(e.target.value.toUpperCase())}
                    placeholder="e.g. O+, B-, AB+"
                  />
                </div>

                {/* Address */}
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="ptAddress">Residential Address</label>
                  <textarea 
                    id="ptAddress"
                    className={styles.inputBox} 
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={ptAddress} 
                    onChange={e => setPtAddress(e.target.value)}
                    placeholder="Enter full address..."
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Saving Clinical Profile...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                    Register Patient
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
