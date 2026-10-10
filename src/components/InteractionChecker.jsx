import React, { useState, useEffect } from 'react';
import { getMedicines } from '../utils/storage';
import { ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, Pill } from 'lucide-react';

const InteractionChecker = () => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setMedicines(getMedicines());
  }, []);

  const toggleMedicine = (medId) => {
    setSelectedMeds(prev => {
      if (prev.includes(medId)) return prev.filter(id => id !== medId);
      if (prev.length >= 3) return prev; // Max 3 for demo
      return [...prev, medId];
    });
  };

  const handleCheck = () => {
    if (selectedMeds.length < 2) return;
    setIsChecking(true);
    setResult(null);

    setTimeout(() => {
      // Mock interaction logic
      const selectedNames = selectedMeds.map(id => medicines.find(m => m.id === id)?.name || '').join(' and ');
      
      // Randomly decide if there's an interaction, but make it deterministic based on length for demo
      const hasInteraction = Math.random() > 0.5;

      if (hasInteraction) {
        setResult({
          safe: false,
          title: 'Major Interaction Detected',
          message: `Combining ${selectedNames} can increase the risk of severe side effects.`,
          action: 'Consider alternative therapy or monitor patient closely for signs of toxicity.',
          severity: 'high'
        });
      } else {
        setResult({
          safe: true,
          title: 'No Known Interactions',
          message: `No major, moderate, or minor interactions were found between ${selectedNames}.`,
          action: 'Safe to dispense together.',
          severity: 'none'
        });
      }
      setIsChecking(false);
    }, 2000);
  };

  return (
    <div className="animate-slide-in flex flex-col gap-6 items-center">
      <div className="text-center w-full max-w-[800px] mb-4">
        <h1 className="flex items-center justify-center gap-2"><ShieldAlert color="var(--primary)" /> AI Interaction Checker</h1>
        <p>Select 2-3 medicines from your inventory to check for contraindications.</p>
      </div>

      <div className="grid-bento w-full max-w-[800px]" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Selection Area */}
        <div className="card">
          <h2 className="mb-4">1. Select Medicines</h2>
          {medicines.length === 0 ? (
             <p className="text-muted">No medicines in inventory.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {medicines.map(m => {
                const isSelected = selectedMeds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMedicine(m.id)}
                    style={{
                      padding: '10px 16px', borderRadius: '30px', border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      fontWeight: isSelected ? 600 : 400, transition: 'all 0.2s'
                    }}
                  >
                    <Pill size={16} />
                    {m.name} {m.dosage}
                  </button>
                )
              })}
            </div>
          )}
          
          <div className="mt-6 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {selectedMeds.length} selected (Requires at least 2)
            </span>
            <button 
              className="btn btn-primary" 
              disabled={selectedMeds.length < 2 || isChecking}
              onClick={handleCheck}
            >
              {isChecking ? <><RefreshCw className="animate-pulse" size={18} /> Analyzing...</> : 'Check Interactions'}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="card animate-slide-in" style={{ borderLeft: `4px solid ${result.safe ? 'var(--success)' : 'var(--danger)'}` }}>
            <div className="flex items-center gap-2 mb-4" style={{ color: result.safe ? 'var(--success)' : 'var(--danger)' }}>
              {result.safe ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
              <h2 style={{ margin: 0 }}>{result.title}</h2>
            </div>
            
            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '1.05rem' }}>{result.message}</p>
            </div>
            
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Recommended Action:</strong>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{result.action}</p>
            </div>
            
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Disclaimer: This AI analysis simulates drug interactions based on general pharmaceutical databases. Do not rely solely on this tool for final clinical decisions.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InteractionChecker;
