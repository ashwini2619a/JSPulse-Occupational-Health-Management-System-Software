import React, { useState } from 'react';
import ExcelGrid from './ExcelGrid';
import { getSheetData, saveSheetData, getSheetMeta, saveSheetMeta } from '../../utils/sheetDB';

const initialData = [];

const columns = [
  { key: 'date', label: 'Date', letter: 'A', width: 120, type: 'date' },
  { key: 'patientname', label: 'Patient Name', letter: 'B', width: 160, type: 'text' },
  { key: 'age', label: 'Age', letter: 'C', width: 80, type: 'number' },
  { key: 'gender', label: 'Gender', letter: 'D', width: 100, type: 'select', options: ['Male', 'Female', 'Other', 'Child'] },
  { key: 'department', label: 'Department', letter: 'E', width: 120, type: 'text' },
  { key: 'complaint', label: 'Complaint', letter: 'F', width: 150, type: 'text' },
  { key: 'diagnosis', label: 'Diagnosis', letter: 'G', width: 150, type: 'text' },
  { key: 'treatmentgiven', label: 'Treatment Given', letter: 'H', width: 150, type: 'text' },
  { key: 'medicineprescribed', label: 'Medicine Prescribed', letter: 'I', width: 150, type: 'text' },
  { key: 'referred', label: 'Referred', letter: 'J', width: 100, type: 'select', options: ['Yes', 'No'] },
  { key: 'doctorname', label: 'Doctor Name', letter: 'K', width: 120, type: 'text' },
  { key: 'remarks', label: 'Remarks', letter: 'L', width: 150, type: 'text' },
];

const PatientVisitFormModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    patientname: '',
    age: '',
    gender: 'Male',
    department: '',
    complaint: '',
    diagnosis: '',
    treatmentgiven: '',
    medicineprescribed: '',
    referred: 'No',
    doctorname: '',
    remarks: ''
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
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>🏥 Fill Patient Visit Form</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Date <span style={{color:'red'}}>*</span></label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Patient's Name <span style={{color:'red'}}>*</span></label>
            <input type="text" name="patientname" required value={formData.patientname} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Enter Patient Name" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Age" />
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
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Department" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Complaint</label>
            <input type="text" name="complaint" value={formData.complaint} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Chief Complaint" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Diagnosis</label>
            <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Diagnosis" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Treatment Given</label>
            <input type="text" name="treatmentgiven" value={formData.treatmentgiven} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Treatment Given" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Medicine Prescribed</label>
            <input type="text" name="medicineprescribed" value={formData.medicineprescribed} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Medicines" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Referred</label>
            <select name="referred" value={formData.referred} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Doctor Name</label>
            <input type="text" name="doctorname" value={formData.doctorname} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Doctor Name" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Remarks</label>
            <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="glass-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Remarks" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}>Save Visit Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientVisitLog = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSubmit = async (formData) => {
    try {
      const storageKey = 'cms_patient_visit_log';
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
      
      const newRow = {
        ...formData,
        id: `PV-${nextIdNum}`
      };
      
      const emptyIdx = data.findIndex(r => !columns.some(c => c.key !== 'id' && r[c.key]));
      if (emptyIdx !== -1) {
        data[emptyIdx] = newRow;
      } else {
        data.unshift(newRow);
      }

      await saveSheetData(activeStorageKey, data);
      await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum + 1);

      setShowForm(false);
      setRefreshTrigger(prev => prev + 1);
      alert('Patient Visit record added successfully!');
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
      <span style={{ fontSize: '18px' }}>+</span> Fill Visit Form
    </button>
  );

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      {showForm && <PatientVisitFormModal onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />}
      <ExcelGrid 
        title="Patient Visit Log"
        storageKey="cms_patient_visit_log"
        initialData={initialData}
        columns={columns}
        idPrefix="PV-"
        toolbarRight={formButton}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default PatientVisitLog;

