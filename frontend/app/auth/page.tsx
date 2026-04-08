'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

type Tab = 'login' | 'register';

// ── SVG Icons ──
const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
  </svg>
);

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const { refresh } = useClinic();

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass
      });

      if (authError) throw authError;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Could not retrieve user session.');

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
      setLoginError(err.message || 'Login failed.');
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
      setTimeout(() => router.push('/onboarding'), 1500);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
      setRegLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen lg:flex-row mesh-gradient animate-fade-in">
      {/* Left Column: Branding & Immersive Visual */}
      <div className="relative hidden lg:flex lg:w-3/5 xl:w-2/3 bg-cyan-900 overflow-hidden group">
        <Image 
          src="/assets/medical_auth_bg.png" 
          alt="Medical Background" 
          fill 
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
          priority
        />
        <div className="relative z-10 flex flex-col justify-between w-full h-full p-16">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-premium">
              <Image src="/assets/medinest_logo.png" alt="Logo" width={40} height={40} />
            </div>
            <span className="text-3xl font-black tracking-tight text-white">MediNest</span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-5xl font-extrabold leading-tight text-white mb-6">
              Precision Care <br />
              <span className="text-cyan-300">Simplified Workflow.</span>
            </h1>
            <p className="text-xl text-cyan-50/80 leading-relaxed font-medium">
              The next-generation clinic management platform designed for modern healthcare professionals. Streamline your practice, focus on patients.
            </p>
          </div>

          <div className="flex gap-12 text-white/60 font-semibold text-sm uppercase tracking-widest">
            <span>Analytics</span>
            <span>Digital Rx</span>
            <span>Security</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cyan-950/80 to-transparent pointer-events-none" />
      </div>

      {/* Right Column: Auth Card */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:w-2/5 xl:w-1/3 min-h-screen">
        <div className="w-full max-w-md space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors mb-8 group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>

          <div className="glass-card p-8 rounded-[2rem] shadow-premium relative overflow-hidden">
            {/* Header */}
            <div className="relative z-10 mb-8">
              <div className="lg:hidden flex justify-center mb-6">
                 <Image src="/assets/medinest_logo.png" alt="MediNest" width={64} height={64} className="rounded-2xl" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {tab === 'login' ? 'Welcome back' : 'Join MediNest'}
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                {tab === 'login' ? 'Continue your clinical practice' : 'Set up your digital clinic in minutes'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 relative z-10">
              <button 
                onClick={() => setTab('login')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'login' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setTab('register')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'register' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                {loginError && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">{loginError}</div>}
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <IconEmail />
                    </span>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="input-medical pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <button type="button" className="text-xs font-bold text-cyan-600 hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <IconLock />
                    </span>
                    <input 
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="input-medical pl-12 pr-12"
                      required
                    />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showLoginPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loginLoading} className="btn-medical w-full mt-4">
                  {loginLoading ? <span className="spinner border-2" /> : 'Sign In to Dashboard'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5 relative z-10">
                {regError && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">{regError}</div>}
                {regSuccess ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Account Created!</h3>
                    <p className="text-slate-500">Welcome to the future of clinic management. Redirecting you to onboarding...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors"><IconEmail /></span>
                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="doctor@clinic.com" className="input-medical pl-12" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Choose Password</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors"><IconLock /></span>
                        <input type={showRegPass ? 'text' : 'password'} value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Min 8 chars" className="input-medical pl-12 pr-12" required />
                        <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><IconEye /></button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors"><IconLock /></span>
                        <input type={showRegConfirm ? 'text' : 'password'} value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Repeat password" className="input-medical pl-12 pr-12" required />
                        <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><IconEye /></button>
                      </div>
                    </div>

                    <button type="submit" disabled={regLoading} className="btn-medical w-full mt-4">
                      {regLoading ? <span className="spinner border-2" /> : 'Create Doctor Account'}
                    </button>
                    <p className="text-xs text-slate-400 text-center px-4">
                      By registering, you agree to our <span className="font-bold underline cursor-pointer">Terms of Service</span> and <span className="font-bold underline cursor-pointer">Privacy Policy</span>.
                    </p>
                  </>
                )}
              </form>
            )}
          </div>
          
          <div className="text-center text-slate-400 text-sm font-medium">
             Need help? <Link href="/support" className="text-cyan-600 font-bold hover:underline">Contact MediNest Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="spinner border-cyan-600 !border-t-transparent" /></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
