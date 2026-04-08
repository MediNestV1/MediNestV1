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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

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

  return (
    <>
      {/* ── Global Navigation Bar ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        height: 52,
        background: 'linear-gradient(135deg, #064e45 0%, #0a7c6e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 2px 16px rgba(10,124,110,.3)',
      }}>
        {/* Left: Logo + Clinic Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            overflow: 'hidden', background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/assets/medinest_logo.png" alt="MediNest" width={28} height={28} style={{ objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.1px' }}>
            {clinic?.name || 'MediNest'}
          </span>
        </div>

        {/* Right: User email + Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user?.email && (
            <span style={{
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 30,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background .2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      {children}
    </>
  );
}
