'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useClinic } from '@/context/ClinicContext';
import DashboardLayout from '@/components/DashboardLayout';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const priorityConfig = {
  urgent:  { label: '🔴 Urgent',  color: '#ef4444', bg: '#fff1f2' },
  elderly: { label: '🟡 Elderly', color: '#f59e0b', bg: '#fffbeb' },
  normal:  { label: '⚪ Normal',  color: '#94a3b8', bg: '#f8fafc' },
};

const statusConfig = {
  waiting:  { label: 'Waiting',  color: '#f59e0b', bg: '#fffbeb' },
  serving:  { label: 'Serving',  color: '#10b981', bg: '#ecfdf5' },
  done:     { label: 'Done',     color: '#64748b', bg: '#f1f5f9' },
  skipped:  { label: 'Skipped',  color: '#ef4444', bg: '#fff1f2' },
};

interface QueueEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  token_number: number;
  status: 'waiting' | 'serving' | 'done' | 'skipped';
  priority: 'normal' | 'urgent' | 'elderly';
  check_in_time: string;
  serving_started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  doctor_id: string | null;
}

interface PatientResult {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  contact?: string;
}

export default function QueueManagerPage() {
  const { clinic, doctors } = useClinic();
  const supabase = createClient();

  const [queue, setQueue]         = useState<QueueEntry[]>([]);
  const [doneQueue, setDoneQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [showDone, setShowDone]   = useState(false);

  // Add-to-queue form
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState(doctors?.[0]?.id ?? '');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'elderly'>('normal');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Fetch queue ────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ clinic_id: clinic.id });
      const res = await fetch(`${API}/api/queue?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Separate active vs done
      const active = json.queue.filter((q: QueueEntry) => q.status !== 'done' && q.status !== 'skipped');
      
      // Fetch done separately
      const { data: done } = await supabase
        .from('doctor_queue')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('queue_date', new Date().toISOString().split('T')[0])
        .in('status', ['done', 'skipped'])
        .order('completed_at', { ascending: false })
        .limit(20);

      setQueue(active);
      setDoneQueue(done || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clinic, supabase]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // ── Realtime ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clinic?.id) return;
    const channel = supabase
      .channel('queue-manager-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'doctor_queue',
        filter: `clinic_id=eq.${clinic.id}`
      }, fetchQueue)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinic?.id, supabase, fetchQueue]);

  // ── Patient search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTerm.length < 2) { setSearchResults([]); return; }
    const delay = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, name, age, gender, contact')
        .eq('clinic_id', clinic?.id ?? '')
        .or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
        .limit(6);
      setSearchResults(data || []);
    }, 280);
    return () => clearTimeout(delay);
  }, [searchTerm, clinic, supabase]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Add patient to queue ─────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !clinic?.id) {
      setAddError('Please select a patient first.');
      return;
    }
    setAdding(true);
    setAddError('');
    setAddSuccess('');
    try {
      const res = await fetch(`${API}/api/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinic.id,
          doctor_id: selectedDoctor || null,
          patient_id: selectedPatient.id,
          patient_name: selectedPatient.name,
          priority,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAddSuccess(`${selectedPatient.name} added as Token #${json.token}`);
      setSelectedPatient(null);
      setSearchTerm('');
      setPriority('normal');
      setNotes('');
      fetchQueue();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  // ── Remove from queue ────────────────────────────────────────────────
  const removeEntry = async (id: string) => {
    setActionId(id);
    try {
      await fetch(`${API}/api/queue/${id}`, { method: 'DELETE' });
      fetchQueue();
    } finally {
      setActionId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionId(id);
    try {
      await fetch(`${API}/api/queue/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchQueue();
    } finally { setActionId(null); }
  };

  const updatePriority = async (id: string, p: string) => {
    setActionId(id);
    try {
      await fetch(`${API}/api/queue/${id}/priority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: p }),
      });
      fetchQueue();
    } finally { setActionId(null); }
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const serving = queue.find(q => q.status === 'serving');

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Queue Manager</h1>
            <p className={styles.pageSubtitle}>
              Manage today's patient queue — add, reprioritise, or remove patients
            </p>
          </div>
          <div className={styles.statPills}>
            <span className={styles.statPill}><strong>{waiting.length}</strong>&nbsp;Waiting</span>
            {serving && <span className={styles.statPillGreen}><strong>1</strong>&nbsp;Now Serving</span>}
            <span className={styles.statPillBlue}><strong>{doneQueue.length}</strong>&nbsp;Done</span>
          </div>
        </div>

        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        <div className={styles.layout}>

          {/* ── Left: Current Queue ────────────────────────────── */}
          <div className={styles.queueCol}>
            <h3 className={styles.colTitle}>Today's Queue</h3>

            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner}/></div>
            ) : queue.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No patients in queue yet. Add the first patient →</p>
              </div>
            ) : (
              <div className={styles.queueList}>
                {/* Serving patient first */}
                {serving && (
                  <div className={`${styles.queueRow} ${styles.servingRow}`} key={serving.id}>
                    <div className={styles.tokenCol}>
                      <div className={styles.tokenBadge} style={{ background: '#10b981' }}>
                        #{serving.token_number}
                      </div>
                    </div>
                    <div className={styles.rowInfo}>
                      <p className={styles.rowName}>{serving.patient_name}</p>
                      <p className={styles.rowMeta}>
                        <span className={styles.statusBadge} style={{ color: statusConfig.serving.color, background: statusConfig.serving.bg }}>
                          ● Serving
                        </span>
                        &nbsp;
                        <span style={{ color: priorityConfig[serving.priority].color }}>
                          {priorityConfig[serving.priority].label}
                        </span>
                      </p>
                      {serving.notes && <p className={styles.rowNote}>📝 {serving.notes}</p>}
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.btnDone}
                        onClick={() => updateStatus(serving.id, 'done')}
                        disabled={actionId === serving.id}
                      >Done</button>
                    </div>
                  </div>
                )}

                {/* Waiting patients */}
                {waiting.map((entry, idx) => (
                  <div key={entry.id} className={styles.queueRow}>
                    <div className={styles.tokenCol}>
                      <div className={styles.tokenBadge} style={{ background: priorityConfig[entry.priority].color }}>
                        #{entry.token_number}
                      </div>
                    </div>
                    <div className={styles.rowInfo}>
                      <p className={styles.rowName}>{entry.patient_name}</p>
                      <p className={styles.rowMeta}>
                        <span className={styles.posTag}>Position {idx + 1}</span>
                        &nbsp;·&nbsp;
                        <span style={{ color: priorityConfig[entry.priority].color }}>
                          {priorityConfig[entry.priority].label}
                        </span>
                      </p>
                      {entry.notes && <p className={styles.rowNote}>📝 {entry.notes}</p>}
                    </div>
                    <div className={styles.rowActions}>
                      {/* Priority changer */}
                      <select
                        className={styles.prioritySelect}
                        value={entry.priority}
                        onChange={(e) => updatePriority(entry.id, e.target.value)}
                        disabled={!!actionId}
                      >
                        <option value="normal">Normal</option>
                        <option value="elderly">Elderly</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <button
                        className={styles.btnSkip}
                        onClick={() => updateStatus(entry.id, 'skipped')}
                        disabled={!!actionId}
                        title="Skip patient"
                      >Skip</button>
                      <button
                        className={styles.btnRemove}
                        onClick={() => removeEntry(entry.id)}
                        disabled={!!actionId}
                        title="Remove from queue"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed patients toggle */}
            {doneQueue.length > 0 && (
              <div className={styles.doneSection}>
                <button
                  className={styles.doneToggle}
                  onClick={() => setShowDone(v => !v)}
                >
                  {showDone ? '▲' : '▼'}&nbsp;Completed Patients ({doneQueue.length})
                </button>
                {showDone && (
                  <div className={styles.doneList}>
                    {doneQueue.map(entry => (
                      <div key={entry.id} className={styles.doneRow}>
                        <span className={styles.doneToken}>#{entry.token_number}</span>
                        <span className={styles.doneName}>{entry.patient_name}</span>
                        <span
                          className={styles.statusBadge}
                          style={{ color: statusConfig[entry.status].color, background: statusConfig[entry.status].bg }}
                        >
                          {statusConfig[entry.status].label}
                        </span>
                        <span className={styles.doneTime}>
                          {entry.completed_at
                            ? new Date(entry.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Add to Queue Form ─────────────────────── */}
          <div className={styles.formCol}>
            <h3 className={styles.colTitle}>Add Patient to Queue</h3>

            <form className={styles.addForm} onSubmit={handleAdd}>
              {/* Patient search */}
              <div className={styles.fieldGroup} ref={searchRef}>
                <label className={styles.fieldLabel}>Patient *</label>
                {selectedPatient ? (
                  <div className={styles.selectedPatient}>
                    <div className={styles.selAvatar}>{selectedPatient.name[0]}</div>
                    <div className={styles.selInfo}>
                      <p className={styles.selName}>{selectedPatient.name}</p>
                      <p className={styles.selMeta}>{selectedPatient.age}Y · {selectedPatient.gender} · {selectedPatient.contact}</p>
                    </div>
                    <button type="button" className={styles.clearBtn} onClick={() => { setSelectedPatient(null); setSearchTerm(''); }}>✕</button>
                  </div>
                ) : (
                  <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search by name or phone…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      autoComplete="off"
                    />
                    {searchResults.length > 0 && (
                      <div className={styles.searchDropdown}>
                        {searchResults.map(p => (
                          <div
                            key={p.id}
                            className={styles.searchItem}
                            onClick={() => { setSelectedPatient(p); setSearchTerm(''); setSearchResults([]); }}
                          >
                            <div className={styles.siAvatar}>{p.name[0]}</div>
                            <div>
                              <p className={styles.siName}>{p.name}</p>
                              <p className={styles.siMeta}>{p.age}Y · {p.gender} · {p.contact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Doctor selector */}
              {doctors && doctors.length > 0 && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Doctor</label>
                  <select
                    className={styles.selectField}
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Priority</label>
                <div className={styles.priorityButtons}>
                  {(['normal', 'elderly', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.priorityBtn} ${priority === p ? styles.priorityBtnActive : ''}`}
                      style={priority === p ? { borderColor: priorityConfig[p].color, background: priorityConfig[p].bg } : {}}
                      onClick={() => setPriority(p)}
                    >
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Front Desk Note <span className={styles.optional}>(optional)</span></label>
                <textarea
                  className={styles.textareaField}
                  placeholder="e.g. Follow-up, high BP, walk-in…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {addSuccess && <div className={styles.successMsg}>✅ {addSuccess}</div>}
              {addError   && <div className={styles.errorMsg}>⚠️ {addError}</div>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={adding || !selectedPatient}
              >
                {adding ? 'Adding…' : '+ Add to Queue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
