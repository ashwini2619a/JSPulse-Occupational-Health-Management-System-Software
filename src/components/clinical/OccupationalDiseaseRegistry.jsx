import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'empName', label: 'Employee Name', letter: 'B', width: 160, type: 'text' },
  { key: 'department', label: 'Department', letter: 'C', width: 140, type: 'text' },
  { key: 'disease', label: 'Disease Diagnosed', letter: 'D', width: 160, type: 'text' },
  { key: 'dateDiagnosed', label: 'Date Diagnosed', letter: 'E', width: 140, type: 'date' },
  { key: 'status', label: 'Current Status', letter: 'F', width: 120, type: 'status', options: ['Active', 'Recovered', 'Chronic'] }
];

const OccupationalDiseaseRegistry = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Occupational Disease Registry"
        storageKey="cms_occ_disease_data"
        initialData={initialData}
        columns={columns}
        idPrefix="ODR-"
      />
    </div>
  );
};

export default OccupationalDiseaseRegistry;
