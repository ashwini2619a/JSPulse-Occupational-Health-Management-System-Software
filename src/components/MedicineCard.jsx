import React from 'react';
import { Pill, Calendar, Activity, Trash2 } from 'lucide-react';

const MedicineCard = ({ medicine, onDelete }) => {
  // Check if expiry date is near (within 30 days)
  const isExpiringSoon = () => {
    if (!medicine.expiry) return false;
    const expiryDate = new Date(medicine.expiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = () => {
    if (!medicine.expiry) return false;
    const expiryDate = new Date(medicine.expiry);
    const today = new Date();
    return expiryDate < today;
  };

  return (
    <div className="card" style={{ position: 'relative' }}>
      <button 
        className="btn-outline"
        onClick={() => onDelete(medicine.id)}
        style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', border: 'none' }}
        title="Delete Medicine"
      >
        <Trash2 size={18} className="text-danger" />
      </button>

      <div className="flex items-center gap-4 mb-4">
        <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
          <Pill size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{medicine.name}</h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{medicine.dosage} • {medicine.type}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ marginTop: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
          <span className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}><Activity size={16} /> Quantity In Stock</span>
          <span style={{ fontWeight: '600' }}>{medicine.quantity}</span>
        </div>
        
        <div className="flex justify-between items-center" style={{ paddingTop: '0.5rem' }}>
          <span className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}><Calendar size={16} /> Expiry Date</span>
          <span>
            {isExpired() ? (
              <span className="badge badge-warning" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>Expired</span>
            ) : isExpiringSoon() ? (
              <span className="badge badge-warning">Expiring Soon</span>
            ) : (
              <span className="badge badge-success">{medicine.expiry}</span>
            )}
          </span>
        </div>
      </div>
      
      {medicine.confidence && (
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
          AI Confidence: {(medicine.confidence * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default MedicineCard;
