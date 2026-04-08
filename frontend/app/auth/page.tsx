'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

type Tab = 'login' | 'register';

// ── SVG Icons ──
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function AuthPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as Tab) ?? 'login';
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // ── LOGIN STATE ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // ── REGISTER STATE ──
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPass) { setLoginError('Please enter email and password.'); return; }

    setLoginLoading(true);
    console.log('🔑 Auth: Attempting login for', loginEmail);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass
      });

      if (authError) {
        console.error('❌ Auth: Login error:', authError);
        throw authError;
      }

      console.log('✅ Auth: Login successful, fetching session user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ Auth: GetUser error:', userError);
        throw new Error('Could not retrieve user session after login.');
      }

      console.log('🏥 Auth: Checking clinic status for user:', user.id);
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('status')
        .eq('owner_user_id', user.id)
        .single();

      if (clinicError && clinicError.code !== 'PGRST116') {
        console.error('❌ Auth: Clinic query error:', clinicError);
      }

      if (!clinic) {
        console.log('ℹ️ Auth: No clinic found, sending to onboarding');
        router.push('/onboarding');
        return;
      }

      console.log('📊 Auth: Clinic status is', clinic.status);
      if (clinic.status === 'active') {
        router.push('/portal');
        console.log('🚀 Auth: Redirecting to portal...');
      } else if (clinic.status === 'pending') {
        router.push('/pending');
        console.log('⏳ Auth: Redirecting to pending page...');
      } else {
        setLoginError('Your clinic is ' + clinic.status);
        setLoginLoading(false);
      }
    } catch (err: any) {
      console.error('🔥 Auth: Catch-all error:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
      setLoginLoading(false);
    }
  };

  // ── REGISTER ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regEmail) { setRegError('Please enter your email address.'); return; }
    if (regPass.length < 8) { setRegError('Password must be at least 8 characters.'); return; }
    if (regPass !== regConfirm) { setRegError('Passwords do not match.'); return; }
    setRegLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email: regEmail, password: regPass });
      if (error) throw error;
      setRegSuccess(true);
      setTimeout(() => router.push('/onboarding'), 1800);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
      setRegLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backHome}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Home
      </Link>

      <div className={styles.authCard}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoCircle}>
            <Image src="/assets/medinest_logo.png" alt="MediNest" width={48} height={48} style={{ objectFit: 'contain' }} />
          </div>
          <div className={styles.logoText}>
            <h1>MediNest</h1>
            <p>Clinic Management Platform</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form className={styles.formSection} onSubmit={handleLogin}>
            <h2>Welcome back 👋</h2>
            <p className={styles.subtitle}>Sign in to access your clinic dashboard</p>
            {loginError && <div className={styles.errorBox}>{loginError}</div>}

            <div style={{ marginBottom: 16 }}>
              <label className={styles.fieldLabel}>Email Address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconEmail /></span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><IconLock /></span>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeToggle} onClick={() => setShowLoginPass(v => !v)} aria-label="Toggle password">
                  {showLoginPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loginLoading}>
              {loginLoading ? <span className="spinner" /> : 'Sign In →'}
            </button>
            <div className={styles.switchLink}>
              Don&apos;t have an account? <button type="button" onClick={() => setTab('register')}>Register now</button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className={styles.formSection} onSubmit={handleRegister}>
            <h2>Create your account 🏥</h2>
            <p className={styles.subtitle}>Set up your clinic on MediNest in minutes</p>
            {regError && <div className={styles.errorBox}>{regError}</div>}
            {regSuccess && (
              <div className={styles.successBox}>
                <h3>✅ Account Created!</h3>
                <p>Redirecting to clinic setup…</p>
              </div>
            )}
            {!regSuccess && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><IconEmail /></span>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="doctor@yourclinic.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className={styles.fieldLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><IconLock /></span>
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPass}
                      onChange={e => setRegPass(e.target.value)}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeToggle} onClick={() => setShowRegPass(v => !v)} aria-label="Toggle password">
                      {showRegPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className={styles.fieldLabel}>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><IconLock /></span>
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeToggle} onClick={() => setShowRegConfirm(v => !v)} aria-label="Toggle confirm password">
                      {showRegConfirm ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={regLoading}>
                  {regLoading ? <span className="spinner" /> : 'Create Account →'}
                </button>
                <div className={styles.switchLink}>
                  Already have an account? <button type="button" onClick={() => setTab('login')}>Sign in</button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
