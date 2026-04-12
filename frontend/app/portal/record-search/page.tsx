'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import styles from './page.module.css';

interface BillRecord {
  id: string;
  patient_name: string;
  phone: string;
  amount: number;
  date: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BillRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // Mock search logic
    setHasSearched(true);
    if (!query) { setResults([]); return; }
    
    // Mock results for UI presentation
    setResults([
      { id: 'REC-1001', patient_name: 'Rahul Kumar', phone: '9876543210', amount: 500, date: new Date().toISOString() },
      { id: 'REC-1002', patient_name: 'Amit Sharma', phone: '9876543211', amount: 1200, date: new Date().toISOString() }
    ]);
  };

  return (
    <div className={styles.page}>
      <TopBar title="Search Medical Records" backHref="/portal/front-desk" />
      
      <main className={styles.main}>
        <div className={styles.searchBox}>
           <div className={styles.searchRow}>
             <input 
               type="text" 
               className={styles.searchInput} 
               placeholder="Search by Patient Name, Phone or Receipt No..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <button className="btn-primary" onClick={handleSearch}>Search</button>
           </div>
        </div>

        <div className={styles.resultsArea}>
           <div className={styles.sectionTitle}>
              Search Results
           </div>

           {hasSearched && results.length === 0 && (
             <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>🔍</div>
               <h3>No records found</h3>
               <p>Try searching with a different name or phone number.</p>
             </div>
           )}

           {results.length > 0 && (
             <div className={styles.resultsList}>
               {results.map((record) => (
                 <div key={record.id} className={styles.resultCard}>
                    <div className={styles.resultInfo}>
                       <div className={styles.resName}>{record.patient_name}</div>
                       <div className={styles.resMeta}>
                         <span>📞 {record.phone}</span>
                         <span>📅 {new Date(record.date).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className={styles.resAmount}>
                       ₹{record.amount}
                       <div className={styles.resId}>{record.id}</div>
                    </div>
                    <div className={styles.resActions}>
                       <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>View/Print</button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
