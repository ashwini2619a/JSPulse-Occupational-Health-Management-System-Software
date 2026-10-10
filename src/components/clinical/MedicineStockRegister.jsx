import React, { useState } from 'react';
import ExcelGrid from './ExcelGrid';
import { Info } from 'lucide-react';

const initialData = [];

const columns = [
  { key: 'id', label: 'ID', letter: 'A', width: 85, type: 'text' },
  { key: 'medicineName', label: 'Medicine Name', letter: 'B', width: 180, type: 'text' },
  { key: 'batchNo', label: 'Batch No.', letter: 'C', width: 120, type: 'text' },
  { key: 'manufacturer', label: 'Manufacturer', letter: 'D', width: 140, type: 'text' },
  { key: 'category', label: 'Category', letter: 'E', width: 140, type: 'select', options: [
    'Analgesic', 'Antibiotic', 'Antiseptic', 'Anti-inflammatory', 'Antihistamine', 'Antacid',
    'Antifungal', 'Cardiovascular', 'Respiratory', 'Ophthalmic', 'Dermatological',
    'Vaccine / Injection', 'ORS / Rehydration', 'Bandage / Dressing', 'Surgical Supplies',
    'Vitamin / Supplement', 'Emergency Drug', 'Controlled Drug', 'Other'
  ]},
  { key: 'quantity', label: 'Qty In Stock', letter: 'F', width: 100, type: 'number' },
  { key: 'unit', label: 'Unit', letter: 'G', width: 90, type: 'select', options: [
    'Tablets', 'Capsules', 'Bottles', 'Tubes', 'Strips', 'Pieces', 'Vials', 'Ampoules', 'Sachets', 'Syringes', 'Rolls', 'Packets'
  ]},
  { key: 'purchasePrice', label: 'Purchase ₹', letter: 'H', width: 100, type: 'number' },
  { key: 'mrp', label: 'MRP ₹', letter: 'I', width: 80, type: 'number' },
  { key: 'expiry', label: 'Expiry Date', letter: 'J', width: 120, type: 'date' },
  { key: 'expiryStatus', label: 'Expiry Status', letter: 'K', width: 150, type: 'text', readOnly: true },
  { key: 'location', label: 'Location / Rack', letter: 'L', width: 120, type: 'text' },
  { key: 'lastUpdated', label: 'Last Updated', letter: 'M', width: 120, type: 'date' }
];

const getRowStyle = (row) => {
  if (!row || typeof row !== 'object') return {};
  if (row.expiry) {
    const expDate = new Date(row.expiry);
    if (isNaN(expDate.getTime())) return {};
    const today = new Date();
    if (expDate < today) {
      return { background: '#7f1d1d', color: '#ffffff' };
    }
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return { background: '#fef2f2', color: '#dc2626' };
    }
    if (diffDays <= 90) {
      return { background: '#dcfce7', color: '#166534' };
    }
  }
  return {};
};

const computeRow = (row) => {
  const newRow = { ...row };
  if (newRow.expiry) {
    const expDate = new Date(newRow.expiry);
    if (isNaN(expDate.getTime())) {
      newRow.expiryStatus = '';
      return newRow;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      newRow.expiryStatus = `Expired by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      newRow.expiryStatus = `Expires Today!`;
    } else {
      newRow.expiryStatus = `Expiring in ${diffDays} days`;
    }
  } else {
    newRow.expiryStatus = '';
  }
  return newRow;
};

const MedicineStockRegister = () => {
  const [showLegend, setShowLegend] = useState(false);

  const legendButton = (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setShowLegend(!showLegend)}
        style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
        <Info size={16} />
      </button>
      
      {showLegend && (
        <div style={{ position: 'absolute', right: 0, top: '40px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, width: '320px', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e293b' }}>Row Colors Explained:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: '#7f1d1d', borderRadius: '4px', flexShrink: 0 }}></div>
              <span><b>Dark Red:</b> Medicine has Expired</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: '#fef2f2', border: '1px solid #dc2626', borderRadius: '4px', flexShrink: 0 }}></div>
              <span><b>Light Red:</b> Expiring in ≤ 30 days</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '4px', flexShrink: 0 }}></div>
              <span><b>Green:</b> Expiring in ≤ 90 days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Medicine Stock Register"
        storageKey="cms_medstock_data"
        initialData={initialData.map(computeRow)}
        columns={columns}
        idPrefix="MED-"
        getRowStyle={getRowStyle}
        computeRow={computeRow}
        toolbarRight={legendButton}
        filters={[
          { key: 'category', label: 'All Categories', options: [
            'Analgesic', 'Antibiotic', 'Antiseptic', 'Anti-inflammatory', 'Antihistamine', 'Antacid',
            'Antifungal', 'Cardiovascular', 'Respiratory', 'Ophthalmic', 'Dermatological',
            'Vaccine / Injection', 'ORS / Rehydration', 'Bandage / Dressing', 'Surgical Supplies',
            'Vitamin / Supplement', 'Emergency Drug', 'Controlled Drug', 'Other'
          ]},
          { key: 'unit', label: 'All Units', options: [
            'Tablets', 'Capsules', 'Bottles', 'Tubes', 'Strips', 'Pieces', 'Vials', 'Ampoules', 'Sachets', 'Syringes', 'Rolls', 'Packets'
          ]}
        ]}
      />
    </div>
  );
};

export default MedicineStockRegister;
