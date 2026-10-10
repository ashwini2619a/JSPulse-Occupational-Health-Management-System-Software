import React, { useEffect, useState, useCallback, useRef } from 'react';
import ExcelGrid from './clinical/ExcelGrid';
import { ArrowRightLeft, Zap, RefreshCw } from 'lucide-react';
import { getSheetData, saveSheetData } from '../utils/sheetDB';

const capitalizeName = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const parseMedicineLine = (line) => {
  let cleaned = line.trim();
  // Strip list prefixes like "1. ", "2) ", "* ", etc.
  cleaned = cleaned.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '');
  cleaned = cleaned.trim();
  if (!cleaned) return null;

  // Look for common frequency markers
  const freqRegex = /\b(bd|bid|tds|tid|od|qid|sos|hs|twice|thrice|once|daily|after\s+food|before\s+food|ac|pc|1x2|1x3|1x1|1x4)\b/i;
  const match = cleaned.match(freqRegex);
  
  if (match) {
    const idx = match.index;
    const medName = cleaned.substring(0, idx).replace(/[\-\s\.,]+$/, '').trim();
    const dosage = cleaned.substring(idx).trim();
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // If no frequency marker, check if there's a trailing quantity like "x 10", "- 10", "10 tabs"
  const qtyRegex = /(?:\s+x\s*|\s*\-\s*|\s+)(\d+)\s*(?:tabs|tablets|caps|capsules|amp|amps|vials|pcs|pieces|bottles|ml|vial|tablet|capsule)\b/i;
  const qtyMatch = cleaned.match(qtyRegex);
  if (qtyMatch) {
    const idx = qtyMatch.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch[1]; // just the quantity
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  const qtyMatch2 = cleaned.match(/(?:\s+x\s*|\s*\-\s*)(\d+)\s*$/i);
  if (qtyMatch2) {
    const idx = qtyMatch2.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch2[1];
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // Default fallback: entire line is name, dosage is '1'
  return {
    name: capitalizeName(cleaned),
    dosage: '1'
  };
};

const columns = [
  { key: 'date', label: 'Date', letter: 'A', width: 120, type: 'date' },
  { key: 'patientName', label: "Patient's Name", letter: 'B', width: 200, type: 'text' },
  { key: 'gender', label: 'Gender', letter: 'C', width: 100, type: 'select', options: ['Male', 'Female', 'Other', 'Child'] },
  { key: 'age', label: 'Age', letter: 'D', width: 80, type: 'number' },
  { key: 'empId', label: 'Employee ID', letter: 'E', width: 120, type: 'text' },
  { key: 'company', label: 'Contractor/Company', letter: 'F', width: 150, type: 'text' },
  { key: 'department', label: 'Department', letter: 'G', width: 150, type: 'text' },
  { key: 'diagnosis', label: 'Diagnosis', letter: 'H', width: 220, type: 'text' },
  { key: 'medicineName', label: 'Medicine Dispensed', letter: 'I', width: 200, type: 'text' },
  { key: 'medicineQty', label: 'Quantity', letter: 'J', width: 100, type: 'text' },
  { key: 'dosage', label: 'Dosage', letter: 'K', width: 100, type: 'text' },
  { key: 'totalCharges', label: 'Total Charges', letter: 'L', width: 120, type: 'number' },
  { key: 'prescribedBy', label: 'Prescribed By', letter: 'M', width: 160, type: 'text' },
  { key: 'dispensedBy', label: 'Dispensed By', letter: 'N', width: 160, type: 'text' },
  { key: 'status', label: 'Status', letter: 'O', width: 120, type: 'select', options: ['Pending', 'Pushed'] },
  { key: 'remarks', label: 'Remarks', letter: 'P', width: 200, type: 'text' }
];

const sampleData = [];

const getRowStyle = (row) => {
  if (row.status === 'Pushed') {
    return { background: '#f0fdf4', color: '#166534' }; // Green for successfully pushed
  }
  if (row.status === 'Pending') {
    return { background: '#fffbeb', color: '#b45309' }; // Yellow/Orange for pending
  }
  return {};
};

const extractQuantities = (medsText) => {
  if (!medsText) return '';
  const lines = String(medsText).split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  const quantities = lines.map(line => {
    // Strip list prefixes like "1. ", "2) ", "* ", etc.
    let cleaned = line.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '').trim();
    if (!cleaned) return '';
    
    // Look for explicit quantity after separators like '-' or ':' or '*' or 'x' or 'qty:'
    const match = cleaned.match(/(?:-|\bx\b|\bqty:?|\btotal:?|:)\s*(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?|ml)?\s*$/i)
               || cleaned.match(/\((\d+)\)\s*$/)
               || cleaned.match(/\b(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\s*$/i)
               || cleaned.match(/\s+(\d+)\s*$/); // trailing number at the end
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback: search for any number that is not parts of strength (like 500mg, 10ml, etc.)
    const numbers = cleaned.match(/\b\d+\b/g);
    if (numbers) {
      const filtered = numbers.filter(n => {
        const idx = cleaned.indexOf(n);
        const after = cleaned.substring(idx + n.length, idx + n.length + 5).toLowerCase();
        return !after.startsWith('mg') && !after.startsWith('ml') && !after.startsWith('g');
      });
      if (filtered.length > 0) {
        return filtered[filtered.length - 1]; // pick the last number
      }
    }
    
    return '1'; // default quantity is 1 if not specified
  });
  
  return quantities.filter(Boolean).join(',');
};

const DispenseMedicine = () => {
  const [dataReady, setDataReady] = useState(false);

  const computeRow = useCallback((row) => {
    const newRow = { ...row };
    const meds = newRow.medicineName || '';
    if (meds !== newRow._lastParsedMeds) {
      newRow.medicineQty = extractQuantities(meds);
      newRow._lastParsedMeds = meds;
    }
    return newRow;
  }, []);
  const [gridKey, setGridKey] = useState(() => Date.now());
  const [autoSyncCount, setAutoSyncCount] = useState(0);
  const [lastAutoSync, setLastAutoSync] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('cms_dispense_autosync') !== 'false';
  });
  const isExtractingRef = useRef(false);

  useEffect(() => {
    async function migrateDispenseData() {
      try {
        let data = await getSheetData('cms_dispense_log');
        let modified = false;
        
        if (data && Array.isArray(data)) {
          // Check/migrate keys in IndexedDB
          const migrated = data.map(row => {
            if (!row) return row;
            const newRow = { ...row };
            
            // Migrate old keys to CamelCase to prevent blank render cells
            if (row.patientname !== undefined && row.patientName === undefined) { newRow.patientName = row.patientname; delete newRow.patientname; modified = true; }
            if (row.empCode !== undefined && row.empId === undefined) { newRow.empId = row.empCode; delete newRow.empCode; modified = true; }
            if (row.employeeId !== undefined && row.empId === undefined) { newRow.empId = row.employeeId; delete newRow.employeeId; modified = true; }
            if (row.medicinesDetails !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicinesDetails; delete newRow.medicinesDetails; modified = true; }
            if (row.medicineprescribed !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicineprescribed; delete newRow.medicineprescribed; modified = true; }
            if (row.totalCharge !== undefined && row.totalCharges === undefined) { newRow.totalCharges = row.totalCharge; delete newRow.totalCharge; modified = true; }
            if (row.doctorname !== undefined && row.prescribedBy === undefined) { newRow.prescribedBy = row.doctorname; delete newRow.doctorname; modified = true; }
            if (row.treatmentgiven !== undefined && row.dosage === undefined) { newRow.dosage = row.treatmentgiven; delete newRow.treatmentgiven; modified = true; }
            
            return newRow;
          });
          
          if (modified) {
            await saveSheetData('cms_dispense_log', migrated);
            console.log("[DispenseMedicine] Aligned keys in IndexedDB.");
          }
        } else {
          // If no data in IndexedDB, check localStorage 'cms_dispense_log'
          const savedLocal = localStorage.getItem('cms_dispense_log');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                const migrated = parsed.map(row => {
                  if (!row) return row;
                  const newRow = { ...row };
                  if (row.patientname !== undefined && row.patientName === undefined) { newRow.patientName = row.patientname; delete newRow.patientname; }
                  if (row.empCode !== undefined && row.empId === undefined) { newRow.empId = row.empCode; delete newRow.empCode; }
                  if (row.employeeId !== undefined && row.empId === undefined) { newRow.empId = row.employeeId; delete newRow.employeeId; }
                  if (row.medicinesDetails !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicinesDetails; delete newRow.medicinesDetails; }
                  if (row.medicineprescribed !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicineprescribed; delete newRow.medicineprescribed; }
                  if (row.totalCharge !== undefined && row.totalCharges === undefined) { newRow.totalCharges = row.totalCharge; delete newRow.totalCharge; }
                  if (row.doctorname !== undefined && row.prescribedBy === undefined) { newRow.prescribedBy = row.doctorname; delete newRow.doctorname; }
                  if (row.treatmentgiven !== undefined && row.dosage === undefined) { newRow.dosage = row.treatmentgiven; delete newRow.treatmentgiven; }
                  return newRow;
                });
                await saveSheetData('cms_dispense_log', migrated);
                localStorage.removeItem('cms_dispense_log');
                console.log("[DispenseMedicine] Migrated and aligned cms_dispense_log from localStorage to IndexedDB.");
              }
            } catch (e) {
              console.error(e);
            }
          } else {
            // Check legacy 'dispense_logs'
            const oldLogs = JSON.parse(localStorage.getItem('dispense_logs') || '[]');
            if (oldLogs.length > 0) {
              const migrated = oldLogs.map((log, idx) => ({
                id: idx + 1,
                date: log.date ? new Date(log.date).toISOString().slice(0, 16) : '',
                patientName: log.patientName || '',
                medicineName: `${log.medicineName || ''} ${log.dosage || ''}`.trim(),
                quantity: log.quantity || '',
                department: '',
                dispensedBy: 'System Migrated',
                status: 'Pending',
                remarks: ''
              }));
              await saveSheetData('cms_dispense_log', migrated);
              localStorage.removeItem('dispense_logs');
              console.log("[DispenseMedicine] Migrated dispense_logs from localStorage to IndexedDB.");
            }
          }
        }

        // Keep alignment validation for columns metadata as well
        const colsKey = 'cms_dispense_log_columns';
        const savedCols = localStorage.getItem(colsKey);
        if (savedCols) {
          try {
            const parsed = JSON.parse(savedCols);
            const requiredKeys = ['date', 'patientName', 'gender', 'age', 'empId', 'company', 'department', 'medicineName', 'dosage', 'totalCharges', 'prescribedBy', 'dispensedBy', 'status', 'diagnosis', 'remarks'];
            const hasAllKeys = requiredKeys.every(k => parsed.some(c => c.key === k));
            const hasObsolete = parsed.some(c => c.key === 'medicineConsumed' || c.key === 'quantity' || c.key === 'batchNo');
            if (!hasAllKeys || hasObsolete || parsed.length !== requiredKeys.length) {
              localStorage.removeItem(colsKey);
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cms_dispense_log_') && key.endsWith('_columns')) {
                  localStorage.removeItem(key);
                }
              }
            } else {
              const updated = parsed.map(c => c.key === 'patientName' && c.label === 'Patient Name' ? { ...c, label: "Patient's Name" } : c);
              localStorage.setItem(colsKey, JSON.stringify(updated));
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error("Migration error:", err);
      } finally {
        setDataReady(true);
      }
    }

    migrateDispenseData();
  }, []);

  const handleDataChange = useCallback(async (newData) => {
    await saveSheetData('cms_dispense_log', newData);
  }, []);

  // Core extraction logic (used by both manual and auto sync)
  const extractFromOPD = useCallback(async (silent = false) => {
    if (isExtractingRef.current) return;
    isExtractingRef.current = true;
    try {
      // Get all OPD tabs from localStorage index
      const savedTabs = localStorage.getItem('cms_daily_opd_sheet_tabs_index');
      let opdTabs = [];
      if (savedTabs) {
        try {
          opdTabs = JSON.parse(savedTabs);
        } catch (e) {}
      }
      if (!Array.isArray(opdTabs) || opdTabs.length === 0) {
        opdTabs = [{ id: 'default', name: 'Daily OPD Log', storageKey: 'cms_daily_opd_sheet' }];
      }

      const dispenseData = await getSheetData('cms_dispense_log') || [];
      
      // Filter out completely empty/padded rows from existing dispense logs
      const cleanDispenseData = dispenseData.filter(row => {
        if (!row) return false;
        return Object.entries(row).some(([k, v]) => 
          k !== 'id' && k !== 'status' && String(v).trim() !== ''
        );
      });

      let pulledCount = 0;
      const newDispenseLogs = [...cleanDispenseData];

      // Helper to check if a row is valid and not empty
      const isValidOpdRow = (r) => {
        if (!r) return false;
        const name = String(r.patientName || r.patientname || '').trim();
        const code = String(r.empCode || r.empId || '').trim();
        // Allow fallback if user is tracking outside employees (just using name)
        return name.length > 0 || code.length > 0;
      };       const getMedicine = (r) => String(r.medicinesDetails || r.medicineprescribed || '').trim();
       const isAlreadyDispensed = (opdRow) => {
         const opdId = String(opdRow.id || '');
         return newDispenseLogs.some(log => {
           const logOpdId = String(log.opdId || '');
           if (opdId && logOpdId) {
             return logOpdId === opdId;
           }
           const opdDate = String(opdRow.date || new Date().toISOString().split('T')[0]);
           const opdName = String(opdRow.patientName || opdRow.patientname || '').trim().toLowerCase();
           const opdCode = String(opdRow.empCode || opdRow.empId || '').trim().toLowerCase();
           
           const logDate = String(log.date || '');
           const logName = String(log.patientName || '').trim().toLowerCase();
           const logCode = String(log.empId || '').trim().toLowerCase();
           
           return logDate === opdDate && logName === opdName && logCode === logCode;
         });
       };
 
       for (const tab of opdTabs) {
         const tabData = await getSheetData(tab.storageKey);
         if (Array.isArray(tabData)) {
           let tabModified = false;
           const updatedTabData = tabData.map(opdRow => {
             if (!opdRow) return opdRow;
             
             // Fast path: skip already-extracted rows in auto-sync (silent mode)
             if (opdRow.extracted && silent) return opdRow;
             
             const rawMedText = getMedicine(opdRow);
             if (!rawMedText) return opdRow;
 
             const alreadyPushed = isAlreadyDispensed(opdRow);
             const shouldExtract = !alreadyPushed;
 
             if (isValidOpdRow(opdRow) && shouldExtract) {
               newDispenseLogs.push({
                 id: `DISP-${Date.now()}-${pulledCount}`,
                 opdId: opdRow.id || '',
                 date: opdRow.date || new Date().toISOString().split('T')[0],
                 patientName: opdRow.patientName || opdRow.patientname || '',
                 gender: opdRow.gender || '',
                 age: opdRow.age || '',
                 empId: opdRow.empCode || opdRow.empId || '',
                 company: opdRow.contractor || opdRow.company || '',
                 department: opdRow.department || '',
                 medicineName: rawMedText,
                 dosage: opdRow.treatmentGiven || opdRow.treatmentgiven || '1',
                 medicineQty: (opdRow.medicineQty || '').trim() || extractQuantities(rawMedText),
                 _lastParsedMeds: rawMedText,
                 totalCharges: opdRow.totalCharge || '',
                 prescribedBy: opdRow.drName || opdRow.doctorname || '',
                 dispensedBy: opdRow.doneBy || '',
                 status: 'Pending',
                 diagnosis: opdRow.diagnosis || '',
                 medicineConsumed: opdRow.medicineConsumed || '',
                 batchNo: opdRow.batchNo || ''
               });
               pulledCount++;
               tabModified = true;
               return { ...opdRow, extracted: true };
             } else if (isValidOpdRow(opdRow) && alreadyPushed && !opdRow.extracted) {
               tabModified = true;
               return { ...opdRow, extracted: true };
             }
             return opdRow;
           });
 
           if (tabModified) {
             await saveSheetData(tab.storageKey, updatedTabData);
           }
         }
       }

      if (pulledCount > 0) {
        await saveSheetData('cms_dispense_log', newDispenseLogs);
        setGridKey(Date.now());
        setAutoSyncCount(prev => prev + pulledCount);
        setLastAutoSync(new Date().toLocaleTimeString());
        
        if (!silent) {
          alert(`✅ Successfully extracted ${pulledCount} patient(s) with prescribed medicines from the OPD Log!`);
        }
        return pulledCount;
      } else {
        if (!silent) {
          alert('No new un-extracted patient records with medicines found in the OPD Log!');
        }
        return 0;
      }
    } catch (e) {
      console.error(e);
      if (!silent) alert('Error extracting from OPD');
      return 0;
    } finally {
      isExtractingRef.current = false;
    }
  }, []);

  // Auto-sync: runs on mount and every 10 seconds
  useEffect(() => {
    if (!dataReady || !autoSyncEnabled) return;

    // Run once on mount
    extractFromOPD(true).then(initialCount => {
      if (initialCount > 0) {
        setAutoSyncCount(initialCount);
      }
    });

    // Set up periodic check
    const interval = setInterval(() => {
      extractFromOPD(true);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [dataReady, autoSyncEnabled, extractFromOPD]);

  const toggleAutoSync = () => {
    const newVal = !autoSyncEnabled;
    setAutoSyncEnabled(newVal);
    localStorage.setItem('cms_dispense_autosync', newVal.toString());
  };

  if (!dataReady) return null;

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            💊 Clinical Dispensing Log
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            OPD records auto-sync here. Records are automatically sent to Daily Consume.
            {lastAutoSync && (
              <span style={{ marginLeft: '12px', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                🔄 Last sync: {lastAutoSync} ({autoSyncCount} new)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Auto-sync toggle */}
          <button
            onClick={toggleAutoSync}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: autoSyncEnabled ? '#059669' : '#94a3b8',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', fontSize: '13px',
              transition: 'all 0.2s'
            }}
            title={autoSyncEnabled ? 'Auto-sync is ON — OPD data flows here automatically every 10s' : 'Auto-sync is OFF'}
          >
            <Zap size={14} />
            Auto: {autoSyncEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Manual extract button */}
          <button 
            onClick={() => extractFromOPD(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
            title="Manually pull new prescriptions from the Daily OPD sheet"
          >
            <ArrowRightLeft size={16} /> Extract from OPD
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ExcelGrid 
          key={gridKey}
          title="Dispensing Logs"
          storageKey="cms_dispense_log"
          columns={columns}
          initialData={sampleData}
          idPrefix="DISP-"
          getRowStyle={getRowStyle}
          onDataChange={handleDataChange}
          computeRow={computeRow}
          filters={[
            { key: 'status', label: 'All Statuses', options: ['Pending', 'Pushed'] }
          ]}
        />
      </div>
    </div>
  );
};

export default DispenseMedicine;
