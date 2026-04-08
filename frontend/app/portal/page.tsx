'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';

const metrics = [
  { label: 'Total Patients', value: '1,280', labelChange: '+12% from last month', icon: '👥', color: 'bg-cyan-50' },
  { label: 'Daily Visits', value: '42', labelChange: '8 patients waiting', icon: '🏥', color: 'bg-indigo-50' },
  { label: 'Completed Rx', value: '315', labelChange: '98% accuracy rate', icon: '📝', color: 'bg-teal-50' },
  { label: 'Revenue (MTD)', value: '₹4.2L', labelChange: '+5.4% growth', icon: '📈', color: 'bg-emerald-50' },
];

const quickActions = [
  { 
    title: 'New Prescription', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    ), 
    href: '/portal/prescription',
    color: 'bg-cyan-600'
  },
  { 
    title: 'Patient History', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M3 20h4M12 4V4M3 4h18M9 4V4M4 10h16M4 15h16"/>
      </svg>
    ), 
    href: '/portal/doctor/patient-history',
    color: 'bg-slate-800'
  },
];

export default function PortalPage() {
  const { clinic } = useClinic();

  return (
    <div className="min-h-screen mesh-gradient p-6 lg:p-12 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-premium border border-slate-100">
               <Image src="/assets/medinest_logo.png" alt="MediNest" width={64} height={64} style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{clinic?.name || 'MediNest Clinic'}</h1>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs mt-1">
                Premium Clinic Management Console · <span className="text-cyan-600">Active Session</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900">Dr. Consultant</p>
              <p className="text-xs font-bold text-slate-400">Owner & Administrator</p>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
               <Image src="/assets/medinest_logo.png" alt="User" width={48} height={48} className="opacity-50 grayscale" />
            </div>
          </div>
        </header>

        {/* Quick Actions Bar */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="group relative flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-cyan-500 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className={`${action.color} text-white p-5 rounded-3xl shadow-lg ring-8 ring-slate-50`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{action.title}</h3>
                  <p className="text-slate-400 font-medium">Create new records and manage flow</p>
                </div>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div key={metric.label} className={`${metric.color} p-8 rounded-[2rem] border border-white/50 space-y-4 shadow-sm group hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{metric.icon}</span>
                <span className="px-2 py-1 bg-white/60 rounded-lg text-[10px] font-black text-slate-500 tracking-wider transition-all">REALTIME</span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{metric.value}</p>
                <p className="text-sm font-bold text-slate-500">{metric.label}</p>
              </div>
              <div className="pt-2 border-t border-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{metric.labelChange}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Sub-Portals / Modules */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Modules</h2>
              <button className="text-sm font-bold text-cyan-600">View All Permissions</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/portal/doctor" className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:border-cyan-200 hover:shadow-lg transition-all flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2h0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h0a.3.3 0 1 0 .2-.3Z"/><path d="M13 19c6 0 7-3 7-3V8s-1 3-7 3h-4V19h4Z"/><path d="M8 19v2"/><path d="M8 5V3"/></svg>
                 </div>
                 <h3 className="font-black text-slate-900">Doctor Console</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">Rx, AI Summaries & History</p>
              </Link>
              <Link href="/portal/receptionist" className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 </div>
                 <h3 className="font-black text-slate-900">Front Desk</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">Registry, Billing & Queues</p>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-cyan-600 rounded-full text-[10px] font-black tracking-widest uppercase">System Status</span>
              <h2 className="text-2xl font-black tracking-tight leading-tight">Server Health: Excellent</h2>
              <p className="text-slate-400 text-sm font-medium">All clinical modules are operational. Synced with Supabase Edge Network.</p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
               <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Last Backup</p>
               <p className="text-lg font-black text-cyan-400">08 Apr 2026, 21:05</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-slate-200 pb-12">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">
             © 2026 {clinic?.name || 'MediNest'} · Console v2.5.0 · Cloud Infused Healthcare
           </p>
        </footer>
      </div>
    </div>
  );
}
