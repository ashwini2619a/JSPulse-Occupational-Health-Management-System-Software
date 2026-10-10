import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'Emp ID', letter: 'A', width: 100, type: 'text' },
  { key: 'name', label: 'Employee Name', letter: 'B', width: 160, type: 'text' },
  { key: 'department', label: 'Department', letter: 'C', width: 140, type: 'select', options: ['Blast Furnace', 'Rolling Mill', 'Coke Oven', 'Sinter Plant', 'Power Plant', 'Admin'] },
  { key: 'designation', label: 'Designation', letter: 'D', width: 140, type: 'text' },
  { key: 'doj', label: 'Date of Joining', letter: 'E', width: 120, type: 'date' },
  { key: 'bloodGroup', label: 'Blood Group', letter: 'F', width: 100, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  { key: 'conditions', label: 'Pre-Existing Conditions', letter: 'G', width: 180, type: 'text' },
  { key: 'allergies', label: 'Allergies', letter: 'H', width: 120, type: 'text' },
  { key: 'emergency', label: 'Emergency Contact', letter: 'I', width: 140, type: 'text' },
  { key: 'lastExam', label: 'Last Medical Exam', letter: 'J', width: 120, type: 'date' },
  { key: 'status', label: 'Fitness Status', letter: 'K', width: 120, type: 'status', options: ['Fit', 'Unfit', 'Conditional'] }
];

const EmployeeHealthRecords = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Employee Health Records"
        storageKey="cms_emp_health_data"
        initialData={initialData}
        columns={columns}
        idPrefix="EMP-"
      />
    </div>
  );
};

export default EmployeeHealthRecords;
