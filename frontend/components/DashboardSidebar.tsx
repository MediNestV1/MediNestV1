'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useClinic } from '@/context/ClinicContext';
import styles from './DashboardSidebar.module.css';

const navItems = [
  { 
    label: 'Dashboard', 
    href: '/portal/doctor', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> 
  },
  { 
    label: 'Patients', 
    href: '/portal/doctor/patients', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
  },
  { 
    label: 'Prescriptions', 
    href: '/portal/prescription', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { doctors } = useClinic();
  const supabase = createClient();
  
  const activeDoctorName = doctors && doctors.length > 0 ? doctors[0].name : 'Doctor';

  // --- Search Logic ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (data) setSearchResults(data);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, supabase]);

  const quickActions = [
    { label: 'Register New Patient', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>, href: `/portal/prescription?doctorName=${encodeURIComponent(activeDoctorName)}` },
    { label: 'Digital Prescription', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>, href: `/portal/prescription?doctorName=${encodeURIComponent(activeDoctorName)}` },
    { label: 'Discharge Summary', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>, href: '/portal/summary' },
    { label: 'View Patients Hub', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, href: '/portal/doctor/patients' },
  ];

  const frontDeskActions = [
    { label: 'Patient Lobby', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, href: '/portal/receptionist' },
    { label: 'Billing & Invoices', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>, href: '/portal/billing' },
    { label: 'Day Summary', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>, href: '/portal/summary' },
  ];


  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.logoContainer}>
            <img src="/assets/medinest_logo.png" alt="MediNest Logo" className={styles.brandLogo} />
          </div>
          <div className={styles.brandInfo}>
            <h1>MediNest</h1>
            <p>Doctors Desk</p>
          </div>
          {/* Mobile close button */}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a 
                key={item.label} 
                href={item.href}
                onClick={handleNavClick}
                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            );
          })}

          {/* --- Doctor's Clinical Desk Section --- */}
          <div className={styles.clinicalDesk}>
            <div className={styles.deskHeader}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
              <span>Clinical Desk</span>
            </div>

            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.searchIcon}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Find Patient..."
                  className={styles.searchField}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchTerm.length >= 2 && (
                <div className={styles.searchResults}>
                  {isSearching ? (
                    <div className={styles.searchMsg}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          className={styles.searchItem} 
                          onMouseDown={(e) => { e.preventDefault(); }}
                          onClick={() => { window.location.href = `/portal/doctor/patients/${p.id}`; handleNavClick(); }}
                        >
                          <p className={styles.searchItemName}>{p.name}</p>
                          <p className={styles.searchItemInfo}>{p.contact}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className={styles.searchMsg}>No results found</div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.deskActions}>
              {quickActions.map((action) => (
                <a key={action.label} href={action.href} onClick={handleNavClick} className={styles.deskAction}>
                  {action.icon}
                  <span>{action.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* --- Front Desk Section --- */}
          <div className={styles.clinicalDesk} style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
            <div className={styles.deskHeader}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Front Desk</span>
            </div>
            <div className={styles.deskActions}>
              {frontDeskActions.map((action) => (
                <a key={action.label} href={action.href} onClick={handleNavClick} className={styles.deskAction}>
                  {action.icon}
                  <span>{action.label}</span>
                </a>
              ))}
            </div>
          </div>

        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/support" className={styles.footerLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Help
          </a>
          <a href="/auth/logout" className={`${styles.footerLink} ${styles.logoutLink}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout
          </a>
        </div>
      </aside>
    </>
  );
}
