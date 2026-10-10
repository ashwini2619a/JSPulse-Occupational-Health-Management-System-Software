import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, Trash2, Shield, Clock, HardDrive, AlertTriangle, CheckCircle2, RefreshCw, Zap, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { saveBackupToIDB, getAllBackupsFromIDB, migrateLocalStorageBackupsToIDB } from '../../utils/backupDB';

const ALL_STORAGE_KEYS = [
  { key: 'cms_medstock_data', label: 'Medicine Stock Register' },
  { key: 'cms_medstock_data_columns', label: 'Medicine Stock (Columns)' },
  { key: 'cms_daily_opd_sheet', label: 'Daily OPD Tally' },
  { key: 'cms_daily_opd_sheet_columns', label: 'OPD Tally (Columns)' },
  { key: 'cms_patient_visit_log', label: 'Patient Visit Log' },
  { key: 'cms_patient_visit_log_columns', label: 'Patient Visit (Columns)' },
  { key: 'cms_medicine_incoming_data', label: 'Medicine Incoming Tracker' },
  { key: 'cms_medicine_incoming_data_columns', label: 'Medicine Incoming (Columns)' },
  { key: 'cms_injury_data', label: 'Injury Report Log' },
  { key: 'cms_injury_data_columns', label: 'Injury Report (Columns)' },
  { key: 'cms_vitals_data', label: 'Vital Signs Chart' },
  { key: 'cms_firstaidbox_data', label: 'First Aid Box Tracker' },
  { key: 'cms_ambulance_data', label: 'Emergency Ambulance Log' },
  { key: 'cms_shift_data', label: 'Shift Health Report' },
  { key: 'cms_emp_health_data', label: 'Employee Health Records' },
  { key: 'cms_ahc_data', label: 'Annual Health Checkup' },
  { key: 'cms_vaccination_data', label: 'Vaccination Records' },
  { key: 'cms_ppe_data', label: 'PPE Compliance Tracker' },
  { key: 'cms_bmw_data', label: 'Bio-Medical Waste Log' },
  { key: 'cms_occ_disease_data', label: 'Occupational Disease Registry' },
  { key: 'cms_health_cert_data', label: 'Health Certificate Tracker' },
  { key: 'cms_dispense_log', label: 'Dispensed Medicine Log' },
  { key: 'cms_billings_data', label: 'Billings & Financial Records' },
];

const AUTO_BACKUP_KEY = '_auto_backups';
const AUTO_BACKUP_ENABLED_KEY = '_auto_backup_enabled';
const AUTO_BACKUP_INTERVAL_KEY = '_auto_backup_interval';
const MAX_AUTO_BACKUPS = 3;

const DataBackupRestore = () => {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem('_last_backup_time') || null);
  const [storageStats, setStorageStats] = useState(() => getStorageStats());
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) !== 'false');
  const [autoBackupInterval, setAutoBackupInterval] = useState(() => parseInt(localStorage.getItem(AUTO_BACKUP_INTERVAL_KEY)) || 5);
  const [autoBackups, setAutoBackups] = useState([]);
  const [nextAutoBackup, setNextAutoBackup] = useState(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  function getStorageStats() {
    let totalSize = 0;
    let sheetCount = 0;
    const sheets = [];
    ALL_STORAGE_KEYS.forEach(({ key, label }) => {
      const val = localStorage.getItem(key);
      if (val) {
        const size = new Blob([val]).size;
        totalSize += size;
        sheetCount++;
        let recordCount = 0;
        try { const p = JSON.parse(val); if (Array.isArray(p)) recordCount = p.length; } catch (e) {}
        sheets.push({ key, label, size, recordCount });
      }
    });
    return { totalSize, sheetCount, sheets };
  }

  const loadAutoBackups = useCallback(async () => {
    try {
      const backups = await getAllBackupsFromIDB();
      setAutoBackups(backups);
    } catch (e) {
      console.error('Failed to load auto-backups from IndexedDB:', e);
      setAutoBackups([]);
    }
  }, []);

  const refreshStats = () => { setStorageStats(getStorageStats()); loadAutoBackups(); };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const createSnapshot = useCallback(() => {
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('_')) {
        snapshot[key] = localStorage.getItem(key);
      }
    }
    return snapshot;
  }, []);

  // --- Auto Backup Logic (now uses IndexedDB instead of localStorage) ---
  const runAutoBackup = useCallback(async () => {
    try {
      const snapshot = createSnapshot();
      const entry = await saveBackupToIDB(snapshot, MAX_AUTO_BACKUPS);
      await loadAutoBackups();
      setStatus(`⚡ Auto-backup saved (${entry.keysCount} keys) at ${new Date().toLocaleTimeString()}`);
      setStatusType('success');
      setTimeout(() => setStatus(''), 4000);
    } catch (e) {
      console.error('Auto-backup failed:', e);
      setStatus('❌ Auto-backup failed: ' + e.message);
      setStatusType('error');
    }
  }, [createSnapshot, loadAutoBackups]);

  // Migrate old localStorage backups to IndexedDB on mount
  useEffect(() => {
    migrateLocalStorageBackupsToIDB().then(() => loadAutoBackups());
  }, [loadAutoBackups]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (autoBackupEnabled) {
      const ms = autoBackupInterval * 60 * 1000;
      setNextAutoBackup(Date.now() + ms);

      timerRef.current = setInterval(() => {
        runAutoBackup();
        setNextAutoBackup(Date.now() + ms);
      }, ms);

      countdownRef.current = setInterval(() => {
        setNextAutoBackup(prev => prev); // force re-render for countdown
      }, 1000);
    } else {
      setNextAutoBackup(null);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoBackupEnabled, autoBackupInterval, runAutoBackup]);

  const toggleAutoBackup = () => {
    const newVal = !autoBackupEnabled;
    setAutoBackupEnabled(newVal);
    localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, String(newVal));
  };

  const changeInterval = (mins) => {
    setAutoBackupInterval(mins);
    localStorage.setItem(AUTO_BACKUP_INTERVAL_KEY, String(mins));
  };

  const getCountdown = () => {
    if (!nextAutoBackup) return null;
    const diff = Math.max(0, nextAutoBackup - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  // --- Manual Backup ---
  const handleBackup = () => {
    try {
      const snapshot = createSnapshot();
      snapshot._backup_meta = JSON.stringify({
        createdAt: new Date().toISOString(),
        appVersion: 'Jindal Steel Health System v2.0',
        keysCount: Object.keys(snapshot).length
      });
      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jindal_Steel_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toLocaleString();
      localStorage.setItem('_last_backup_time', now);
      setLastBackup(now);
      setStatus(`✅ Backup downloaded! ${Object.keys(snapshot).length} keys exported.`);
      setStatusType('success');
    } catch (err) {
      setStatus('❌ Backup failed: ' + err.message);
      setStatusType('error');
    }
  };

  // --- Restore from file ---
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        const keys = Object.keys(backup).filter(k => !k.startsWith('_'));
        if (keys.length === 0) { setStatus('❌ Invalid backup file.'); setStatusType('error'); return; }
        if (!window.confirm(`Restore ${keys.length} data keys? ⚠️ This will OVERWRITE current data.`)) return;
        keys.forEach(key => localStorage.setItem(key, backup[key]));
        setStatus(`✅ Restored ${keys.length} keys! Refresh the page to see changes.`);
        setStatusType('success');
        refreshStats();
      } catch (err) {
        setStatus('❌ Failed to parse: ' + err.message);
        setStatusType('error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Restore from auto-backup ---
  const restoreAutoBackup = (backup) => {
    const time = new Date(backup.timestamp).toLocaleString();
    if (!window.confirm(`Restore auto-backup from ${time}?\n\n${backup.keysCount} keys.\n⚠️ This will OVERWRITE current data.`)) return;
    const keys = Object.keys(backup.data);
    keys.forEach(key => localStorage.setItem(key, backup.data[key]));
    setStatus(`✅ Restored auto-backup from ${time}! Refresh the page.`);
    setStatusType('success');
    refreshStats();
  };

  // --- Download auto-backup as file ---
  const downloadAutoBackup = (backup) => {
    const data = { ...backup.data, _backup_meta: JSON.stringify({ createdAt: backup.timestamp, type: 'auto-backup' }) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Temper_Health_AutoBackup_${backup.timestamp.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Clear All ---
  const handleClearAll = () => {
    const confirm = prompt('⚠️ DANGER: Type "DELETE ALL DATA" to confirm:');
    if (confirm !== 'DELETE ALL DATA') { setStatus('Cancelled.'); setStatusType('info'); return; }
    ALL_STORAGE_KEYS.forEach(({ key }) => { localStorage.removeItem(key); localStorage.removeItem(key + '_columns'); localStorage.removeItem(key + '_nextid'); });
    setStatus('🗑 All data cleared. Refresh the page.');
    setStatusType('error');
    refreshStats();
  };

  const cardStyle = { background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };

  return (
    <div className="animate-fade-in" style={{ padding: '32px', height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={30} color="#3b82f6" /> Data Backup & Restore
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Protect your clinic data with automatic and manual backups.</p>
        </div>

        {status && (
          <div style={{
            padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600, fontSize: '0.88rem',
            background: statusType === 'success' ? '#f0fdf4' : statusType === 'error' ? '#fef2f2' : '#eff6ff',
            color: statusType === 'success' ? '#166534' : statusType === 'error' ? '#991b1b' : '#1e40af',
            border: `1px solid ${statusType === 'success' ? '#86efac' : statusType === 'error' ? '#fca5a5' : '#93c5fd'}`,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {statusType === 'success' ? <CheckCircle2 size={16} /> : statusType === 'error' ? <AlertTriangle size={16} /> : null}
            {status}
          </div>
        )}

        {/* Auto-Backup Section */}
        <div style={{ ...cardStyle, marginBottom: '20px', background: autoBackupEnabled ? '#f0fdf4' : '#f8fafc', border: autoBackupEnabled ? '1px solid #86efac' : '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: autoBackupEnabled ? '#dcfce7' : '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                <Zap size={22} color={autoBackupEnabled ? '#16a34a' : '#94a3b8'} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Automatic Backup</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {autoBackupEnabled 
                    ? `Saving every ${autoBackupInterval} min · Next: ${getCountdown() || 'soon'}` 
                    : 'Currently disabled'}
                </p>
              </div>
            </div>
            <button onClick={toggleAutoBackup} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {autoBackupEnabled 
                ? <ToggleRight size={40} color="#16a34a" />
                : <ToggleLeft size={40} color="#94a3b8" />
              }
            </button>
          </div>

          {autoBackupEnabled && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Interval:</span>
              {[1, 5, 10, 15, 30].map(mins => (
                <button 
                  key={mins}
                  onClick={() => changeInterval(mins)}
                  style={{ 
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    background: autoBackupInterval === mins ? '#2563eb' : '#e2e8f0',
                    color: autoBackupInterval === mins ? 'white' : '#475569'
                  }}
                >
                  {mins}m
                </button>
              ))}
              <button 
                onClick={runAutoBackup}
                style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Zap size={14} /> Backup Now
              </button>
            </div>
          )}

          {autoBackups.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Recent Auto-Backups (last {MAX_AUTO_BACKUPS}):</div>
              {autoBackups.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: i === 0 ? '#eff6ff' : '#f8fafc', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                    <Clock size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {new Date(b.timestamp).toLocaleString()} — {b.keysCount} keys
                    {i === 0 && <span style={{ marginLeft: '8px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>LATEST</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => downloadAutoBackup(b)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Download size={12} /> Save
                    </button>
                    <button onClick={() => restoreAutoBackup(b)} style={{ padding: '4px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Upload size={12} /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Backup + Restore */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px' }}><Download size={20} color="#3b82f6" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Manual Backup</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Download as JSON file</p>
              </div>
            </div>
            <button onClick={handleBackup} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onMouseOver={e => e.currentTarget.style.background = '#2563eb'} onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}>
              <Download size={16} /> Download Backup
            </button>
            {lastBackup && <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>Last: {lastBackup}</div>}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '10px' }}><Upload size={20} color="#10b981" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Restore from File</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Upload a JSON backup</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onMouseOver={e => e.currentTarget.style.background = '#059669'} onMouseOut={e => e.currentTarget.style.background = '#10b981'}>
              <Upload size={16} /> Upload & Restore
            </button>
          </div>
        </div>

        {/* Storage Stats */}
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={18} color="#6366f1" /> Storage Overview
            </h3>
            <button onClick={refreshStats} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{storageStats.sheetCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Sheets</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{formatBytes(storageStats.totalSize)}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Data Size</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{storageStats.sheets.reduce((s, sh) => s + sh.recordCount, 0)}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Records</div>
            </div>
          </div>
          {storageStats.sheets.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Sheet</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Records</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Size</th>
                </tr>
              </thead>
              <tbody>
                {storageStats.sheets.map(s => (
                  <tr key={s.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 10px', color: '#1e293b' }}>{s.label}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569' }}>{s.recordCount || '—'}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569' }}>{formatBytes(s.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ background: '#fef2f2', borderRadius: '14px', padding: '20px', border: '1px solid #fca5a5' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> Danger Zone
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.8rem', margin: '0 0 12px' }}>Permanently delete ALL clinic data. Create a backup first!</p>
          <button onClick={handleClearAll} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={14} /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataBackupRestore;
