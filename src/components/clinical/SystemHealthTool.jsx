import { useState, useEffect, useCallback } from 'react';
import { Activity, HardDrive, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Zap, Shield, Wrench, RotateCcw, Info } from 'lucide-react';
import { estimateLocalStorageQuota, freeLocalStorageSpace, clearAllBackupsFromIDB, migrateLocalStorageBackupsToIDB } from '../../utils/backupDB';
import { getSheetData, saveSheetData } from '../../utils/sheetDB';

const flowNodeStyle = (borderLeftColor, borderColor, bgLightColor, width = '260px') => ({
  background: '#1e293b',
  border: `1px solid #334155`,
  borderLeft: `4px solid ${borderLeftColor}`,
  padding: '10px 14px',
  borderRadius: '8px',
  width: width,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
  position: 'relative',
  zIndex: 2
});

const flowArrowStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  margin: '4px 0',
  width: '100%'
};

const flowBadgeStyle = (bgColor, textColor) => ({
  fontSize: '0.62rem',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
  background: bgColor,
  color: textColor,
  marginTop: '2px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

const ALL_STORAGE_KEYS = [
  'cms_medstock_data', 'cms_daily_opd_sheet', 'cms_patient_visit_log',
  'cms_medicine_incoming_data', 'cms_injury_data', 'cms_vitals_data',
  'cms_firstaidbox_data', 'cms_ambulance_data', 'cms_shift_data',
  'cms_emp_health_data', 'cms_ahc_data', 'cms_vaccination_data',
  'cms_ppe_data', 'cms_bmw_data', 'cms_occ_disease_data',
  'cms_health_cert_data', 'cms_dispense_log', 'cms_billings_data',
  'cms_custom_sheets'
];

const SystemHealthTool = () => {
  const [quota, setQuota] = useState(() => estimateLocalStorageQuota());
  const [healthChecks, setHealthChecks] = useState([]);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState(null);
  const [lastFixTime, setLastFixTime] = useState(() => localStorage.getItem('_last_health_fix_time') || null);
  const [showFlowModal, setShowFlowModal] = useState(false);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const runHealthChecks = useCallback(async () => {
    const checks = [];
    const q = estimateLocalStorageQuota();
    setQuota(q);

    // 1. Storage Quota Check
    if (q.percentUsed >= 90) {
      checks.push({ id: 'quota', status: 'critical', label: 'Storage Quota', detail: `${q.percentUsed}% used — CRITICAL! Sheets may stop saving.`, fixable: true });
    } else if (q.percentUsed >= 70) {
      checks.push({ id: 'quota', status: 'warning', label: 'Storage Quota', detail: `${q.percentUsed}% used — getting full.`, fixable: true });
    } else {
      checks.push({ id: 'quota', status: 'ok', label: 'Storage Quota', detail: `${q.percentUsed}% used (${formatBytes(q.used)} / ${formatBytes(q.total)})`, fixable: false });
    }

    // 2. Old Auto-Backup in localStorage check
    const oldBackup = localStorage.getItem('_auto_backups');
    if (oldBackup) {
      const size = oldBackup.length * 2;
      checks.push({ id: 'old_backups', status: 'critical', label: 'Legacy Backups in Storage', detail: `Old auto-backups consuming ${formatBytes(size)} in localStorage!`, fixable: true });
    } else {
      checks.push({ id: 'old_backups', status: 'ok', label: 'Legacy Backups', detail: 'No legacy backups in localStorage.', fixable: false });
    }

    // 3. Data Integrity Check (IndexedDB & LocalStorage)
    const keysToCheck = [];

    ALL_STORAGE_KEYS.forEach(baseKey => {
      keysToCheck.push(baseKey);
      try {
        const savedIndex = localStorage.getItem(`${baseKey}_tabs_index`);
        if (savedIndex) {
          const parsed = JSON.parse(savedIndex);
          if (Array.isArray(parsed)) {
            parsed.forEach(t => {
              if (t && t.storageKey && !keysToCheck.includes(t.storageKey)) {
                keysToCheck.push(t.storageKey);
              }
            });
          }
        }
      } catch { /* ignore */ }
    });

    const integrityResults = await Promise.all(
      keysToCheck.map(async (key) => {
        try {
          const data = await getSheetData(key);
          if (data && !Array.isArray(data)) {
            return { key, status: 'corrupted' };
          }
          return { key, status: 'ok' };
        } catch {
          return { key, status: 'error' };
        }
      })
    );

    const corruptedList = integrityResults.filter(r => r.status === 'corrupted' || r.status === 'error');
    const corruptedKeys = corruptedList.length;

    if (corruptedKeys > 0) {
      checks.push({ id: 'integrity', status: 'critical', label: 'Database Integrity', detail: `${corruptedKeys} sheet database(s) have corrupted/unreadable records.`, fixable: true });
    } else {
      checks.push({ id: 'integrity', status: 'ok', label: 'Database Integrity', detail: 'All sheet databases are valid and loadable.', fixable: false });
    }

    // 4. Orphaned Keys Check
    let orphanCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_nextid')) {
        const baseKey = key.replace('_nextid', '');
        if (!localStorage.getItem(baseKey)) orphanCount++;
      }
    }
    if (orphanCount > 0) {
      checks.push({ id: 'orphans', status: 'warning', label: 'Orphaned Keys', detail: `${orphanCount} orphaned storage key(s) found.`, fixable: true });
    } else {
      checks.push({ id: 'orphans', status: 'ok', label: 'Orphaned Keys', detail: 'No orphaned keys found.', fixable: false });
    }

    // 5. Total key count
    checks.push({ id: 'keycount', status: 'info', label: 'Total Keys', detail: `${localStorage.length} keys in localStorage.`, fixable: false });

    setHealthChecks(checks);
    return checks;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runHealthChecks();
    // Also migrate legacy backups on mount
    migrateLocalStorageBackupsToIDB().then(migrated => {
      if (migrated) {
        runHealthChecks(); // Re-run checks after migration
      }
    });
  }, [runHealthChecks]);

  const handleFixAll = async () => {
    setIsFixing(true);
    setFixResults(null);
    const results = [];

    try {
      // 1. Migrate and remove old auto-backups from localStorage
      const migrated = await migrateLocalStorageBackupsToIDB();
      if (migrated) {
        results.push('✅ Migrated legacy auto-backups to IndexedDB');
      }

      // 2. Free orphaned keys and bloat
      const freedBytes = freeLocalStorageSpace();
      if (freedBytes > 0) {
        results.push(`✅ Freed ${formatBytes(freedBytes)} of orphaned data`);
      }

      // 3. Repair corrupted keys in IndexedDB & LocalStorage
      let repairedCount = 0;
      const keysToRepair = [];

      ALL_STORAGE_KEYS.forEach(baseKey => {
        keysToRepair.push(baseKey);
        try {
          const savedIndex = localStorage.getItem(`${baseKey}_tabs_index`);
          if (savedIndex) {
            const parsed = JSON.parse(savedIndex);
            if (Array.isArray(parsed)) {
              parsed.forEach(t => {
                if (t && t.storageKey && !keysToRepair.includes(t.storageKey)) {
                  keysToRepair.push(t.storageKey);
                }
              });
            }
          }
        } catch { /* ignore */ }
      });

      await Promise.all(
        keysToRepair.map(async (key) => {
          let needsRepair = false;
          try {
            const data = await getSheetData(key);
            if (data && !Array.isArray(data)) {
              needsRepair = true;
            }
          } catch {
            needsRepair = true;
          }

          if (needsRepair) {
            await saveSheetData(key, []);
            repairedCount++;
          }

          // Clean up legacy localstorage leftovers
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        })
      );

      if (repairedCount > 0) {
        results.push(`✅ Repaired ${repairedCount} corrupted sheet database(s)`);
      }

      // 4. Clear any stale temp keys
      const tempKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_temp_') || key.startsWith('cms_pending_'))) {
          tempKeys.push(key);
        }
      }
      tempKeys.forEach(k => localStorage.removeItem(k));
      if (tempKeys.length > 0) {
        results.push(`✅ Cleared ${tempKeys.length} temporary key(s)`);
      }

      if (results.length === 0) {
        results.push('✅ No issues found — system is healthy!');
      }

      const now = new Date().toLocaleString();
      localStorage.setItem('_last_health_fix_time', now);
      setLastFixTime(now);
    } catch (err) {
      results.push(`❌ Error during fix: ${err.message}`);
    }

    setFixResults(results);
    setIsFixing(false);
    runHealthChecks(); // Refresh checks
  };

  const handleForceReload = () => {
    if (window.confirm('This will reload the application. Any unsaved changes will be lost.\n\nContinue?')) {
      window.location.reload();
    }
  };

  const overallStatus = healthChecks.some(c => c.status === 'critical') ? 'critical'
    : healthChecks.some(c => c.status === 'warning') ? 'warning' : 'ok';

  const statusColors = {
    ok: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '#16a34a' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
    critical: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '#dc2626' },
    info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: '#3b82f6' }
  };

  const cardStyle = { background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };

  return (
    <div className="animate-fade-in" style={{ padding: '32px', height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 6px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wrench size={30} color="#6366f1" /> System Health & Bug Fixer
            <button 
              onClick={() => setShowFlowModal(true)}
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#3b82f6',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.color = '#3b82f6';
              }}
              title="View Automation Flow"
            >
              <Info size={18} />
            </button>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Diagnose and fix storage issues to keep your sheets running smoothly.</p>
        </div>

        {/* Overall Status Banner */}
        <div style={{
          padding: '16px 20px', borderRadius: '14px', marginBottom: '24px',
          background: statusColors[overallStatus].bg,
          border: `2px solid ${statusColors[overallStatus].border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {overallStatus === 'ok' ? <CheckCircle2 size={28} color={statusColors.ok.icon} /> :
             overallStatus === 'warning' ? <AlertTriangle size={28} color={statusColors.warning.icon} /> :
             <AlertTriangle size={28} color={statusColors.critical.icon} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: statusColors[overallStatus].text }}>
                {overallStatus === 'ok' ? 'System Healthy' : overallStatus === 'warning' ? 'Minor Issues Detected' : 'Critical Issues Found!'}
              </div>
              <div style={{ fontSize: '0.82rem', color: statusColors[overallStatus].text, opacity: 0.8 }}>
                {overallStatus === 'ok' ? 'All systems operating normally.' :
                 overallStatus === 'warning' ? 'Some issues detected. Click "Fix All Issues" to resolve.' :
                 'Storage is near capacity! Fix immediately to prevent data loss.'}
              </div>
            </div>
          </div>
          <button onClick={runHealthChecks} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: statusColors[overallStatus].text }}>
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Storage Meter */}
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px' }}><HardDrive size={20} color="#6366f1" /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Storage Usage</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>localStorage capacity: ~5 MB</p>
            </div>
            <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '1.2rem', color: quota.percentUsed >= 90 ? '#dc2626' : quota.percentUsed >= 70 ? '#f59e0b' : '#16a34a' }}>
              {quota.percentUsed}%
            </div>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '14px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: '8px',
              width: `${Math.min(quota.percentUsed, 100)}%`,
              background: quota.percentUsed >= 90 ? 'linear-gradient(90deg, #dc2626, #ef4444)' :
                          quota.percentUsed >= 70 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                          'linear-gradient(90deg, #6366f1, #818cf8)',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
            <span>Used: {formatBytes(quota.used)}</span>
            <span>Free: {formatBytes(quota.remaining)}</span>
          </div>
        </div>

        {/* Health Checks */}
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '10px' }}><Activity size={20} color="#16a34a" /></div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Health Checks</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {healthChecks.map(check => (
              <div key={check.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: statusColors[check.status]?.bg || '#f8fafc',
                border: `1px solid ${statusColors[check.status]?.border || '#e2e8f0'}`
              }}>
                {check.status === 'ok' ? <CheckCircle2 size={16} color={statusColors.ok.icon} /> :
                 check.status === 'warning' ? <AlertTriangle size={16} color={statusColors.warning.icon} /> :
                 check.status === 'critical' ? <AlertTriangle size={16} color={statusColors.critical.icon} /> :
                 <HardDrive size={16} color={statusColors.info.icon} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{check.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{check.detail}</div>
                </div>
                {check.fixable && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>FIXABLE</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fix All Button */}
        <div style={{ ...cardStyle, marginBottom: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '14px' }}>
              <Zap size={28} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>One-Click Bug Fixer</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.85 }}>
                Automatically clears storage bloat, repairs corrupted data, removes orphaned keys, and optimizes performance.
              </p>
            </div>
            <button
              onClick={handleFixAll}
              disabled={isFixing}
              style={{
                padding: '12px 24px', background: 'white', color: '#6366f1',
                border: 'none', borderRadius: '10px', cursor: isFixing ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isFixing ? 0.7 : 1, whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Wrench size={18} />
              {isFixing ? 'Fixing...' : 'Fix All Issues'}
            </button>
          </div>
          {lastFixTime && (
            <div style={{ marginTop: '12px', fontSize: '0.75rem', opacity: 0.7, textAlign: 'right' }}>
              Last fix: {lastFixTime}
            </div>
          )}
        </div>

        {/* Fix Results */}
        {fixResults && (
          <div style={{ ...cardStyle, marginBottom: '20px', background: '#f0fdf4', border: '1px solid #86efac' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> Fix Results
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {fixResults.map((r, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: '#166534' }}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}><RotateCcw size={20} color="#f59e0b" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Force Reload</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Restart the app if sheets are unresponsive</p>
              </div>
            </div>
            <button onClick={handleForceReload} style={{
              width: '100%', padding: '10px', background: '#f59e0b', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <RotateCcw size={16} /> Reload Application
            </button>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '10px' }}><Trash2 size={20} color="#dc2626" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Clear Backup Cache</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Remove all auto-backup snapshots</p>
              </div>
            </div>
            <button onClick={async () => {
              if (window.confirm('Clear all auto-backup snapshots from IndexedDB? Your actual data will NOT be affected.')) {
                await clearAllBackupsFromIDB();
                localStorage.removeItem('_auto_backups');
                runHealthChecks();
                setFixResults(prev => [...(prev || []), '✅ All backup cache cleared']);
              }
            }} style={{
              width: '100%', padding: '10px', background: '#dc2626', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <Trash2 size={16} /> Clear Backups
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #93c5fd', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={16} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e40af' }}>How it works</span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.6 }}>
              <li><strong>Storage Bloat:</strong> Auto-backups used to be stored inside localStorage (5MB limit). They are now moved to IndexedDB (50MB+).</li>
              <li><strong>Orphaned Keys:</strong> Deleted sheet tabs can leave behind stale keys. The fixer removes them.</li>
              <li><strong>Corrupted Data:</strong> If a JSON key is malformed, it gets reset to an empty array so the app can function.</li>
              <li><strong>Auto-Recovery:</strong> If storage fills up during editing, the system auto-clears bloat and retries saving.</li>
            </ul>
          </div>
          <button 
            onClick={() => setShowFlowModal(true)}
            style={{
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
            title="View Automation Flow"
          >
            <Info size={16} /> View Automation Flow
          </button>
        </div>
      </div>

      {/* Modal for Automation Flow */}
      {showFlowModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '680px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px' }}>
                  <Info size={20} color="#3b82f6" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  Clinical Automation Pipeline
                </h3>
              </div>
              <button 
                onClick={() => setShowFlowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Native Flowchart Diagram */}
              <div style={{ 
                background: '#0f172a', 
                padding: '24px', 
                borderRadius: '16px', 
                marginBottom: '20px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                color: '#f8fafc',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <h4 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', textAlign: 'center' }}>
                  Clinical Automation Pipeline Flowchart
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                  
                  {/* Step 1: OPD Card Form */}
                  <div style={flowNodeStyle('#0284c7', '#38bdf8', 'rgba(14, 165, 233, 0.15)')}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>📋</span> OPD Card Form
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                      Vitals & symptoms input interface
                    </div>
                  </div>

                  {/* Arrow 1 */}
                  <div style={flowArrowStyle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                      <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                    <span style={flowBadgeStyle('#0284c7', '#e0f2fe')}>Instant Save</span>
                  </div>

                  {/* Step 2: Daily OPD Log */}
                  <div style={flowNodeStyle('#059669', '#34d399', 'rgba(16, 185, 129, 0.15)')}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>📖</span> Daily OPD Log
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                      Central database clinical visits ledger
                    </div>
                  </div>

                  {/* Fork 1 */}
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', margin: '10px 0', gap: '20px', flexWrap: 'wrap' }}>
                    
                    {/* Left path: Dashboard */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '160px' }}>
                      <div style={{ ...flowArrowStyle, height: '40px' }}>
                        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke="#c084fc" strokeWidth="2">
                          <path d="M17 5L5 25M5 25h10M5 25V15" />
                        </svg>
                        <span style={flowBadgeStyle('#7c3aed', '#f3e8ff')}>2s Auto-Poll</span>
                      </div>
                      <div style={flowNodeStyle('#7c3aed', '#c084fc', 'rgba(139, 92, 246, 0.15)', '100%')}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📊</span> OPD Dashboard
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                          Tally & demographic counters
                        </div>
                      </div>
                    </div>

                    {/* Right path: Dispense Log */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '160px' }}>
                      <div style={{ ...flowArrowStyle, height: '40px' }}>
                        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke="#fbbf24" strokeWidth="2">
                          <path d="M7 5l12 20M19 25H9M19 25V15" />
                        </svg>
                        <span style={flowBadgeStyle('#d97706', '#fef3c7')}>10s Auto-Sync</span>
                      </div>
                      <div style={flowNodeStyle('#d97706', '#fbbf24', 'rgba(245, 158, 11, 0.15)', '100%')}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💊</span> Dispense Log
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                          Active medication handouts
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Down path from Dispense Log */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    
                    {/* Arrow 2 */}
                    <div style={flowArrowStyle}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                      <span style={flowBadgeStyle('#0d9488', '#ccfbf1')}>10s Auto-Extract</span>
                    </div>

                    {/* Step 3: Daily Consume Log */}
                    <div style={flowNodeStyle('#0d9488', '#2dd4bf', 'rgba(13, 148, 136, 0.15)')}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>📦</span> Daily Consume Log
                      </div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                        Consolidated pushed daily quantities
                      </div>
                    </div>

                  </div>

                  {/* Fork 2 */}
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', margin: '10px 0', gap: '20px', flexWrap: 'wrap' }}>
                    
                    {/* Left: Stock Register */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '160px' }}>
                      <div style={{ ...flowArrowStyle, height: '40px' }}>
                        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke="#f87171" strokeWidth="2">
                          <path d="M17 5L5 25M5 25h10M5 25V15" />
                        </svg>
                        <span style={flowBadgeStyle('#dc2626', '#fee2e2')}>15s Auto-Deduct</span>
                      </div>
                      <div style={flowNodeStyle('#dc2626', '#f87171', 'rgba(220, 38, 38, 0.15)', '100%')}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🩺</span> Medicine Stock
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                          Deducts inventory counts
                        </div>
                      </div>
                    </div>

                    {/* Right: Monthly Balance Ledger */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '160px' }}>
                      <div style={{ ...flowArrowStyle, height: '40px' }}>
                        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" stroke="#34d399" strokeWidth="2">
                          <path d="M7 5l12 20M19 25H9M19 25V15" />
                        </svg>
                        <span style={flowBadgeStyle('#059669', '#d1fae5')}>15s Auto-Sync</span>
                      </div>
                      <div style={flowNodeStyle('#059669', '#34d399', 'rgba(5, 150, 105, 0.15)', '100%')}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📅</span> Monthly Balance
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                          Updates financial statements
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Explanations */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.78rem', lineHeight: 1.5, color: '#475569' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Pipeline Summary:</div>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>OPD Card Form:</strong> Standard patient vitals & details input. Saves instantly into the main database.</li>
                  <li><strong>Daily OPD Log:</strong> Central ledger used by the counter dashboard (polled every 2s) and dispensing log (synced every 10s).</li>
                  <li><strong>Dispense Log & Daily Consume:</strong> Prescribed medicines are pushed here and consolidated every 10s.</li>
                  <li><strong>Stock & Ledger Deduction:</strong> Quantities are automatically deducted from the Inventory and synced to Monthly Ledger balances every 15s.</li>
                </ul>
              </div>

              {/* JSPulse Description & Developer Credit */}
              <div style={{ marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  JSPulse OHMS (Occupational Health Management System)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 10px', maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto' }}>
                  JSPulse is a premium occupational health portal engineered for high-throughput industrial plant clinics, integrating patient logs, live stock ledgers, vital sign tracking, and automatic resource deduction.
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  Developed by <span style={{ color: '#2563eb', fontWeight: 700 }}>Ashwini Kumar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthTool;
