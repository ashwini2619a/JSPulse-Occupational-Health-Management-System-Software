import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'sn', label: 'S.N.', letter: 'A', width: 70, type: 'number' },
  { key: 'location', label: 'Location', letter: 'B', width: 150, type: 'text' },
  { key: 'name', label: 'Name', letter: 'C', width: 150, type: 'text' },
  { key: 'eCode', label: 'E.Code', letter: 'D', width: 100, type: 'text' },
  { key: 'mobile', label: 'Mobile No.', letter: 'E', width: 120, type: 'text' },
  { key: 'cotton', label: 'Cotton', letter: 'F', width: 100, type: 'text' },
  { key: 'bandage', label: 'Bandage', letter: 'G', width: 100, type: 'text' },
  { key: 'handiplast', label: 'Handiplast', letter: 'H', width: 110, type: 'text' },
  { key: 'savlon', label: 'Savlon', letter: 'I', width: 100, type: 'text' },
  { key: 'bitadine', label: 'Bitadine', letter: 'J', width: 100, type: 'text' },
  { key: 'gloves', label: 'Gloves', letter: 'K', width: 100, type: 'text' },
  { key: 'papertape', label: 'Papertape', letter: 'L', width: 100, type: 'text' },
  { key: 'kulpaSoft', label: 'Kulpa-Soft', letter: 'M', width: 120, type: 'text' },
  { key: 'signPms', label: 'Sign of PMS', letter: 'N', width: 120, type: 'text' },
  { key: 'signature', label: 'Signature', letter: 'O', width: 120, type: 'text' }
];

const FirstAidBoxTracker = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="First Aid Box Location Tracker"
        storageKey="cms_firstaidbox_data"
        initialData={initialData}
        columns={columns}
        idPrefix=""
      />
    </div>
  );
};

export default FirstAidBoxTracker;
