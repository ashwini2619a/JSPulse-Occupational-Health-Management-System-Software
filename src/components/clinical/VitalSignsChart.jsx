import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'patientName', label: 'Patient Name', letter: 'B', width: 160, type: 'text' },
  { key: 'dateTime', label: 'Date', letter: 'C', width: 160, type: 'date' },
  { key: 'bp', label: 'Blood Pressure', letter: 'D', width: 120, type: 'text' },
  { key: 'pulse', label: 'Pulse Rate', letter: 'E', width: 100, type: 'number' },
  { key: 'temp', label: 'Temperature', letter: 'F', width: 120, type: 'number' },
  { key: 'spo2', label: 'SpO2 (%)', letter: 'G', width: 100, type: 'number' },
  { key: 'sugar', label: 'Blood Sugar', letter: 'H', width: 100, type: 'number' },
  { key: 'weight', label: 'Weight (kg)', letter: 'I', width: 100, type: 'number' },
  { key: 'remarks', label: 'Remarks', letter: 'J', width: 200, type: 'text' }
];

const getCustomCellContent = (col, value) => {
  if (!value) return null;
  let isAbnormal = false;
  if (col.key === 'bp' && String(value).includes('/')) {
    const parts = String(value).split('/');
    if (parseInt(parts[0]) > 140 || parseInt(parts[0]) < 90) isAbnormal = true;
  }
  if (col.key === 'pulse' && (value < 60 || value > 100)) isAbnormal = true;
  if (col.key === 'temp' && (value > 99.5 || value < 96.0)) isAbnormal = true;
  if (col.key === 'spo2' && value < 95) isAbnormal = true;
  if (col.key === 'sugar' && (value > 200 || value < 70)) isAbnormal = true;
  
  if (isAbnormal) return <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{value}</span>;
  return null; // Fallback to default render
};

const VitalSignsChart = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Vital Signs Chart"
        storageKey="cms_vitals_data"
        initialData={initialData}
        columns={columns}
        idPrefix="VIT-"
        getCustomCellContent={getCustomCellContent}
      />
    </div>
  );
};

export default VitalSignsChart;
