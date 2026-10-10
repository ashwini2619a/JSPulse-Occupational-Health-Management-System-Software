import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ExcelGrid from './ExcelGrid';
import { ArrowDownToLine, AlertCircle, Calendar } from 'lucide-react';
import { getSheetData, saveSheetData } from '../../utils/sheetDB';

const getStockData = async () => {
  let data = await getSheetData('cms_medstock_data');
  if (!data) {
    const saved = localStorage.getItem('cms_medstock_data');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_medstock_data', data);
        localStorage.removeItem('cms_medstock_data');
      } catch (e) {}
    }
  }
  return data || [];
};

const getDispenseData = async () => {
  let data = await getSheetData('cms_dispense_log');
  if (!data) {
    const saved = localStorage.getItem('cms_dispense_log');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_dispense_log', data);
        localStorage.removeItem('cms_dispense_log');
      } catch (e) {}
    }
  }
  return data || [];
};

const getMonthlyBalanceData = async () => {
  let data = await getSheetData('cms_yearly_monthly_balance');
  if (!data) {
    const saved = localStorage.getItem('cms_yearly_monthly_balance');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_yearly_monthly_balance', data);
        localStorage.removeItem('cms_yearly_monthly_balance');
      } catch (e) {}
    }
  }
  return data || [];
};


const getExcelCol = (n) => {
  let s = '', t;
  while (n > 0) {
    t = (n - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    n = (n - t)/26 | 0;
  }
  return s || undefined;
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const sections = [
  { prefix: 'ohc', name: 'OHC Counter' },
  { prefix: 'dress', name: 'Dressing' },
  { prefix: 'life', name: 'Life Saving' },
  { prefix: 'first', name: 'First Aid' },
  { prefix: 'phys', name: 'Physiotherapy' },
  { prefix: 'pme', name: 'PME' },
  { prefix: 'exp', name: 'Exp.' }
];

const subCols = [];
sections.forEach(s => {
  for (let i = 1; i <= 4; i++) {
    subCols.push({ k: `${s.prefix}_${i}`, l: i.toString(), w: 80, grp: s.name });
  }
  subCols.push({ k: `${s.prefix}_total`, l: 'Total', w: 80, grp: s.name });
});
subCols.push({ k: 'total', l: 'TOTAL', w: 90, grp: 'Monthly Total' });

const daysArray = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const initialData = Array(5).fill(null).map((_, i) => ({
  id: `DC-00${i + 1}`,
  medicineName: '',
  type: '',
  status: ''
}));

const getRowStyle = (row) => {
  if (row.status === 'Deducted') {
    return { background: '#f0fdf4', color: '#166534' }; 
  }
  if (row.status === 'Pending') {
    return { background: '#fffbeb', color: '#b45309' }; 
  }
  return {};
};

// Standalone computeRow function to avoid ordering / scope dependencies
const computeRow = (row) => {
  let grandTotal = 0;
  const newRow = { ...row };
  
  daysArray.forEach(d => {
    const pfx = `day${d}`;
    let dTotal = 0;
    sections.forEach(s => {
      let sTotal = 0;
      for (let i = 1; i <= 4; i++) {
        sTotal += parseInt(newRow[`${pfx}_${s.prefix}_${i}`]) || 0;
      }
      newRow[`${pfx}_${s.prefix}_total`] = sTotal.toString();
      dTotal += sTotal;
    });
    newRow[`${pfx}_total`] = dTotal.toString();
    grandTotal += dTotal;
  });
  
  newRow.monthlyGrandTotal = grandTotal.toString();
  return newRow;
};

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

  // Extract explicit quantity first
  let quantity = 1;
  
  // Pattern 1: parenthesized quantity, e.g., (10 tabs) or (15)
  const parenMatch = cleaned.match(/\((?:qty:?\s*)?(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?|ml)?\)/i);
  if (parenMatch) {
    quantity = parseInt(parenMatch[1]) || 1;
    cleaned = cleaned.replace(parenMatch[0], '').trim();
  } else {
    // Pattern 2: explicit separator quantity, e.g., x 10, * 5, - 15, qty: 10, total 10
    const explicitMatch = cleaned.match(/(?:\b(?:qty|total):?\s*|[\s,x\*\-])+(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\b/i)
                       || cleaned.match(/(?:[\s,x\*\-])+(\d+)\s*$/); // trailing number with separator
    if (explicitMatch) {
      quantity = parseInt(explicitMatch[1]) || 1;
      cleaned = cleaned.replace(explicitMatch[0], '').trim();
    } else {
      // Pattern 3: Number followed by unit: 10 tabs, 5 caps
      const unitMatch = cleaned.match(/\b(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\b/i);
      if (unitMatch) {
        quantity = parseInt(unitMatch[1]) || 1;
        cleaned = cleaned.replace(unitMatch[0], '').trim();
      }
    }
  }

  // Remove trailing and leading punctuation/spaces
  cleaned = cleaned.replace(/^[\s,;\-\+]+|[\s,;\-\+]+$/g, '').trim();

  // Look for frequency markers
  const freqRegex = /\b(bd|bid|tds|tid|od|qid|sos|hs|twice|thrice|once|daily|after\s+food|before\s+food|ac|pc|1x2|1x3|1x1|1x4)\b/i;
  const match = cleaned.match(freqRegex);
  
  let dosage = '';
  let medName = cleaned;

  if (match) {
    const idx = match.index;
    medName = cleaned.substring(0, idx).trim();
    dosage = cleaned.substring(idx).trim();
  }

  // Clean trailing punctuation from medName
  medName = medName.replace(/[\-\s\.,]+$/, '').trim();

  // Strip common medical prefixes from the name to improve stock matching
  // (e.g. Tab Paracetamol -> Paracetamol)
  const prefixRegex = /^\s*\b(tab|caps?|syr|inj|liq|oint|drops?|t|c)\b\.?\s+/i;
  medName = medName.replace(prefixRegex, '').trim();

  // Re-append quantity to dosage for parseQuantity fallback compatibility
  const finalDosage = dosage ? `${dosage} x ${quantity}` : `x ${quantity}`;

  return {
    name: capitalizeName(medName || cleaned),
    dosage: finalDosage
  };
};

// Quantity parser from dosage
const parseQuantity = (dosageStr) => {
  if (!dosageStr) return 1;
  const str = dosageStr.toLowerCase().trim();
  
  const qtyPatterns = [
    /x\s*(\d+)/,
    /\*\s*(\d+)/,
    /qty\s*:?\s*(\d+)/,
    /total\s*:?\s*(\d+)/,
    /(\d+)\s*(tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)/,
    /\((\d+)\s*(tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\)/,
  ];

  for (let pattern of qtyPatterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]) || 1;
    }
  }

  const parenMatch = str.match(/\((\d+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parseInt(parenMatch[1]) || 1;
  }

  if (/^\d+$/.test(str)) {
    return parseInt(str) || 1;
  }

  const numberMatches = str.match(/\b\d+\b/g);
  if (numberMatches) {
    const filtered = numberMatches.filter(n => {
      const idx = str.indexOf(n);
      const after = str.substring(idx + n.length, idx + n.length + 5);
      return !after.startsWith('mg') && !after.startsWith('ml') && !after.startsWith('g');
    });
    if (filtered.length > 0) {
      return parseInt(filtered[filtered.length - 1]) || 1;
    }
  }

  const anyNumber = str.match(/\d+/);
  if (anyNumber) {
    return parseInt(anyNumber[0]) || 1;
  }

  return 1;
};

// Smart parser to extract exact total quantities from clinical dosage instructions
const parseExactDosageQuantity = (dosageStr) => {
  if (!dosageStr) return 1;
  const str = dosageStr.toLowerCase().trim();

  // 1. Check strong explicit total quantity patterns first
  const strongPatterns = [
    /qty\s*:?\s*(\d+)/,
    /total\s*:?\s*(\d+)/,
    /x\s*(\d+)\s*$/,
    /\*\s*(\d+)\s*$/,
    /\((\d+)\)/
  ];

  for (let pattern of strongPatterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]) || 1;
    }
  }

  // 2. If it contains duration (day/week/month), calculate baseQty * freq * days
  const hasDuration = /\b(?:day|week|month)s?\b/i.test(str);
  if (hasDuration) {
    // Extract base quantity (e.g. "1 tab", "2 tabs")
    let baseQty = 1;
    const baseMatch = str.match(/^(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?|ml|drop|drops)\b/i);
    if (baseMatch) {
      baseQty = parseInt(baseMatch[1]) || 1;
    } else {
      const numMatch = str.match(/^(\d+)\b/);
      if (numMatch) {
        baseQty = parseInt(numMatch[1]) || 1;
      }
    }

    // Extract frequency
    let freq = 1;
    if (/\b(?:bd|bid|twice|1x2|2x2)\b/i.test(str)) {
      freq = 2;
    } else if (/\b(?:tds|tid|thrice|1x3|2x3)\b/i.test(str)) {
      freq = 3;
    } else if (/\b(?:qid|four\s+times|1x4|2x4)\b/i.test(str)) {
      freq = 4;
    } else if (/\b(?:od|once|daily|1x1)\b/i.test(str)) {
      freq = 1;
    }

    // Extract duration in days
    let days = 1;
    const daysMatch = str.match(/for\s+(\d+)\s*days?/i) || str.match(/\b(\d+)\s*days?/i);
    if (daysMatch) {
      days = parseInt(daysMatch[1]) || 1;
    } else {
      const weekMatch = str.match(/for\s+(\d+)\s*weeks?/i) || str.match(/\b(\d+)\s*weeks?/i);
      if (weekMatch) {
        days = (parseInt(weekMatch[1]) || 1) * 7;
      }
    }

    return baseQty * freq * days;
  }

  // 3. Fallback to standard parseQuantity
  return parseQuantity(dosageStr);
};

// Fuzzy medicine stock item lookup
const findStockItem = (medName, stockData) => {
  const cleanName = medName.toLowerCase().trim();
  
  let match = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === cleanName);
  if (match) return { item: match, type: 'exact' };

  const matches = stockData.filter(s => {
    const sName = (s.medicineName || '').toLowerCase().trim();
    return sName.includes(cleanName) || cleanName.includes(sName);
  });

  if (matches.length === 1) {
    return { item: matches[0], type: 'partial' };
  } else if (matches.length > 1) {
    return { items: matches, type: 'ambiguous' };
  }

  const cleanWords = cleanName.split(/\s+/).filter(w => w.length > 2 && w !== 'tab' && w !== 'caps' && w !== 'tablet' && w !== 'capsule');
  if (cleanWords.length > 0) {
    const wordMatches = stockData.filter(s => {
      const sName = (s.medicineName || '').toLowerCase().trim();
      return cleanWords.some(w => sName.includes(w));
    });
    if (wordMatches.length === 1) {
      return { item: wordMatches[0], type: 'partial' };
    } else if (wordMatches.length > 1) {
      return { items: wordMatches, type: 'ambiguous' };
    }
  }

  return null;
};

// Map dispense log row to correct Daily Consume section and shift
const getTargetSectionAndShift = (row, isMedicineConsume = false) => {
  let section = 'ohc';
  let shift = '1';

  // Search fields (case-insensitive)
  const searchStr = [
    row.medicineConsumed,
    row.department,
    row.remarks,
    row.diagnosis,
    row.dispensedBy
  ].map(f => String(f || '').toLowerCase().trim()).join(' ');

  const hasWord = (words) => words.some(w => searchStr.includes(w));

  // Determine Section
  if (isMedicineConsume) {
    section = 'ohc'; // Only Quantity exists
  } else {
    if (hasWord(['dress', 'wound', 'injury', 'cut', 'burn', 'bandage', 'suture', 'dressing'])) {
      section = 'dress';
    } else if (hasWord(['life', 'saving', 'lifesaving', 'emergency', 'cardiac', 'ambulance', 'shock'])) {
      section = 'life';
    } else if (hasWord(['first aid', 'firstaid', 'box', 'fa '])) {
      section = 'first';
    } else if (hasWord(['physio', 'phys', 'therapy', 'sprain', 'traction', 'exercise', 'ultrasound'])) {
      section = 'phys';
    } else if (hasWord(['pme', 'medical exam', 'health check', 'annual'])) {
      section = 'pme';
    } else if (hasWord(['exp', 'expired', 'scrap'])) {
      section = 'exp';
    } else {
      section = 'ohc'; // Default to OHC Counter
    }
  }

  // Determine Shift: 1=A, 2=B, 3=C, 4=General
  if (hasWord(['shift 1', 'shift a', 'shift_1', 'shift_a', 'shift-1', 'shift-a', ' 1st shift', 'a shift', 'shift: a', 'shift: 1'])) {
    shift = '1';
  } else if (hasWord(['shift 2', 'shift b', 'shift_2', 'shift_b', 'shift-2', 'shift-b', ' 2nd shift', 'b shift', 'shift: b', 'shift: 2'])) {
    shift = '2';
  } else if (hasWord(['shift 3', 'shift c', 'shift_3', 'shift_c', 'shift-3', 'shift-c', ' 3rd shift', 'c shift', 'shift: c', 'shift: 3'])) {
    shift = '3';
  } else if (hasWord(['shift 4', 'shift g', 'general shift', 'gen shift', 'shift_4', 'shift-4', 'g shift', 'shift: g', 'shift: 4'])) {
    shift = '4';
  } else {
    // Check if time is encoded in the date string (e.g. YYYY-MM-DDTHH:MM)
    const dateStr = String(row.date || '');
    if (dateStr.includes('T')) {
      try {
        const timePart = dateStr.split('T')[1]; // e.g. "14:30"
        const hours = parseInt(timePart.split(':')[0]);
        if (!isNaN(hours)) {
          if (hours >= 6 && hours < 14) {
            shift = '1'; // A Shift (06:00 - 14:00)
          } else if (hours >= 14 && hours < 22) {
            shift = '2'; // B Shift (14:00 - 22:00)
          } else if (hours >= 22 || hours < 6) {
            shift = '3'; // C Shift (22:00 - 06:00)
          } else {
            shift = '4'; // General Shift
          }
        }
      } catch (e) {}
    } else {
      shift = '1'; // Default
    }
  }

  return { section, shift };
};

const DailyConsume = ({ title = "Daily Consume" }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
  const [hasPending, setHasPending] = useState(false);
  const gridDataRef = useRef([]);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[today.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  // Dynamic day filter state (default to today's date)
  const [selectedDay, setSelectedDay] = useState(() => today.getDate().toString());

  const isMedicineConsume = title === "Medicine Consume";

  const sections = useMemo(() => {
    return isMedicineConsume 
      ? [
          { prefix: 'ohc', name: 'Quantity' }
        ]
      : [
          { prefix: 'ohc', name: 'OHC Counter' },
          { prefix: 'dress', name: 'Dressing' },
          { prefix: 'life', name: 'Life Saving' },
          { prefix: 'first', name: 'First Aid' },
          { prefix: 'phys', name: 'Physiotherapy' },
          { prefix: 'pme', name: 'PME' },
          { prefix: 'exp', name: 'Exp.' }
        ];
  }, [isMedicineConsume]);

  const subCols = useMemo(() => {
    const list = [];
    sections.forEach(s => {
      for (let i = 1; i <= 4; i++) {
        list.push({ k: `${s.prefix}_${i}`, l: i.toString(), w: 80, grp: s.name });
      }
      list.push({ k: `${s.prefix}_total`, l: 'Total', w: 80, grp: s.name });
    });
    list.push({ k: 'total', l: 'TOTAL', w: 90, grp: 'Monthly Total' });
    return list;
  }, [sections]);

  const computeRowLocal = useCallback((row) => {
    let grandTotal = 0;
    const newRow = { ...row };
    
    daysArray.forEach(d => {
      const pfx = `day${d}`;
      let dTotal = 0;
      sections.forEach(s => {
        let sTotal = 0;
        for (let i = 1; i <= 4; i++) {
          sTotal += parseInt(newRow[`${pfx}_${s.prefix}_${i}`]) || 0;
        }
        newRow[`${pfx}_${s.prefix}_total`] = sTotal.toString();
        dTotal += sTotal;
      });
      newRow[`${pfx}_total`] = dTotal.toString();
      grandTotal += dTotal;
    });
    
    newRow.monthlyGrandTotal = grandTotal.toString();
    return newRow;
  }, [sections]);

  // Generate columns dynamically based on selected day to optimize rendering performance
  const columns = useMemo(() => {
    const cols = [
      { key: 'medicineName', label: 'Medicine\'s Name', letter: 'A', width: 200, type: 'text', superGroup: 'DETAILS', group: 'Basic Info' },
      { key: 'type', label: 'Type', letter: 'B', width: 100, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'], superGroup: 'DETAILS', group: 'Basic Info' }
    ];

    let colNum = 3;
    daysArray.forEach(d => {
      if (selectedDay !== 'all' && d !== selectedDay) {
        colNum += subCols.length;
        return;
      }
      const prefix = `day${d}`;
      subCols.forEach(sc => {
        cols.push({
          key: `${prefix}_${sc.k}`,
          label: sc.l,
          letter: getExcelCol(colNum++),
          width: sc.w,
          type: 'number',
          superGroup: `DAY ${d}`,
          group: sc.grp
        });
      });
    });

    cols.push({ key: 'monthlyGrandTotal', label: 'Monthly Grand Total', letter: getExcelCol(colNum++), width: 130, type: 'number', superGroup: 'SUMMARY', group: 'Totals', readOnly: true });
    cols.push({ key: 'status', label: 'Status', letter: getExcelCol(colNum++), width: 120, type: 'select', options: ['Pending', 'Deducted'], superGroup: 'SUMMARY', group: 'Status' });
    return cols;
  }, [selectedDay, subCols]);

  const isExtractingRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Auto-sync state
  const [autoExtractEnabled, setAutoExtractEnabled] = useState(() => {
    const key = isMedicineConsume ? 'cms_dc_autoextract_med' : 'cms_dc_autoextract';
    return localStorage.getItem(key) !== 'false';
  });
  const [autoDeductEnabled, setAutoDeductEnabled] = useState(() => {
    const key = isMedicineConsume ? 'cms_dc_autodeduct_med' : 'cms_dc_autodeduct';
    const saved = localStorage.getItem(key);
    if (isMedicineConsume && saved === null) {
      return false; // Default to false for Medicine Consume to prevent double-deducting
    }
    return saved !== 'false';
  });
  const [lastExtractSync, setLastExtractSync] = useState(null);
  const [lastDeductSync, setLastDeductSync] = useState(null);
  const [extractSyncCount, setExtractSyncCount] = useState(0);
  const [deductSyncCount, setDeductSyncCount] = useState(0);

  const currentStorageKey = isMedicineConsume 
    ? `cms_medicine_consume_data_${selectedYear}_${selectedMonth}`
    : `cms_monthly_consume_data_${selectedYear}_${selectedMonth}`;

  // Clear data cache on sheet or day switches
  useEffect(() => {
    gridDataRef.current = [];
  }, [currentStorageKey, selectedDay]);

  const checkPending = async () => {
    try {
      const data = await getSheetData(currentStorageKey) || [];
      const pending = data.some(r => r.monthlyGrandTotal && parseInt(r.monthlyGrandTotal) > 0 && r.status === 'Pending' && r.medicineName);
      setHasPending(pending);
    } catch (e) {}
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => clearInterval(interval);
  }, [currentStorageKey]);

  // --- Flow 2: Extract from Dispense (silent mode for auto) ---
  const handleExtractFromDispense = async (silent = false) => {
    if (isExtractingRef.current) return 0;
    isExtractingRef.current = true;
    try {
      const dispenseData = await getDispenseData();
      const consumeData = gridDataRef.current && gridDataRef.current.length > 0 ? [...gridDataRef.current] : (await getSheetData(currentStorageKey) || []);
      const stockData = await getStockData();
      let pulledCount = 0;

      dispenseData.forEach(row => {
        const canSync = isMedicineConsume 
          ? (row.statusMed !== 'Pushed')
          : (!row.status || row.status === 'Pending');
        
        if (row.medicineName && canSync) {
          const rawMedText = row.medicineName;
          
          // Split by newline, comma, or semicolon to extract individual medicines
          const lines = rawMedText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
          const dosageLines = (row.dosage || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
          const qtyLines = String(row.medicineQty || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
          
          const dateObj = new Date(row.date || new Date());
          const day = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
          
          const { section, shift } = getTargetSectionAndShift(row, isMedicineConsume);
          const targetCell = `day${day}_${section}_${shift}`;

          lines.forEach((line, index) => {
            const parsed = parseMedicineLine(line);
            if (!parsed || !parsed.name) return;

            const medName = parsed.name;
            const medNameLower = medName.toLowerCase().trim();
            
            // Prioritize quantity column value first
            let qty = 1;
            const rawQtyVal = qtyLines[index] || qtyLines[0] || '';
            if (rawQtyVal && !isNaN(parseInt(rawQtyVal))) {
              qty = parseInt(rawQtyVal);
            } else {
              // Fallback to parsing from the dosage column
              const correspondingDosage = dosageLines[index] || dosageLines[0] || row.dosage || '';
              if (correspondingDosage) {
                qty = parseExactDosageQuantity(correspondingDosage);
              }
              
              // Fallback to parsing from the medicine name line
              if (qty === 1) {
                const nameQty = parseExactDosageQuantity(parsed.dosage);
                if (nameQty > 1) {
                  qty = nameQty;
                }
              }
            }

            let consumeRow = consumeData.find(c => (c.medicineName || '').toLowerCase().trim() === medNameLower);
            
            let medType = '';
            const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
            if (stockItem) {
              medType = stockItem.unit || stockItem.category || '';
            }

            if (consumeRow) {
              const currentVal = parseInt(consumeRow[targetCell]) || 0;
              consumeRow[targetCell] = (currentVal + qty).toString();
              consumeRow.status = 'Pending';
              
              const updated = computeRowLocal(consumeRow);
              Object.assign(consumeRow, updated);
            } else {
              let newRow = {
                id: 'DC-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
                medicineName: medName,
                type: medType,
                status: 'Pending'
              };
              daysArray.forEach(d => {
                const pfx = `day${d}`;
                sections.forEach(s => {
                  for (let i = 1; i <= 4; i++) {
                    newRow[`${pfx}_${s.prefix}_${i}`] = '';
                  }
                  newRow[`${pfx}_${s.prefix}_total`] = '0';
                });
                newRow[`${pfx}_total`] = '0';
              });
              
              newRow[targetCell] = qty.toString();
              newRow = computeRowLocal(newRow);
              consumeData.push(newRow);
            }
          });

          if (isMedicineConsume) {
            row.statusMed = 'Pushed';
          } else {
            row.status = 'Pushed';
          }
          pulledCount++;
        }
      });

      if (pulledCount > 0) {
        await saveSheetData('cms_dispense_log', dispenseData);
        await saveSheetData(currentStorageKey, consumeData);
        gridDataRef.current = consumeData;
        setExtractSyncCount(prev => prev + pulledCount);
        setLastExtractSync(new Date().toLocaleTimeString());
        if (!silent) {
          alert(`Successfully extracted ${pulledCount} records from Dispense Log!`);
        }
        triggerRefresh();
        return pulledCount;
      } else {
        if (!silent) {
          alert('No new records to extract from Dispense Log.');
        }
        triggerRefresh();
        return 0;
      }
    } catch (e) {
      if (!silent) alert('Error extracting data: ' + e.message);
      return 0;
    } finally {
      isExtractingRef.current = false;
    }
  };

  // --- Flow 3: Sync to Inventory (silent mode for auto) ---
  const handleSyncToInventory = async (silent = false) => {
    if (isSyncingRef.current) return 0;
    isSyncingRef.current = true;
    try {
      const dailyData = gridDataRef.current && gridDataRef.current.length > 0 ? [...gridDataRef.current] : (await getSheetData(currentStorageKey) || []);
      const stockData = await getStockData();
      const monthlyBalanceData = await getMonthlyBalanceData();

      if (stockData.length === 0) {
        if (!silent) alert('Medicine Stock is empty. Cannot deduct.');
        return 0;
      }

      let updatedCount = 0;
      let missingMeds = [];
      let addedToBalance = 0;

      const monthPrefix = selectedMonth.substring(0, 3).toLowerCase();

      for (const row of dailyData) {
        const grandTotal = Number(row.monthlyGrandTotal || 0);
        const previouslyDeducted = Number(row.deductedQty || 0);

        if (row.medicineName && (row.status !== 'Deducted' || grandTotal !== previouslyDeducted)) {
          const incrementalQty = grandTotal - previouslyDeducted;
          if (incrementalQty === 0) {
            row.status = 'Deducted';
            continue;
          }

          let stockItem = null;
          const matchResult = findStockItem(row.medicineName, stockData);
          if (matchResult) {
            if (matchResult.type === 'exact' || matchResult.type === 'partial') {
              stockItem = matchResult.item;
            } else if (matchResult.type === 'ambiguous') {
              if (!silent) {
                const optionsStr = matchResult.items.map((item, idx) => `${idx + 1}. ${item.medicineName}`).join('\n');
                const userInput = prompt(`Ambiguous match for "${row.medicineName}". Please type the number of the correct medicine from stock (or cancel to skip):\n\n${optionsStr}`);
                if (userInput) {
                  const idx = parseInt(userInput) - 1;
                  if (idx >= 0 && idx < matchResult.items.length) {
                    stockItem = matchResult.items[idx];
                  }
                }
              } else {
                stockItem = matchResult.items[0];
              }
            }
          }

          if (stockItem) {
            const cleanStockNameLower = (stockItem.medicineName || '').toLowerCase().trim();
            stockItem.quantity = (Number(stockItem.quantity) || 0) - incrementalQty;
            stockItem.lastUpdated = new Date().toISOString().split('T')[0];

            let balanceItem = monthlyBalanceData.find(m => 
              (m.medicineName || '').toLowerCase().trim() === cleanStockNameLower
            );

            if (balanceItem) {
              const outKey = `${monthPrefix}_outgoing`;
              balanceItem[outKey] = (Number(balanceItem[outKey]) || 0) + incrementalQty;
            } else {
              const newBalanceRow = {
                id: 'MB-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
                medicineName: stockItem.medicineName || row.medicineName,
                type: row.type || stockItem.category || '',
                expiryDate: stockItem.expiry || '',
                composition: '',
                initialBalance: (Number(stockItem.quantity) + incrementalQty),
              };
              newBalanceRow[`${monthPrefix}_outgoing`] = incrementalQty;
              monthlyBalanceData.push(newBalanceRow);
              addedToBalance++;
            }

            // Recompute monthly balance running totals
            const balanceItemToRecompute = balanceItem || monthlyBalanceData[monthlyBalanceData.length - 1];
            if (balanceItemToRecompute) {
              const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              let runningBalance = Number(balanceItemToRecompute.initialBalance) || 0;
              let yearlyIncoming = 0;
              let yearlyOutgoing = 0;
              monthsList.forEach(m => {
                const incoming = Number(balanceItemToRecompute[`${m}_incoming`]) || 0;
                const outgoing = Number(balanceItemToRecompute[`${m}_outgoing`]) || 0;
                yearlyIncoming += incoming;
                yearlyOutgoing += outgoing;
                runningBalance = runningBalance + incoming - outgoing;
                balanceItemToRecompute[`${m}_balance`] = runningBalance.toString();
              });
              balanceItemToRecompute.totalIncoming = yearlyIncoming.toString();
              balanceItemToRecompute.totalOutgoing = yearlyOutgoing.toString();
              balanceItemToRecompute.finalBalance = runningBalance.toString();
            }

            row.deductedQty = grandTotal;
            row.status = 'Deducted';
            updatedCount++;
          } else {
            missingMeds.push(row.medicineName);
          }
        }
      }

      if (updatedCount > 0) {
        await saveSheetData(currentStorageKey, dailyData);
        await saveSheetData('cms_medstock_data', stockData);
        await saveSheetData('cms_yearly_monthly_balance', monthlyBalanceData);
        gridDataRef.current = dailyData;
        setDeductSyncCount(prev => prev + updatedCount);
        setLastDeductSync(new Date().toLocaleTimeString());
        
        if (!silent) {
          let msg = `✅ Successfully synced ${updatedCount} medicine(s)!\n\n`;
          msg += `📦 Medicine Inventory: Quantities deducted\n`;
          msg += `📊 Monthly Balance: ${selectedMonth} Outgoing updated\n`;
          if (addedToBalance > 0) {
            msg += `➕ ${addedToBalance} new medicine(s) added to Monthly Balance\n`;
          }
          if (missingMeds.length > 0) {
            msg += `\n⚠️ Not found in inventory (skipped):\n- ${[...new Set(missingMeds)].join('\n- ')}`;
          }
          alert(msg);
        }
        triggerRefresh();
        return updatedCount;
      } else {
        if (!silent && missingMeds.length > 0) {
          alert(`Could not deduct. The following medicines were not found in the Medicine Stock:\n- ${[...new Set(missingMeds)].join('\n- ')}`);
        } else if (!silent) {
          alert('No pending records found to deduct. Make sure you hit the "Save" button in the grid first!');
        }
        triggerRefresh();
        return 0;
      }
    } catch (err) {
      if (!silent) alert('Error syncing data: ' + err.message);
      return 0;
    } finally {
      isSyncingRef.current = false;
    }
  };

  // --- Flow 4: Undo Deduction ---
  const handleUndoDeduction = async () => {
    try {
      const dailyData = gridDataRef.current && gridDataRef.current.length > 0 ? [...gridDataRef.current] : (await getSheetData(currentStorageKey) || []);
      const stockData = await getStockData();
      const monthlyBalanceData = await getMonthlyBalanceData();

      const deductedRows = dailyData.filter(r => r.status === 'Deducted' && r.medicineName);

      if (deductedRows.length === 0) {
        alert('No deducted medicines found in this month\'s log to undo.');
        return;
      }

      const optionsStr = deductedRows.map((r, idx) => `${idx + 1}. ${r.medicineName} (${r.monthlyGrandTotal} units)`).join('\n');
      const userInput = prompt(`Select medicine to undo deduction (type the number):\n\n${optionsStr}`);

      if (!userInput) return;

      const idx = parseInt(userInput) - 1;
      if (idx < 0 || idx >= deductedRows.length) {
        alert('Invalid selection.');
        return;
      }

      const selectedRow = deductedRows[idx];
      const consumedQty = Number(selectedRow.monthlyGrandTotal) || 0;
      const medNameLower = (selectedRow.medicineName || '').toLowerCase().trim();

      // 1. Restore quantity back to cms_medstock_data
      const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
      if (stockItem) {
        stockItem.quantity = (Number(stockItem.quantity) || 0) + consumedQty;
        stockItem.lastUpdated = new Date().toISOString().split('T')[0];
      }

      // 2. Remove outgoing from cms_yearly_monthly_balance
      const monthPrefix = selectedMonth.substring(0, 3).toLowerCase();
      const balanceItem = monthlyBalanceData.find(m => (m.medicineName || '').toLowerCase().trim() === medNameLower);
      if (balanceItem) {
        const outKey = `${monthPrefix}_outgoing`;
        balanceItem[outKey] = Math.max(0, (Number(balanceItem[outKey]) || 0) - consumedQty);
        
        // Recompute balance row
        const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let runningBalance = Number(balanceItem.initialBalance) || 0;
        let yearlyIncoming = 0;
        let yearlyOutgoing = 0;
        monthsList.forEach(m => {
          const incoming = Number(balanceItem[`${m}_incoming`]) || 0;
          const outgoing = Number(balanceItem[`${m}_outgoing`]) || 0;
          yearlyIncoming += incoming;
          yearlyOutgoing += outgoing;
          runningBalance = runningBalance + incoming - outgoing;
          balanceItem[`${m}_balance`] = runningBalance.toString();
        });
        balanceItem.totalIncoming = yearlyIncoming.toString();
        balanceItem.totalOutgoing = yearlyOutgoing.toString();
        balanceItem.finalBalance = runningBalance.toString();
      }

      // 3. Reset row status to 'Pending' in DailyConsume
      const targetDailyRow = dailyData.find(r => r.id === selectedRow.id);
      if (targetDailyRow) {
        targetDailyRow.status = 'Pending';
        targetDailyRow.deductedQty = 0;
      }

      // Save everything back
      await saveSheetData(currentStorageKey, dailyData);
      await saveSheetData('cms_medstock_data', stockData);
      await saveSheetData('cms_yearly_monthly_balance', monthlyBalanceData);
      gridDataRef.current = dailyData;

      alert(`Successfully reversed deduction for "${selectedRow.medicineName}"! Quantity restored to stock and outgoing removed from ledger.`);
      triggerRefresh();
    } catch (e) {
      alert('Error during undo: ' + e.message);
    }
  };

  // Auto-sync: Dispense → Daily Consume (every 10s)
  useEffect(() => {
    if (!autoExtractEnabled) return;
    handleExtractFromDispense(true); // run once on mount
    const interval = setInterval(() => handleExtractFromDispense(true), 10000);
    return () => clearInterval(interval);
  }, [autoExtractEnabled, currentStorageKey]);

  // Auto-sync: Daily Consume → Stock + Monthly Balance (every 15s)
  useEffect(() => {
    if (!autoDeductEnabled) return;
    handleSyncToInventory(true); // run once on mount
    const interval = setInterval(() => handleSyncToInventory(true), 15000);
    return () => clearInterval(interval);
  }, [autoDeductEnabled, currentStorageKey, selectedMonth]);

  const toggleAutoExtract = () => {
    const newVal = !autoExtractEnabled;
    setAutoExtractEnabled(newVal);
    const key = isMedicineConsume ? 'cms_dc_autoextract_med' : 'cms_dc_autoextract';
    localStorage.setItem(key, newVal.toString());
  };

  const toggleAutoDeduct = () => {
    const newVal = !autoDeductEnabled;
    setAutoDeductEnabled(newVal);
    const key = isMedicineConsume ? 'cms_dc_autodeduct_med' : 'cms_dc_autodeduct';
    localStorage.setItem(key, newVal.toString());
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 31 }, (_, i) => 2020 + i);

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top action bar - compacted to a single line for full screen grid experience */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '8px', 
        background: 'white', 
        padding: '8px 16px', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontSize: '18px', fontWeight: 700 }}>
            📋 {title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#64748b" />
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none', background: '#eff6ff', fontWeight: 700, color: '#1e40af' }} title="Focus on a specific day to optimize load speed">
              <option value="all">📅 Show Full Month (Slow)</option>
              {daysArray.map(d => <option key={d} value={d}>Day {d}</option>)}
            </select>
          </div>
          {/* Compact Inline Sync Status */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#64748b' }}>
            {lastExtractSync && (
              <span style={{ background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                🔄 Pull: {lastExtractSync}
              </span>
            )}
            {lastDeductSync && (
              <span style={{ background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                📦 Deduct: {lastDeductSync}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Auto-extract toggle */}
          <button
            onClick={toggleAutoExtract}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '4px 8px', borderRadius: '4px', border: 'none',
              background: autoExtractEnabled ? '#059669' : '#94a3b8',
              color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '11px',
              transition: 'all 0.2s'
            }}
            title={autoExtractEnabled ? 'Auto-extract from Dispense is ON' : 'Auto-extract from Dispense is OFF'}
          >
            ⚡ Ext: {autoExtractEnabled ? 'AUTO' : 'OFF'}
          </button>

          {/* Auto-deduct toggle */}
          <button
            onClick={toggleAutoDeduct}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '4px 8px', borderRadius: '4px', border: 'none',
              background: autoDeductEnabled ? '#2563eb' : '#94a3b8',
              color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '11px',
              transition: 'all 0.2s'
            }}
            title={autoDeductEnabled ? 'Auto-deduct from Stock is ON' : 'Auto-deduct from Stock is OFF'}
          >
            📦 Ded: {autoDeductEnabled ? 'AUTO' : 'OFF'}
          </button>

          {/* Manual extract button */}
          <button
            onClick={() => handleExtractFromDispense(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '5px 10px', borderRadius: '4px', border: 'none',
              background: '#8b5cf6', color: 'white', fontWeight: '700', cursor: 'pointer',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title="Manually extract new records from Dispense Log"
          >
            <ArrowDownToLine size={13} />
            Extract
          </button>

          {/* Undo deduction button */}
          <button
            onClick={handleUndoDeduction}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '4px 10px', borderRadius: '4px', border: '1px solid #dc2626',
              background: 'white', color: '#dc2626', fontWeight: '700', cursor: 'pointer',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title="Reverse a previously deducted medicine consumption"
          >
            Undo
          </button>

          {/* Manual sync button */}
          <button
            onClick={() => handleSyncToInventory(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '5px 10px', borderRadius: '4px', border: 'none',
              background: hasPending ? '#2563eb' : '#94a3b8',
              color: 'white', fontWeight: '700', cursor: hasPending ? 'pointer' : 'not-allowed',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title={hasPending ? "Deduct pending quantities from Medicine Stock" : "No pending items to sync"}
          >
            <ArrowDownToLine size={13} />
            {hasPending ? 'Sync & Deduct' : 'All Synced'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ExcelGrid 
          key={`${currentStorageKey}_${selectedDay}`}
          title={`${title} - ${selectedMonth} ${selectedYear}`}
          storageKey={currentStorageKey}
          initialData={initialData}
          columns={columns}
          idPrefix="DC-"
          getRowStyle={getRowStyle}
          computeRow={computeRowLocal}
          refreshTrigger={refreshTrigger}
          onDataChange={(cleanData) => {
            gridDataRef.current = cleanData;
          }}
          filters={[
            { key: 'status', label: 'All Statuses', options: ['Pending', 'Deducted'] }
          ]}
        />
      </div>
    </div>
  );
};

export default DailyConsume;
