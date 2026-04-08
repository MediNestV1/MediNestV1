'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Workspace', href: '/portal', icon: '🏠' },
  { name: 'Doctor Console', href: '/portal/doctor', icon: '👨‍⚕️' },
  { name: 'Front Desk', href: '/portal/receptionist', icon: '🛎️' },
  { name: 'Patient History', href: '/portal/doctor/patient-history', icon: '📂' },
  { name: 'Analytics', href: '/portal/analytics', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50 transition-all">
      <div className="p-8 pb-12 flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-xl border border-white/10 shadow-lg">
           <Image src="/assets/medinest_logo.png" alt="Logo" width={32} height={32} />
        </div>
        <span className="text-xl font-black tracking-tight">MediNest</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all group ${
                isActive 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`text-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Upgrade</p>
          <p className="text-xs font-bold leading-relaxed">Early Access: v2.5.0 Deployment Active.</p>
          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg transition-colors">WHAT'S NEW</button>
        </div>
      </div>

      <div className="h-20" /> {/* Spacer */}
    </aside>
  );
}
