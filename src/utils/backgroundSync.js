import { getSheetData, saveSheetData } from './sheetDB';

const getStockData = async () => {
  const data = await getSheetData('cms_medstock_data');
  return data || [];
};

const getDispenseData = async () => {
  const data = await getSheetData('cms_dispense_log');
  return data || [];
};

const getMonthlyBalanceData = async () => {
  const data = await getSheetData('cms_yearly_monthly_balance');
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
  cleaned = cleaned.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '');
  cleaned = cleaned.trim();
  if (!cleaned) return null;

  let quantity = 1;
  const parenMatch = cleaned.match(/\((?:qty:?\s*)?(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?|ml)?\)/i);
  if (parenMatch) {
    quantity = parseInt(parenMatch[1]) || 1;
    cleaned = cleaned.replace(parenMatch[0], '').trim();
  } else {
    const explicitMatch = cleaned.match(/(?:\b(?:qty|total):?\s*|[\s,x\*\-])+(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\b/i)
                       || cleaned.match(/(?:[\s,x\*\-])+(\d+)\s*$/);
    if (explicitMatch) {
      quantity = parseInt(explicitMatch[1]) || 1;
      cleaned = cleaned.replace(explicitMatch[0], '').trim();
    } else {
      const unitMatch = cleaned.match(/\b(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\b/i);
      if (unitMatch) {
        quantity = parseInt(unitMatch[1]) || 1;
        cleaned = cleaned.replace(unitMatch[0], '').trim();
      }
    }
  }

  cleaned = cleaned.replace(/^[\s,;\-\+]+|[\s,;\-\+]+$/g, '').trim();

  const freqRegex = /\b(bd|bid|tds|tid|od|qid|sos|hs|twice|thrice|once|daily|after\s+food|before\s+food|ac|pc|1x2|1x3|1x1|1x4)\b/i;
  const match = cleaned.match(freqRegex);
  
  let dosage = '';
  let medName = cleaned;

  if (match) {
    const idx = match.index;
    medName = cleaned.substring(0, idx).trim();
    dosage = cleaned.substring(idx).trim();
  }

  medName = medName.replace(/[\-\s\.,]+$/, '').trim();

  const prefixRegex = /^\s*\b(tab|caps?|syr|inj|liq|oint|drops?|t|c)\b\.?\s+/i;
  medName = medName.replace(prefixRegex, '').trim();

  const finalDosage = dosage ? `${dosage} x ${quantity}` : `x ${quantity}`;

  return {
    name: capitalizeName(medName || cleaned),
    dosage: finalDosage
  };
};

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

const parseExactDosageQuantity = (dosageStr) => {
  if (!dosageStr) return 1;
  const str = dosageStr.toLowerCase().trim();

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

  const hasDuration = /\b(?:day|week|month)s?\b/i.test(str);
  if (hasDuration) {
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

  return parseQuantity(dosageStr);
};

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

const getTargetSectionAndShift = (row, isMedicineConsume = false) => {
  let section = 'ohc';
  let shift = '1';

  const searchStr = [
    row.medicineConsumed,
    row.department,
    row.remarks,
    row.diagnosis,
    row.dispensedBy
  ].map(f => String(f || '').toLowerCase().trim()).join(' ');

  const hasWord = (words) => words.some(w => searchStr.includes(w));

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
      section = 'ohc';
    }
  }

  if (hasWord(['shift 1', 'shift a', 'shift_1', 'shift_a', 'shift-1', 'shift-a', ' 1st shift', 'a shift', 'shift: a', 'shift: 1'])) {
    shift = '1';
  } else if (hasWord(['shift 2', 'shift b', 'shift_2', 'shift_b', 'shift-2', 'shift-b', ' 2nd shift', 'b shift', 'shift: b', 'shift: 2'])) {
    shift = '2';
  } else if (hasWord(['shift 3', 'shift c', 'shift_3', 'shift_c', 'shift-3', 'shift-c', ' 3rd shift', 'c shift', 'shift: c', 'shift: 3'])) {
    shift = '3';
  } else if (hasWord(['shift 4', 'shift g', 'general shift', 'gen shift', 'shift_4', 'shift-4', 'g shift', 'shift: g', 'shift: 4'])) {
    shift = '4';
  } else {
    const dateStr = String(row.date || '');
    if (dateStr.includes('T')) {
      try {
        const timePart = dateStr.split('T')[1];
        const hours = parseInt(timePart.split(':')[0]);
        if (!isNaN(hours)) {
          if (hours >= 6 && hours < 14) {
            shift = '1';
          } else if (hours >= 14 && hours < 22) {
            shift = '2';
          } else if (hours >= 22 || hours < 6) {
            shift = '3';
          } else {
            shift = '4';
          }
        }
      } catch (e) {}
    } else {
      shift = '1';
    }
  }

  return { section, shift };
};

let _isSyncingGlobal = false;

export const runGlobalBackgroundSync = async () => {
  if (_isSyncingGlobal) return;
  _isSyncingGlobal = true;

  try {
    const autoExtractDaily = localStorage.getItem('cms_dc_autoextract') !== 'false';
    const autoDeductDaily = localStorage.getItem('cms_dc_autodeduct') !== 'false';
    
    const autoExtractMed = localStorage.getItem('cms_dc_autoextract_med') !== 'false';
    const autoDeductMed = localStorage.getItem('cms_dc_autodeduct_med') === 'true'; // default to false

    if (!autoExtractDaily && !autoDeductDaily && !autoExtractMed && !autoDeductMed) {
      _isSyncingGlobal = false;
      return;
    }

    const today = new Date();
    const selectedMonth = months[today.getMonth()];
    const selectedYear = today.getFullYear();

    let dispenseData = [];
    let stockData = [];
    let monthlyBalanceData = [];
    let hasDispenseChanges = false;
    let hasStockChanges = false;

    // --- Part A: Auto Extract ---
    if (autoExtractDaily || autoExtractMed) {
      dispenseData = await getDispenseData();
      stockData = await getStockData();

      // 1. Sync to Daily Consume (Original Columns/Logic)
      if (autoExtractDaily) {
        const dailyKey = `cms_monthly_consume_data_${selectedYear}_${selectedMonth}`;
        const dailyConsumeData = await getSheetData(dailyKey) || [];
        const dailySections = [
          { prefix: 'ohc', name: 'OHC Counter' },
          { prefix: 'dress', name: 'Dressing' },
          { prefix: 'life', name: 'Life Saving' },
          { prefix: 'first', name: 'First Aid' },
          { prefix: 'phys', name: 'Physiotherapy' },
          { prefix: 'pme', name: 'PME' },
          { prefix: 'exp', name: 'Exp.' }
        ];

        const computeDailyRow = (row) => {
          let grandTotal = 0;
          const newRow = { ...row };
          daysArray.forEach(d => {
            const pfx = `day${d}`;
            let dTotal = 0;
            dailySections.forEach(s => {
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

        let dailyPulled = 0;
        dispenseData.forEach(row => {
          if (row.medicineName && (!row.status || row.status === 'Pending')) {
            const rawMedText = row.medicineName;
            const lines = rawMedText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            const dosageLines = (row.dosage || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            const qtyLines = String(row.medicineQty || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            
            const dateObj = new Date(row.date || new Date());
            const day = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
            
            const { section, shift } = getTargetSectionAndShift(row, false);
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

              let consumeRow = dailyConsumeData.find(c => (c.medicineName || '').toLowerCase().trim() === medNameLower);
              
              let medType = '';
              const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
              if (stockItem) {
                medType = stockItem.unit || stockItem.category || '';
              }

              if (consumeRow) {
                const currentVal = parseInt(consumeRow[targetCell]) || 0;
                consumeRow[targetCell] = (currentVal + qty).toString();
                consumeRow.status = 'Pending';
                
                const updated = computeDailyRow(consumeRow);
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
                  dailySections.forEach(s => {
                    for (let i = 1; i <= 4; i++) {
                      newRow[`${pfx}_${s.prefix}_${i}`] = '';
                    }
                    newRow[`${pfx}_${s.prefix}_total`] = '0';
                  });
                  newRow[`${pfx}_total`] = '0';
                });
                
                newRow[targetCell] = qty.toString();
                newRow = computeDailyRow(newRow);
                dailyConsumeData.push(newRow);
              }
            });

            row.status = 'Pushed';
            dailyPulled++;
            hasDispenseChanges = true;
          }
        });

        if (dailyPulled > 0) {
          await saveSheetData(dailyKey, dailyConsumeData);
        }
      }

      // 2. Sync to Medicine Consume (Quantity and PME columns only)
      if (autoExtractMed) {
        const medKey = `cms_medicine_consume_data_${selectedYear}_${selectedMonth}`;
        const medConsumeData = await getSheetData(medKey) || [];
        const medSections = [
          { prefix: 'ohc', name: 'Quantity' }
        ];

        const computeMedRow = (row) => {
          let grandTotal = 0;
          const newRow = { ...row };
          daysArray.forEach(d => {
            const pfx = `day${d}`;
            let dTotal = 0;
            medSections.forEach(s => {
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

        let medPulled = 0;
        dispenseData.forEach(row => {
          if (row.medicineName && row.statusMed !== 'Pushed') {
            const rawMedText = row.medicineName;
            const lines = rawMedText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            const dosageLines = (row.dosage || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            const qtyLines = String(row.medicineQty || '').split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
            
            const dateObj = new Date(row.date || new Date());
            const day = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
            
            const { section, shift } = getTargetSectionAndShift(row, true);
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

              let consumeRow = medConsumeData.find(c => (c.medicineName || '').toLowerCase().trim() === medNameLower);
              
              let medType = '';
              const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
              if (stockItem) {
                medType = stockItem.unit || stockItem.category || '';
              }

              if (consumeRow) {
                const currentVal = parseInt(consumeRow[targetCell]) || 0;
                consumeRow[targetCell] = (currentVal + qty).toString();
                consumeRow.status = 'Pending';
                
                const updated = computeMedRow(consumeRow);
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
                  medSections.forEach(s => {
                    for (let i = 1; i <= 4; i++) {
                      newRow[`${pfx}_${s.prefix}_${i}`] = '';
                    }
                    newRow[`${pfx}_${s.prefix}_total`] = '0';
                  });
                  newRow[`${pfx}_total`] = '0';
                });
                
                newRow[targetCell] = qty.toString();
                newRow = computeMedRow(newRow);
                medConsumeData.push(newRow);
              }
            });

            row.statusMed = 'Pushed';
            medPulled++;
            hasDispenseChanges = true;
          }
        });

        if (medPulled > 0) {
          await saveSheetData(medKey, medConsumeData);
        }
      }

      if (hasDispenseChanges) {
        await saveSheetData('cms_dispense_log', dispenseData);
      }
    }

    // --- Part B: Auto Deduct ---
    if (autoDeductDaily || autoDeductMed) {
      stockData = await getStockData();
      monthlyBalanceData = await getMonthlyBalanceData();

      const deductPass = async (consumeData, storageKey) => {
        let updatedCount = 0;
        const monthPrefix = selectedMonth.substring(0, 3).toLowerCase();

        for (const row of consumeData) {
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
                stockItem = matchResult.items[0];
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
              }

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
            }
          }
        }

        if (updatedCount > 0) {
          await saveSheetData(storageKey, consumeData);
          hasStockChanges = true;
        }
      };

      if (autoDeductDaily) {
        const dailyKey = `cms_monthly_consume_data_${selectedYear}_${selectedMonth}`;
        const dailyConsumeData = await getSheetData(dailyKey) || [];
        await deductPass(dailyConsumeData, dailyKey);
      }

      if (autoDeductMed) {
        const medKey = `cms_medicine_consume_data_${selectedYear}_${selectedMonth}`;
        const medConsumeData = await getSheetData(medKey) || [];
        await deductPass(medConsumeData, medKey);
      }

      if (hasStockChanges) {
        await saveSheetData('cms_medstock_data', stockData);
        await saveSheetData('cms_yearly_monthly_balance', monthlyBalanceData);
      }
    }
  } catch (err) {
    console.error('[GlobalBackgroundSync] Error:', err);
  } finally {
    _isSyncingGlobal = false;
  }
};
