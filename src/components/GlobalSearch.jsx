import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, User, Package, ShieldAlert, ChevronRight, Activity, Users, Stethoscope, BriefcaseMedical } from 'lucide-react';

const GlobalSearch = ({ isOpen, onClose, setCurrentView }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Map of local storage keys to their human-readable names and target views
  const dataSources = {
    'cms_medstock_data': { name: 'Medicine Stock', view: 'inventory', icon: Package, color: '#3b82f6' },
    'cms_patient_visit_log': { name: 'Patient Visit Log', view: 'patient', icon: User, color: '#10b981' },
    'cms_injury_data': { name: 'Injury Reports', view: 'clinical', tab: 'injury', icon: ShieldAlert, color: '#ef4444' },
    'cms_vitals_data': { name: 'Vital Signs', view: 'clinical', tab: 'vitals', icon: Activity, color: '#f43f5e' },
    'cms_employee_health': { name: 'Employee Health', view: 'clinical', tab: 'employee', icon: Users, color: '#2563eb' },
    'cms_checkup_data': { name: 'Annual Checkups', view: 'clinical', tab: 'checkup', icon: Stethoscope, color: '#f59e0b' },
    'cms_occ_disease_data': { name: 'Occ. Diseases', view: 'clinical', tab: 'disease', icon: BriefcaseMedical, color: '#8b5cf6' },
    'cms_ambulance_data': { name: 'Emergency Ambulance Log', view: 'clinical', tab: 'ambulance', icon: Activity, color: '#ef4444' },
    'cms_firstaidbox_data': { name: 'First Aid Box Tracker', view: 'clinical', tab: 'firstaidbox', icon: Package, color: '#d97706' },
    'cms_daily_opd_sheet': { name: 'Daily OPD Log', view: 'opd', icon: FileText, color: '#eab308' },
    'cms_dispense_log': { name: 'Dispense Log', view: 'dispense', icon: Stethoscope, color: '#3b82f6' },
    'first_aid_records': { name: 'First Aid Billings', view: 'firstaid', icon: FileText, color: '#10b981' }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setQuery(term);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {

    const searchTerm = term.toLowerCase();
    const foundResults = [];
    const MAX_RESULTS = 100;

    // Search across all localStorage keys dynamically
    for (let i = 0; i < localStorage.length; i++) {
      if (foundResults.length >= MAX_RESULTS) break;
      const key = localStorage.key(i);
      
      // Find matching dataSource metadata template
      let matchedSourceKey = null;
      for (const sourceKey of Object.keys(dataSources)) {
        if (key === sourceKey || key.startsWith(`${sourceKey}_tab_`)) {
          matchedSourceKey = sourceKey;
          break;
        }
      }
      
      if (!matchedSourceKey) continue;
      
      const meta = dataSources[matchedSourceKey];

      try {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          const parsedData = JSON.parse(rawData);
          if (Array.isArray(parsedData)) {
            for (let ri = 0; ri < parsedData.length; ri++) {
              if (foundResults.length >= MAX_RESULTS) break;
              const record = parsedData[ri];
              if (!record) continue;
              // Convert record values to a single searchable string, filtering out objects/arrays
              const recordString = Object.values(record)
                .filter(val => val !== null && val !== undefined && typeof val !== 'object')
                .map(val => String(val).toLowerCase())
                .join(' ');

              if (recordString.includes(searchTerm)) {
                // Determine a sensible title for the record based on common keys
                let title = record.patientName || record.employeeName || record.patientname || record.empName || record.medicineName || record.name || `Record #${ri + 1}`;
                if (record.id || record.empCode || record.empId || record['s.n']) {
                  title += ` (ID: ${record.id || record.empCode || record.empId || record['s.n']})`;
                }

                // Extract a snippet containing the match
                let matchSnippet = '';
                for (const [k, v] of Object.entries(record)) {
                  if (k.startsWith('_') || k === 'id') continue;
                  if (typeof v === 'object') continue;
                  const valStr = String(v);
                  if (valStr.toLowerCase().includes(searchTerm)) {
                    matchSnippet = `${k.replace(/([A-Z])/g, ' $1').trim()}: ${valStr}`;
                    break;
                  }
                }
                if (!matchSnippet) matchSnippet = 'Match found in record data';

                foundResults.push({
                  id: `${key}-${ri}`,
                  sourceKey: key,
                  meta: meta,
                  title: title,
                  snippet: matchSnippet,
                  record: record
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing ${key} during search`, err);
      }
    }

      setResults(foundResults);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '80px', padding: '80px 20px 20px 20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white', width: '100%', maxWidth: '700px', borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Search size={24} color="#64748b" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, medicines, employees, records..."
            value={query}
            onChange={handleSearch}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: '18px', color: '#0f172a',
              background: 'transparent', padding: '8px 0'
            }}
          />
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px',
            color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <kbd style={{ fontFamily: 'inherit' }}>ESC</kbd>
          </button>
        </div>

        {/* Search Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#f8fafc' }}>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              Type at least 2 characters to search...
            </div>
          )}
          
          {query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <Search size={48} color="#cbd5e1" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '18px' }}>No results found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>We couldn't find anything matching "{query}" across the system.</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map(result => {
                  const Icon = result.meta.icon;
                  return (
                    <div 
                      key={result.id}
                      onClick={() => {
                        if (result.meta.view === 'clinical' && result.meta.tab) {
                          localStorage.setItem('cms_active_clinical_tab', result.meta.tab);
                        }
                        setCurrentView(result.meta.view);
                        onClose();
                      }}
                      style={{
                        background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '8px', 
                        background: `${result.meta.color}15`, color: result.meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {result.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontWeight: 500, color: result.meta.color }}>{result.meta.name}</span>
                          <span style={{ margin: '0 6px', color: '#cbd5e1' }}>•</span>
                          {result.snippet}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#cbd5e1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
