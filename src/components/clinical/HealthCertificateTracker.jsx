import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'empName', label: 'Employee Name', letter: 'B', width: 160, type: 'text' },
  { key: 'certType', label: 'Certificate Type', letter: 'C', width: 160, type: 'text' },
  { key: 'issueDate', label: 'Issue Date', letter: 'D', width: 120, type: 'date' },
  { key: 'validUntil', label: 'Valid Until', letter: 'E', width: 120, type: 'date' },
  { key: 'status', label: 'Validity Status', letter: 'F', width: 120, type: 'status', options: ['Active', 'Expired'] }
];

const getRowStyle = (row) => {
  if (!row) return {};
  if (row.validUntil) {
    const validUntil = new Date(row.validUntil);
    const today = new Date();
    if (validUntil < today) {
      return { background: '#fef2f2', color: '#dc2626' }; // Expired: Red
    }
  }
  return {};
};

const HealthCertificateTracker = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Health Certificate Tracker"
        storageKey="cms_health_cert_data"
        initialData={initialData}
        columns={columns}
        idPrefix="HC-"
        getRowStyle={getRowStyle}
      />
    </div>
  );
};

export default HealthCertificateTracker;
