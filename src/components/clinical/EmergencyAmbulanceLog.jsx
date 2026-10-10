import React from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 80, type: 'text' },
  { key: 'dateTime', label: 'Date', letter: 'B', width: 140, type: 'date' },
  { key: 'patientName', label: 'Patient Name', letter: 'C', width: 160, type: 'text' },
  { key: 'nature', label: 'Nature of Emergency', letter: 'D', width: 160, type: 'select', options: ['Cardiac', 'Burns', 'Fracture', 'Chemical Exposure', 'Heat Stroke', 'Electric Shock', 'Fall from Height', 'Gas Inhalation', 'Eye Injury', 'Other'] },
  { key: 'location', label: 'Location', letter: 'E', width: 140, type: 'text' },
  { key: 'ambulance', label: 'Ambulance No.', letter: 'F', width: 120, type: 'text' },
  { key: 'referredTo', label: 'Referred To', letter: 'G', width: 160, type: 'text' },
  { key: 'status', label: 'Status', letter: 'H', width: 120, type: 'status', options: ['Dispatched', 'In Transit', 'Completed', 'Cancelled'] }
];

const EmergencyAmbulanceLog = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Emergency Ambulance Log"
        storageKey="cms_ambulance_data"
        initialData={initialData}
        columns={columns}
        idPrefix="AMB-"
      />
    </div>
  );
};

export default EmergencyAmbulanceLog;
