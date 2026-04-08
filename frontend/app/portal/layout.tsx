'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { clinic, user, loading } = useClinic();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!clinic) { router.push('/onboarding'); return; }
    if (clinic.status === 'pending') { router.push('/pending'); return; }
    if (clinic.status === 'suspended') { router.push('/auth'); return; }
  }, [loading, user, clinic, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <span className="spinner border-4 border-slate-200 border-t-cyan-600 w-12 h-12" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Console...</p>
        </div>
      </div>
    );
  }

  if (!clinic || clinic.status !== 'active') return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:block lg:w-64">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:pl-0">
        {/* Modern Topbar */}
        <header className="sticky top-0 z-40 h-16 bg-white/70 backdrop-blur-md border-b border-slate-100 px-6 flex items-center justify-between">
          <div className="lg:hidden">
             {/* Mobile Logo for Topbar */}
             <span className="text-lg font-black text-cyan-600">MediNest</span>
          </div>
          
          <div className="hidden lg:block">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
               Environment: <span className="text-emerald-600">Production</span>
             </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black text-slate-900 truncate max-w-[150px]">{user?.email}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Doctor</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-xl text-xs font-black transition-all flex items-center gap-2 group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
