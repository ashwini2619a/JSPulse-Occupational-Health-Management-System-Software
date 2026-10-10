import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, FilePlus, Eye } from 'lucide-react';
import { getSheetData, saveSheetData } from '../../utils/sheetDB';

const createEmptyRow = (id) => ({
  id,
  medicineName: '',
  type: '',
  data: {
    ohc1_1: '', ohc1_8: '', ohc1_15: '', ohc1_23: '',
    dc_1: '', dc_8: '', dc_15: '', dc_23: '',
    ls_15: '', ls_23: '',
    fa_1: '', fa_15: '',
    pt_8: '', pt_15: '', pt_23: '',
    pme_1: '',
    exp_30: '',
    ohc2_1: '', ohc2_8: '', ohc2_15: '', ohc2_23: ''
  }
});

const safeNum = (val) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const MedicineConsumptionGrid = () => {
  const [rows, setRows] = useState(() => {
    return Array.from({ length: 5 }).map((_, i) => createEmptyRow(Date.now() + i));
  });

  // Load saved data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await getSheetData('medicine_consumption_data');
        if (saved && Array.isArray(saved)) {
          setRows(saved);
        }
      } catch (e) {
        console.error('Error loading medicine consumption data:', e);
      }
    };
    loadData();
  }, []);

  const [medicineTypes, setMedicineTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('medicine_consumption_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['Tab', 'Cap', 'Syr', 'Inj', 'Oint', 'Drop', 'Other'];
  });

  useEffect(() => {
    const syncToConsume = async () => {
      await saveSheetData('medicine_consumption_data', rows);
    
      // Sync to DailyConsume for current month
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.toLocaleString('en-US', { month: 'long' });
        const targetKey = `cms_monthly_consume_data_${year}_${month}`;
        const consumeData = (await getSheetData(targetKey)) || [];
      
        const sections = [
          { prefix: 'ohc', name: 'OHC Counter' },
          { prefix: 'dress', name: 'Dressing' },
          { prefix: 'life', name: 'Life Saving' },
          { prefix: 'first', name: 'First Aid' },
          { prefix: 'phys', name: 'Physiotherapy' },
          { prefix: 'pme', name: 'PME' },
          { prefix: 'exp', name: 'Exp.' }
        ];
        const daysArray = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

        // Helper to compute a DailyConsume row
        const computeConsumeRow = (row) => {
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

        let modified = false;

        rows.forEach(gridRow => {
          if (!gridRow.medicineName || gridRow.medicineName.trim() === '') return;
          const medNameLower = gridRow.medicineName.toLowerCase().trim();

          let targetRow = consumeData.find(c => (c.medicineName || '').toLowerCase().trim() === medNameLower);
          if (!targetRow) {
            targetRow = {
              id: 'DC-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
              medicineName: gridRow.medicineName,
              type: gridRow.type || '',
              status: 'Pending'
            };
            // Initialize empty
            daysArray.forEach(d => {
              const pfx = `day${d}`;
              sections.forEach(s => {
                for (let i = 1; i <= 4; i++) {
                  targetRow[`${pfx}_${s.prefix}_${i}`] = '';
                }
                targetRow[`${pfx}_${s.prefix}_total`] = '0';
              });
              targetRow[`${pfx}_total`] = '0';
            });
            consumeData.push(targetRow);
          }

          // Map cells from gridRow.data to targetRow
          const mappings = [
            { from: 'ohc1_1', day: '1', sec: 'ohc', sub: '1' },
            { from: 'ohc1_8', day: '8', sec: 'ohc', sub: '1' },
            { from: 'ohc1_15', day: '15', sec: 'ohc', sub: '1' },
            { from: 'ohc1_23', day: '23', sec: 'ohc', sub: '1' },
          
            { from: 'dc_1', day: '1', sec: 'dress', sub: '1' },
            { from: 'dc_8', day: '8', sec: 'dress', sub: '1' },
            { from: 'dc_15', day: '15', sec: 'dress', sub: '1' },
            { from: 'dc_23', day: '23', sec: 'dress', sub: '1' },
          
            { from: 'ls_15', day: '15', sec: 'life', sub: '1' },
            { from: 'ls_23', day: '23', sec: 'life', sub: '1' },
          
            { from: 'fa_1', day: '1', sec: 'first', sub: '1' },
            { from: 'fa_15', day: '15', sec: 'first', sub: '1' },
          
            { from: 'pt_8', day: '8', sec: 'phys', sub: '1' },
            { from: 'pt_15', day: '15', sec: 'phys', sub: '1' },
            { from: 'pt_23', day: '23', sec: 'phys', sub: '1' },
          
            { from: 'pme_1', day: '1', sec: 'pme', sub: '1' },
            { from: 'exp_30', day: '30', sec: 'exp', sub: '1' },
          
            { from: 'ohc2_1', day: '1', sec: 'ohc', sub: '2' },
            { from: 'ohc2_8', day: '8', sec: 'ohc', sub: '2' },
            { from: 'ohc2_15', day: '15', sec: 'ohc', sub: '2' },
            { from: 'ohc2_23', day: '23', sec: 'ohc', sub: '2' },
          ];

          mappings.forEach(m => {
            const val = gridRow.data[m.from] || '';
            const targetCell = `day${m.day}_${m.sec}_${m.sub}`;
            if (targetRow[targetCell] !== val) {
              targetRow[targetCell] = val;
              modified = true;
            }
          });

          if (modified) {
            const updated = computeConsumeRow(targetRow);
            Object.assign(targetRow, updated);
            targetRow.status = 'Pending';
          }
        });

        if (modified) {
          await saveSheetData(targetKey, consumeData);
        }
      } catch (e) {
        console.error('Error syncing MedicineConsumptionGrid to DailyConsume:', e);
      }
    };
    syncToConsume();
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('medicine_consumption_types', JSON.stringify(medicineTypes));
  }, [medicineTypes]);

  const handleTypeChange = (rowId, value) => {
    let finalValue = value;
    if (value === 'Other') {
      const customVal = window.prompt("Enter new custom medicine type:");
      if (customVal && customVal.trim() !== '') {
        const trimmedVal = customVal.trim();
        const capitalizedVal = trimmedVal.charAt(0).toUpperCase() + trimmedVal.slice(1);
        if (!medicineTypes.includes(capitalizedVal)) {
          const newTypes = [...medicineTypes];
          const otherIdx = newTypes.indexOf('Other');
          if (otherIdx !== -1) {
            newTypes.splice(otherIdx, 0, capitalizedVal);
          } else {
            newTypes.push(capitalizedVal);
          }
          setMedicineTypes(newTypes);
        }
        finalValue = capitalizedVal;
      } else {
        finalValue = '';
      }
    }
    handleTextChange(rowId, 'type', finalValue);
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow(Date.now())]);
  };

  const deleteRow = (id) => {
    if (window.confirm('Delete this row completely?')) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleNewSheet = () => {
    if (window.confirm('Are you sure you want to create a new sheet? All current data will be cleared.')) {
      setRows(Array.from({ length: 5 }).map((_, i) => createEmptyRow(Date.now() + i)));
    }
  };

  const handleTextChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleDataChange = (id, dataField, value) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        return {
          ...r,
          data: { ...r.data, [dataField]: value }
        };
      }
      return r;
    }));
  };

  const renderCell = (row, fieldKey, isYellow = false, isGreen = false, isCalculated = false, computedValue = '') => {
    let background = 'white';
    if (isYellow) background = '#fef08a';
    if (isGreen) background = '#bbf7d0';

    return (
      <td style={{ minWidth: '45px', border: '1px solid #000', padding: '0', background, textAlign: 'center' }}>
        {isCalculated ? (
          <div style={{ padding: '4px', fontWeight: 600, color: '#1f2937', fontSize: '12px' }}>
            {computedValue || ''}
          </div>
        ) : (
          <input
            type="text"
            value={row.data[fieldKey]}
            onChange={(e) => handleDataChange(row.id, fieldKey, e.target.value)}
            style={{ 
              width: '100%', height: '100%', border: 'none', background: 'transparent', 
              textAlign: 'center', padding: '4px', fontSize: '12px', outline: 'none'
            }}
          />
        )}
      </td>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ flex: 1, overflow: 'auto', background: '#f1f5f9' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '12px', background: 'white' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {/* ROW 1 */}
            <tr>
              <th rowSpan={3} style={{ width: '40px', border: '1px solid #000', background: '#e2e8f0', position: 'sticky', left: 0, zIndex: 12 }}>Sr.</th>
              <th rowSpan={3} style={{ width: '200px', border: '1px solid #000', background: '#e2e8f0', position: 'sticky', left: '40px', zIndex: 12 }}>MEDICINE'S</th>
              <th rowSpan={3} style={{ width: '80px', border: '1px solid #000', background: '#e2e8f0', position: 'sticky', left: '240px', zIndex: 12 }}>Type</th>
              <th colSpan={29} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>April - 26</th>
              <th rowSpan={3} style={{ width: '40px', border: '1px solid #000', background: '#e2e8f0' }}></th>
            </tr>
            {/* ROW 2 */}
            <tr>
              <th colSpan={5} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>OHC Counter</th>
              <th colSpan={5} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Dressing/Casualty</th>
              <th colSpan={3} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Life Saving</th>
              <th colSpan={3} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>First Aid</th>
              <th colSpan={4} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Physiotherapy</th>
              <th colSpan={2} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>PME</th>
              <th colSpan={2} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Exp.</th>
              <th colSpan={1} style={{ border: '1px solid #000', background: '#bbf7d0', padding: '4px', textAlign: 'center' }}>TOTAL</th>
              <th colSpan={4} style={{ border: '1px solid #000', background: '#e2e8f0', padding: '4px', textAlign: 'center' }}>OHC Counter</th>
            </tr>
            {/* ROW 3 */}
            <tr>
              {/* OHC Counter 1 */}
              {['1', '8', '15', '23', 'T'].map(l => (
                <th key={'ohc1'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* Dressing/Casualty */}
              {['1', '8', '15', '23', 'T'].map(l => (
                <th key={'dc'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* Life Saving */}
              {['15', '23', 'T'].map(l => (
                <th key={'ls'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* First Aid */}
              {['1', '15', 'T'].map(l => (
                <th key={'fa'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* Physiotherapy */}
              {['8', '15', '23', 'T'].map(l => (
                <th key={'pt'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* PME */}
              {['1', 'T'].map(l => (
                <th key={'pme'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* Exp. */}
              {['30', 'T'].map(l => (
                <th key={'exp'+l} style={{ border: '1px solid #000', background: l==='T' ? '#fef08a' : '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
              {/* TOTAL */}
              <th style={{ border: '1px solid #000', background: '#bbf7d0', padding: '4px', minWidth: '50px', textAlign: 'center', fontWeight: 'bold' }}>T</th>
              {/* OHC Counter 2 */}
              {['1', '8', '15', '23'].map(l => (
                <th key={'ohc2'+l} style={{ border: '1px solid #000', background: '#f8fafc', padding: '4px', minWidth: '40px', textAlign: 'center' }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const d = row.data;
              const ohc1_T = safeNum(d.ohc1_1) + safeNum(d.ohc1_8) + safeNum(d.ohc1_15) + safeNum(d.ohc1_23);
              const ohc2_T = safeNum(d.ohc2_1) + safeNum(d.ohc2_8) + safeNum(d.ohc2_15) + safeNum(d.ohc2_23);
              const dc_T = safeNum(d.dc_1) + safeNum(d.dc_8) + safeNum(d.dc_15) + safeNum(d.dc_23);
              const ls_T = safeNum(d.ls_15) + safeNum(d.ls_23);
              const fa_T = safeNum(d.fa_1) + safeNum(d.fa_15);
              const pt_T = safeNum(d.pt_8) + safeNum(d.pt_15) + safeNum(d.pt_23);
              const pme_T = safeNum(d.pme_1);
              const exp_T = safeNum(d.exp_30);
              const total_T = ohc1_T + ohc2_T + dc_T + ls_T + fa_T + pt_T + pme_T + exp_T;

              return (
                <tr key={row.id}>
                  {/* Frozen Columns */}
                  <td style={{ border: '1px solid #000', background: '#f8fafc', textAlign: 'center', position: 'sticky', left: 0, zIndex: 5 }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000', background: '#fff', position: 'sticky', left: '40px', zIndex: 5 }}>
                    <input 
                      type="text" 
                      value={row.medicineName} 
                      onChange={(e) => handleTextChange(row.id, 'medicineName', e.target.value)}
                      style={{ width: '100%', height: '100%', border: 'none', padding: '6px', outline: 'none', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ border: '1px solid #000', background: '#fff', position: 'sticky', left: '240px', zIndex: 5 }}>
                    <select 
                      value={row.type} 
                      onChange={(e) => handleTypeChange(row.id, e.target.value)}
                      style={{ width: '100%', height: '100%', border: 'none', padding: '6px', outline: 'none', fontSize: '12px', background: 'transparent' }}
                    >
                      <option value=""></option>
                      {medicineTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>

                  {/* OHC Counter 1 */}
                  {renderCell(row, 'ohc1_1')}
                  {renderCell(row, 'ohc1_8')}
                  {renderCell(row, 'ohc1_15')}
                  {renderCell(row, 'ohc1_23')}
                  {renderCell(row, '', true, false, true, ohc1_T !== null && ohc1_T !== undefined ? ohc1_T : '')}

                  {/* Dressing/Casualty */}
                  {renderCell(row, 'dc_1')}
                  {renderCell(row, 'dc_8')}
                  {renderCell(row, 'dc_15')}
                  {renderCell(row, 'dc_23')}
                  {renderCell(row, '', true, false, true, dc_T !== null && dc_T !== undefined ? dc_T : '')}

                  {/* Life Saving */}
                  {renderCell(row, 'ls_15')}
                  {renderCell(row, 'ls_23')}
                  {renderCell(row, '', true, false, true, ls_T !== null && ls_T !== undefined ? ls_T : '')}

                  {/* First Aid */}
                  {renderCell(row, 'fa_1')}
                  {renderCell(row, 'fa_15')}
                  {renderCell(row, '', true, false, true, fa_T !== null && fa_T !== undefined ? fa_T : '')}

                  {/* Physiotherapy */}
                  {renderCell(row, 'pt_8')}
                  {renderCell(row, 'pt_15')}
                  {renderCell(row, 'pt_23')}
                  {renderCell(row, '', true, false, true, pt_T !== null && pt_T !== undefined ? pt_T : '')}

                  {/* PME */}
                  {renderCell(row, 'pme_1')}
                  {renderCell(row, '', true, false, true, pme_T !== null && pme_T !== undefined ? pme_T : '')}

                  {/* Exp. */}
                  {renderCell(row, 'exp_30')}
                  {renderCell(row, '', true, false, true, exp_T !== null && exp_T !== undefined ? exp_T : '')}

                  {/* TOTAL */}
                  {renderCell(row, '', false, true, true, total_T !== null && total_T !== undefined ? total_T : '')}

                  {/* OHC Counter 2 */}
                  {renderCell(row, 'ohc2_1')}
                  {renderCell(row, 'ohc2_8')}
                  {renderCell(row, 'ohc2_15')}
                  {renderCell(row, 'ohc2_23')}

                  <td className="print-hide" style={{ border: '1px solid #000', textAlign: 'center', background: '#fff' }}>
                    <button 
                      onClick={() => deleteRow(row.id)}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="print-hide" style={{ padding: '12px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
        <button 
          onClick={handleNewSheet}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <FilePlus size={18} /> New Sheet
        </button>
        <button 
          onClick={addRow}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Add Row
        </button>
        <button 
          onClick={() => {
            const isElectron = navigator.userAgent.toLowerCase().includes('electron');
            try {
              if (isElectron && window.electron) {
                window.electron.printCommand();
              } else if (isElectron && window['require']) {
                const { ipcRenderer } = window['require']('electron');
                ipcRenderer.send('print-command');
              } else if (!isElectron) {
                window.print();
              } else {
                alert("Print failed: Electron IPC not available. Please check contextBridge preload configurations.");
              }
            } catch (err) {
              console.error(err);
              if (!isElectron) {
                window.print();
              } else {
                alert("Print failed: " + err.message);
              }
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Printer size={18} /> Print
        </button>
        <button 
          onClick={() => {
            const isElectron = navigator.userAgent.toLowerCase().includes('electron');
            try {
              if (isElectron && window.electron && window.electron.previewPrint) {
                window.electron.previewPrint();
              } else if (isElectron && window['require']) {
                const { ipcRenderer } = window['require']('electron');
                ipcRenderer.send('preview-print');
              } else {
                window.print();
              }
            } catch (err) {
              console.error(err);
              alert("Preview failed: " + err.message);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f8fafc', color: '#1e40af', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Eye size={18} /> Print Preview
        </button>
      </div>
    </div>
  );
};

export default MedicineConsumptionGrid;
