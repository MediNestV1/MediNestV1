'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title: string;
  backLabel?: string;
  showLogout?: boolean; 
}

export default function TopBar({ title, backLabel = 'Back' }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/40 backdrop-blur-lg border-b border-slate-100 mb-8 rounded-b-[2.5rem]">
      <button 
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 rounded-xl text-xs font-black transition-all group" 
        onClick={() => router.back()} 
        aria-label="Go back"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16" className="group-hover:-translate-x-0.5 transition-transform">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="uppercase tracking-widest">{backLabel}</span>
      </button>

      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        <div className="h-6 w-1 bg-slate-200 rounded-full" />
        <div className="w-10 h-10 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <Image src="/assets/medinest_logo.png" alt="MediNest" width={24} height={24} style={{ objectFit: 'contain' }} />
        </div>
      </div>

      {/* Spacer to keep title centered relatively */}
      <div className="hidden sm:block min-w-[100px]" />
    </header>
  );
}
