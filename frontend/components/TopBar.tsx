'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title: string;
  backHref?: string;   // kept for backward compat but now ignored — router.back() is used
  backLabel?: string;
  showLogout?: boolean; // kept for backward compat but deprecated — NavBar handles logout
}

export default function TopBar({ title, backLabel = 'Back' }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="ssk-topbar">
      <button className="topbar-back" onClick={() => router.back()} aria-label="Go back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>{backLabel}</span>
      </button>

      <div className="topbar-logo">
        <div className="topbar-logo-circle">
          <Image src="/assets/medinest_logo.png" alt="MediNest Logo" width={34} height={34} style={{ objectFit: 'contain' }} />
        </div>
        <div className="topbar-title">{title}</div>
      </div>

      {/* Spacer to keep logo centred — logout is now handled by the global NavBar */}
      <div style={{ minWidth: 80 }} />
    </header>
  );
}
