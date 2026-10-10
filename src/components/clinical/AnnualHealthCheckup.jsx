import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'empId', label: 'Emp ID', letter: 'B', width: 100, type: 'text' },
  { key: 'empName', label: 'Employee Name', letter: 'C', width: 160, type: 'text' },
  { key: 'department', label: 'Department', letter: 'D', width: 140, type: 'text' },
  { key: 'checkupDate', label: 'Checkup Date', letter: 'E', width: 120, type: 'date' },
  { key: 'nextDueDate', label: 'Next Due Date', letter: 'F', width: 120, type: 'date' },
  { key: 'vision', label: 'Vision Test', letter: 'G', width: 100, type: 'select', options: ['Pass', 'Fail'] },
  { key: 'hearing', label: 'Hearing Test', letter: 'H', width: 100, type: 'select', options: ['Pass', 'Fail'] },
  { key: 'lung', label: 'Lung Function', letter: 'I', width: 120, type: 'select', options: ['Normal', 'Abnormal'] },
  { key: 'blood', label: 'Blood Test', letter: 'J', width: 100, type: 'select', options: ['Normal', 'Abnormal'] },
  { key: 'xray', label: 'X-Ray', letter: 'K', width: 100, type: 'select', options: ['Normal', 'Abnormal'] },
  { key: 'status', label: 'Overall Status', letter: 'L', width: 120, type: 'status', options: ['Fit', 'Unfit', 'Review'] }
];

const getRowStyle = (row) => {
  if (!row) return {};
  if (row.nextDueDate) {
    const dueDate = new Date(row.nextDueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { background: '#fef2f2', color: '#dc2626' }; // Overdue: Red
    } else if (diffDays <= 30) {
      return { background: '#fef9c3', color: '#b45309' }; // Due soon: Yellow
    }
  }
  return {};
};

const AnnualHealthCheckup = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Annual Health Checkup"
        storageKey="cms_ahc_data"
        initialData={initialData}
        columns={columns}
        idPrefix="AHC-"
        getRowStyle={getRowStyle}
      />
    </div>
  );
};

export default AnnualHealthCheckup;
