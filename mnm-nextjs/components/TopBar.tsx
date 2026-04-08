'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export default function TopBar({ title, backHref, backLabel = 'Back' }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="ssk-topbar">
      {backHref ? (
        <button onClick={() => router.back()} className="topbar-back" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ marginLeft: '4px' }}>{backLabel}</span>
        </button>
      ) : (
        <div style={{ minWidth: 80 }} />
      )}

      <div className="topbar-logo">
        <div className="topbar-logo-circle">
          <Image src="/assets/medinest_logo.png" alt="MediNest Logo" width={34} height={34} style={{ objectFit: 'contain' }} />
        </div>
        <div className="topbar-title">{title}</div>
      </div>

      <div className="topbar-spacer-right">
      </div>
    </header>
  );
}
