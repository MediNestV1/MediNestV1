'use client';

import { useState, useEffect, useCallback } from 'react';
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

  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-fetch State
  const [foundPatients, setFoundPatients] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-fetch logic
  useEffect(() => {
    const cleanPhone = ptPhone.replace(/\D/g, '');
    
    // Only search if we have at least 3 digits
    if (cleanPhone.length < 3 || !clinic) {
      setFoundPatients([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error: searchError } = await supabase
          .from('patients')
          .select('*')
          .ilike('contact', `%${cleanPhone}%`)
          .eq('clinic_id', clinic.id)
          .limit(5);

        if (searchError) throw searchError;
        setFoundPatients(data || []);
      } catch (err) {
        console.error('Auto-fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [ptPhone, clinic, supabase]);

  const handleSelectPatient = (patient: any) => {
    setPtName(patient.name || '');
    setPtPhone(patient.contact || patient.mobile || '');
    setFoundPatients([]); // Hide the list after selection
  };

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

      if (existing && existing.length > 0) {
        setError(`Patient "${ptName}" with this phone number is already registered.`);
        setIsSubmitting(false);
        return;
      }

      // 2. Insert new patient
      const { error: insertError } = await supabase
        .from('patients')
        .insert([{
          name: normalizedName,
          contact: cleanPhone,

          clinic_id: clinic.id
        }]);

      if (insertError) throw insertError;

      // 3. Success
      setSuccess(`Success! ${ptName} has been registered.`);
      
      // Clear form
      setPtName('');
      setPtPhone('');

      
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
                <div className={styles.formField} style={{ position: 'relative' }}>
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
                    autoComplete="off"
                  />
                  
                  {/* Dynamic Search Results */}
                  {(isSearching || foundPatients.length > 0) && (
                    <div className={styles.searchResults}>
                      {isSearching && <div className={styles.searchingLoader}>Searching database...</div>}
                      {!isSearching && foundPatients.map(patient => (
                        <div 
                          key={patient.id} 
                          className={styles.resultItem}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <div className={styles.resultIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          </div>
                          <div className={styles.resultInfo}>
                            <div className={styles.resultName}>{patient.name}</div>
                            <div className={styles.resultMeta}>
                              <span>{patient.gender}, {patient.age}y</span>
                              <span>•</span>
                              <span>{patient.contact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
