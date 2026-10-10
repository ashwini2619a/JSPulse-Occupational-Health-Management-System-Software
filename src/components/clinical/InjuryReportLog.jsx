import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'date', label: 'Date', letter: 'B', width: 120, type: 'date' },
  { key: 'employeeName', label: 'Employee Name', letter: 'C', width: 160, type: 'text' },
  { key: 'department', label: 'Department', letter: 'D', width: 120, type: 'text' },
  { key: 'natureOfInjury', label: 'Nature of Injury', letter: 'E', width: 150, type: 'text' },
  { key: 'bodyPart', label: 'Body Part Affected', letter: 'F', width: 150, type: 'text' },
  { key: 'firstAid', label: 'First Aid Given', letter: 'G', width: 150, type: 'text' },
  { key: 'referred', label: 'Referred to Hospital', letter: 'H', width: 120, type: 'select', options: ['No', 'Yes'] },
  { key: 'reportedBy', label: 'Reported By', letter: 'I', width: 120, type: 'text' },
  { key: 'status', label: 'Status', letter: 'J', width: 100, type: 'status', options: ['Open', 'Closed'] }
];

const InjuryReportLog = () => {
  React.useEffect(() => {
    try {
      const keys = ['cms_injury_data'];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cms_injury_data_tab_')) {
          keys.push(k);
        }
      }
      keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.map(row => {
              if (!row) return row;
              const newRow = { ...row };
              delete newRow._cellStyles;
              return newRow;
            });
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        }
      });
      console.log("Cleaned Injury Report styling highlights.");
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Injury Report Log"
        storageKey="cms_injury_data"
        initialData={initialData}
        columns={columns}
        idPrefix="INJ-"
      />
    </div>
  );
};

export default InjuryReportLog;
