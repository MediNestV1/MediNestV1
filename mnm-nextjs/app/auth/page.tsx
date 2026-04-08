'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

type Tab = 'login' | 'register';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as Tab) ?? 'login';
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();
  const supabase = createClient();

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

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password: loginPass 
      });

      if (authError) throw authError;

      const user = data?.user;
      if (!user) throw new Error('Could not retrieve user session after login.');

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('status')
        .eq('owner_user_id', user.id)
        .single();

      if (!clinic) {
        router.push('/onboarding');
        return;
      }

      if (clinic.status === 'active') {
        router.push('/portal');
      } else if (clinic.status === 'pending') {
        router.push('/pending');
      } else {
        setLoginError('Your clinic is ' + clinic.status);
        setLoginLoading(false);
      }
    } catch (err: any) {
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
    <div className={styles.pageContainer}>
      {/* Background Gradient Blobs */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      <div className={styles.blob3}></div>

      {/* Back to Home Link */}
      <Link href="/" className={styles.backHome}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </Link>

      <div className={styles.authCard}>
        <div className={styles.logoContainer}>
          <Image 
            src="/assets/medinest_logo.png" 
            alt="MediNest Logo" 
            width={72}
            height={72}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <div className={styles.authHeader}>
          <h2>{tab === 'login' ? 'Welcome back' : 'Create Account'}</h2>
          <p>{tab === 'login' ? 'Login to your doctor account' : 'Setup your new clinic portal'}</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            {loginError && <div className={styles.errorBox}>{loginError}</div>}
            
            <div className={styles.inputGroup}>
              <label>Email</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input 
                  type="email" 
                  className={styles.inputField}
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  placeholder="doctor@clinic.com" 
                  autoComplete="email" 
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input 
                  type={showLoginPass ? "text" : "password"} 
                  className={styles.inputField}
                  value={loginPass} 
                  onChange={e => setLoginPass(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                />
                <button type="button" className={styles.togglePassBtn} onClick={() => setShowLoginPass(!showLoginPass)}>
                  {showLoginPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
              {!loginLoading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              )}
            </button>

            <div className={styles.divider}>Or continue with</div>

            <div className={styles.socialBtns}>
              <button type="button" className={styles.socialBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button type="button" className={styles.socialBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.74 2.65.11 4.2 1.34 5.09 3.19-2.58 1.58-2.05 4.84.45 5.8-1.01 2.36-2.4 3.97-4.2 3.92z"/>
                  <path d="M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            {regError && <div className={styles.errorBox}>{regError}</div>}
            {regSuccess && (
              <div className={styles.successBox}>
                <h3>✅ Account Created!</h3>
                <p>Redirecting to clinical setup…</p>
              </div>
            )}
            
            {!regSuccess && (
              <>
                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <input 
                      type="email" 
                      className={styles.inputField}
                      value={regEmail} 
                      onChange={e => setRegEmail(e.target.value)} 
                      placeholder="doctor@yourclinic.com" 
                      autoComplete="email" 
                    />
                  </div>
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <input 
                      type={showRegPass ? "text" : "password"} 
                      className={styles.inputField}
                      value={regPass} 
                      onChange={e => setRegPass(e.target.value)} 
                      placeholder="Min 8 characters" 
                      autoComplete="new-password" 
                    />
                    <button type="button" className={styles.togglePassBtn} onClick={() => setShowRegPass(!showRegPass)}>
                      {showRegPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <div className={styles.inputIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <input 
                      type={showRegConfirm ? "text" : "password"} 
                      className={styles.inputField}
                      value={regConfirm} 
                      onChange={e => setRegConfirm(e.target.value)} 
                      placeholder="Repeat password" 
                      autoComplete="new-password" 
                    />
                    <button type="button" className={styles.togglePassBtn} onClick={() => setShowRegConfirm(!showRegConfirm)}>
                      {showRegConfirm ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={regLoading}>
                  {regLoading ? 'Creating...' : 'Create Account'}
                  {!regLoading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  )}
                </button>
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8 bg-[#0b0f19] text-[#2dd4bf]">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
