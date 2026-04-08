'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { createClient } from '@/lib/supabase';

export default function PortalNavbar() {
  const { clinic } = useClinic();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <nav className="portal-navbar">
      <div className="nav-left">
        <Link href="/portal" className="nav-logo-circle">
          <Image 
            src="/assets/medinest_logo.png" 
            alt="MediNest" 
            width={40} 
            height={40} 
            style={{ objectFit: 'contain' }} 
          />
        </Link>
        <div className="nav-clinic-info">
          <span className="nav-clinic-name">{clinic?.name || 'MediNest Clinic'}</span>
          <span className="nav-portal-label">Portal Dashboard</span>
        </div>
      </div>

      <div className="nav-right">
        <button className="btn-nav-signout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
