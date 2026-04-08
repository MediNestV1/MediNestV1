'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

interface ClinicData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export default function SuperadminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [search, setSearch] = useState('');

  // Mock data
  const [clinics, setClinics] = useState<ClinicData[]>([
    { id: '1', name: 'Green Valley Medical', email: 'doc@greenvalley.com', phone: '9876543210', status: 'pending', created_at: new Date().toISOString() },
    { id: '2', name: 'City Health Clinic', email: 'info@cityhealth.com', phone: '9876543211', status: 'active', created_at: new Date(Date.now() - 86400000).toISOString() }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else alert('Incorrect password');
  };

  const updateStatus = (id: string, newStatus: 'pending' | 'active' | 'suspended') => {
    setClinics(clinics.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const filteredClinics = clinics.filter(c => {
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: clinics.length,
    pending: clinics.filter(c => c.status === 'pending').length,
    active: clinics.filter(c => c.status === 'active').length,
    suspended: clinics.filter(c => c.status === 'suspended').length
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.loginPage}>
         <form className={styles.loginCard} onSubmit={handleLogin}>
           <h2>Super Admin Portal</h2>
           <p>Terminal access requires authorization.</p>
           <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter passphrase..." />
           <button type="submit">Unlock System</button>
         </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
         <div className={styles.logoRow}>
            <div className={styles.logoCircle}>
              <Image src="/assets/medinest_logo.png" alt="Logo" width={32} height={32} />
            </div>
            <h1>MediNest Central Command</h1>
         </div>
         <button className={styles.btnLogout} onClick={() => setIsAuthenticated(false)}>Lock Session 🔒</button>
      </header>

      <main className={styles.main}>
         <div className={styles.statsRow}>
            <div className={styles.statCard}><h3>{stats.total}</h3><p>Total Clinics</p></div>
            <div className={styles.statCard}><h3>{stats.pending}</h3><p>Pending Apps</p></div>
            <div className={styles.statCard}><h3>{stats.active}</h3><p>Active Tenants</p></div>
            <div className={styles.statCard} style={{ borderBottomColor: '#ef4444' }}><h3>{stats.suspended}</h3><p>Suspended</p></div>
         </div>

         <div className={styles.controls}>
            <input 
              type="text" 
              className={styles.search} 
              placeholder="Search clinics by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className={styles.filters}>
               {(['all', 'pending', 'active', 'suspended'] as const).map(tab => (
                 <button 
                   key={tab} 
                   className={`${styles.filterBtn} ${activeTab === tab ? styles.filterActive : ''}`}
                   onClick={() => setActiveTab(tab)}
                 >
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                 </button>
               ))}
            </div>
         </div>

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                 <tr>
                   <th>Clinic Details</th>
                   <th>Contact Info</th>
                   <th>Status</th>
                   <th>Joined</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                  {filteredClinics.map(c => (
                    <tr key={c.id}>
                       <td><strong>{c.name}</strong></td>
                       <td>{c.email}<br/><small>{c.phone}</small></td>
                       <td>
                          <span className={`${styles.badge} ${styles[`badge_${c.status}`]}`}>
                             {c.status.toUpperCase()}
                          </span>
                       </td>
                       <td>{new Date(c.created_at).toLocaleDateString()}</td>
                       <td>
                          {c.status === 'pending' && <button className={styles.btnApprove} onClick={() => updateStatus(c.id, 'active')}>Approve</button>}
                          {c.status === 'active' && <button className={styles.btnSuspend} onClick={() => updateStatus(c.id, 'suspended')}>Suspend</button>}
                          {c.status === 'suspended' && <button className={styles.btnApprove} onClick={() => updateStatus(c.id, 'active')}>Restore</button>}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </main>
    </div>
  );
}
