import React, { useState, useCallback } from 'react';
import ExcelGrid from './ExcelGrid';
import { getSheetData, saveSheetData, getSheetMeta, saveSheetMeta } from '../../utils/sheetDB';

const initialData = [];

const columns = [
  // 1. Encounter Info
  { key: 'date', label: 'Date', letter: 'A', width: 120, type: 'date' },
  { key: 'regdNo', label: 'Regd. No.', letter: 'B', width: 120, type: 'text' },
  
  // 2. Patient Demographics
  { key: 'patientName', label: "Patient's Name", letter: 'C', width: 180, type: 'text' },
  { key: 'age', label: 'Age', letter: 'D', width: 80, type: 'text' },
  { key: 'gender', label: 'Gender', letter: 'E', width: 90, type: 'select', options: ['Male', 'Female', 'Other', 'Child'] },
  { key: 'phoneNo', label: 'Phone No.', letter: 'F', width: 120, type: 'text' },
  
  // 3. Employment Details
  { key: 'contractor', label: 'Contractor/Company', letter: 'G', width: 150, type: 'text' },
  { key: 'empCode', label: 'Emp.Code', letter: 'H', width: 100, type: 'text' },
  { key: 'department', label: 'Department', letter: 'I', width: 120, type: 'text' },
  { key: 'service', label: 'Service', letter: 'J', width: 120, type: 'text' },
  
  // 4. Vitals
  { key: 'vitalsTemp', label: 'Temp', letter: 'K', width: 80, type: 'text' },
  { key: 'vitalsSPO2', label: 'SPO2', letter: 'L', width: 80, type: 'text' },
  { key: 'vitalsPR', label: 'PR', letter: 'M', width: 80, type: 'text' },
  { key: 'vitalsBP', label: 'BP', letter: 'N', width: 80, type: 'text' },
  { key: 'vitalsWt', label: 'Wt', letter: 'O', width: 80, type: 'text' },
  
  // 5. Clinical Notes
  { key: 'investigation', label: 'Investigation', letter: 'P', width: 200, type: 'text' },
  { key: 'diagnosis', label: 'Diagnosis', letter: 'Q', width: 150, type: 'text' },
  { key: 'medicinesDetails', label: 'Medicines Details', letter: 'R', width: 250, type: 'text' },
  { key: 'medicineQty', label: 'Quantity', letter: 'S', width: 100, type: 'text' },
  
  // 6. Administration
  { key: 'drName', label: 'Dr.Name', letter: 'T', width: 120, type: 'text' },
  { key: 'totalCharge', label: 'Total Charge', letter: 'U', width: 100, type: 'number' },
  { key: 'doneBy', label: 'Done By', letter: 'V', width: 100, type: 'text' },
  { key: 'remarks', label: 'Remarks', letter: 'W', width: 200, type: 'text' }
];

const OPDFormModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    empCode: '',
    patientName: '',
    department: '',
    age: '',
    gender: 'Male',
    phoneNo: '',
    drName: '',
    diagnosis: '',
    medicinesDetails: '',
    medicineQty: '',
    totalCharge: '',
    doneBy: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card animate-slide-in" style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📋 Fill OPD Form</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Date <span style={{color:'red'}}>*</span></label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Patient's Name <span style={{color:'red'}}>*</span></label>
            <input type="text" name="patientName" required value={formData.patientName} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Enter Patient Name" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Emp.Code</label>
            <input type="text" name="empCode" value={formData.empCode} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Enter Emp Code" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Department" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Age</label>
            <input type="text" name="age" value={formData.age} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="e.g. 35/M" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Child">Child</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Phone No.</label>
            <input type="text" name="phoneNo" value={formData.phoneNo} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Phone Number" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Dr.Name</label>
            <input type="text" name="drName" value={formData.drName} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Doctor Name" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Diagnosis</label>
            <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Enter Diagnosis" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Medicines Details</label>
            <textarea name="medicinesDetails" value={formData.medicinesDetails} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical' }} placeholder="List medicines prescribed" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Quantity</label>
            <input type="text" name="medicineQty" value={formData.medicineQty} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Enter Quantity (e.g. 10,20,30)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Total Charge</label>
            <input type="number" name="totalCharge" value={formData.totalCharge} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Amount" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}>Save OPD Record</button>
          </div>
        </form>
      </div>
    </div>
  );
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

const DailyOPDTally = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    // No-op: columns migration removed, all columns are now valid
  }, []);

  const computeRow = useCallback((row) => {
    const newRow = { ...row };
    const meds = newRow.medicinesDetails || '';
    if (meds !== newRow._lastParsedMeds) {
      newRow.medicineQty = extractQuantities(meds);
      newRow._lastParsedMeds = meds;
    }
    return newRow;
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      const storageKey = 'cms_daily_opd_sheet';
      const activeId = localStorage.getItem(`${storageKey}_active_tab_id`) || 'default';
      
      let activeStorageKey = storageKey;
      if (activeId !== 'default') {
         const savedIndex = localStorage.getItem(`${storageKey}_tabs_index`);
         if (savedIndex) {
           const parsed = JSON.parse(savedIndex);
           const found = parsed.find(t => t && t.id === activeId);
           if (found) activeStorageKey = found.storageKey;
         }
      }

      let data = await getSheetData(activeStorageKey) || [];
      let nextIdNum = await getSheetMeta(`${activeStorageKey}_nextid`) || 1;
      
      const finalQty = (formData.medicineQty || '').trim() || extractQuantities(formData.medicinesDetails);

      const newRow = {
        ...formData,
        medicineQty: finalQty,
        _lastParsedMeds: formData.medicinesDetails,
        id: `OPD-${String(nextIdNum).padStart(3, '0')}`
      };
      
      // Find first empty row or append
      const emptyIdx = data.findIndex(r => !columns.some(c => c.key !== 'id' && r[c.key]));
      if (emptyIdx !== -1) {
        data[emptyIdx] = newRow;
      } else {
        data.unshift(newRow); // Add to top if no empty rows
      }

      await saveSheetData(activeStorageKey, data);
      await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum + 1);

      setShowForm(false);
      setRefreshTrigger(prev => prev + 1);
      alert('OPD record added successfully!');
    } catch (e) {
      console.error(e);
      alert('Error saving form data.');
    }
  };

  const formButton = (
    <button 
      onClick={() => setShowForm(true)} 
      style={{ 
        padding: '8px 16px', 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: 'pointer', 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)'
      }}
    >
      <span style={{ fontSize: '18px' }}>+</span> Fill OPD Form
    </button>
  );

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      {showForm && <OPDFormModal onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />}
      <ExcelGrid 
        title="Daily OPD Log"
        storageKey="cms_daily_opd_sheet"
        initialData={initialData}
        columns={columns}
        idPrefix="OPD-"
        toolbarRight={formButton}
        refreshTrigger={refreshTrigger}
        computeRow={computeRow}
      />
    </div>
  );
};

export default DailyOPDTally;
