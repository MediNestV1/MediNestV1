'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { clinic, user, loading } = useClinic();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!clinic) { router.push('/onboarding'); return; }
    if (clinic.status === 'pending') { router.push('/pending'); return; }
    if (clinic.status === 'suspended') { router.push('/auth'); return; }
  }, [loading, user, clinic]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '3px solid #e2e8f0', borderTopColor: 'var(--teal)', width: 40, height: 40 }} />
          <p style={{ marginTop: 16, color: 'var(--ink-l)', fontSize: 14 }}>Loading your clinic…</p>
        </div>
      </div>
    );
  }

  if (!clinic || clinic.status !== 'active') return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Global Portal Navbar */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/portal')}>
          <Image src="/assets/medinest_logo.png" alt="MediNest Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '20px', letterSpacing: '-0.5px' }}>MediNest Portal</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{clinic.name}</span>
             <span style={{ fontSize: '12px', color: 'var(--ink-l)' }}>{user?.email}</span>
          </div>
          
          <button 
            onClick={handleSignOut}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: '#fef2f2', color: '#dc2626', 
              border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', 
              fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' 
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
            title="Sign out of MediNest"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}
