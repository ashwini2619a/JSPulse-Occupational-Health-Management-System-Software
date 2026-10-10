import { useState, useEffect, useRef } from 'react';
import { Printer, RefreshCcw, Settings, Save, X } from 'lucide-react';
import { getSheetData, saveSheetData, getSheetMeta, saveSheetMeta } from '../../utils/sheetDB';

const JindalLogo = ({ style }) => (
  <svg 
    viewBox="0 0 594 316" 
    style={{ ...style, display: 'block' }} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M383.5 125.1C372.8 152.9 389.6 139.4 443.9 107.8C493.4 79.1 524.7 57.6 540.1 28.4C542.3 76 517.2 102.7 427.9 157.6C374.1 190.7 355.1 197.7 360.7 177.2C363.9 165.5 366.6 157.5 369.1 150.3C369.3 149.9 369 150.7 369.1 150.3C376.5 137.1 379.2 133.1 383.5 125.1Z" fill="#58AB40"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M341.8 88.7C350.8 85.8 362.9 83 374.8 80.3C408 72.9 396.6 98.5 383.3 125.6C379.2 134 376.5 137.1 369.2 150.3C374.4 134.1 380.5 125 368.5 127C356.1 129 342.6 132.9 331.8 136.3L341.8 88.7Z" fill="#F58220"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M293.9 228.5C290.4 227.1 286.7 226.3 283 226.3C275.5 226.3 268 231 268 239.3C268 251.9 283.5 250.3 283.5 259.6C283.5 263.4 280.6 267.7 273.7 267.7C270.5 267.7 266.8 266.5 264.1 264.8L262 270.8C265.7 272.2 269.4 273.4 274.7 273.4C285.6 273.4 290.4 265.6 290.4 258.8C290.4 246.9 274.9 246.8 274.9 239.2C274.9 233.8 279.6 232.1 283.9 232.1C287.4 232.1 290 233 292.2 234.3L293.9 228.5Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M334.1 227.1H299.3L298.1 232.9H312.2L303.7 272.6H310.2L318.8 232.9H332.9L334.1 227.1Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M330.7 272.6H356.4L357.6 266.9H338.6L341.9 251.9H358.9L360.1 246.1H343.2L346.1 232.9H364.1L365.4 227.1H340.7L330.7 272.6Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M366.7 272.6H392.3L393.6 266.9H374.5L377.8 251.9H394.9L396 246.1H379.1L382 232.9H400L401.3 227.1H376.6L366.7 272.6Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M402.3 272.6H427.9L429 266.9H410.2L418.8 227.1H412.2L402.3 272.6Z" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M114 210L125.8 153.6H141.1L164.6 184.1H165L171.4 153.6H188.3L176.4 210H160.5L137.3 180.3H137.1L130.8 210H114Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M186.8 210L198.6 153.6H228.4C246.9 153.6 256.4 165.1 252.6 183.3C248.3 203.9 233.3 210 212.8 210H186.8ZM215.3 166.2L208.7 197.3H211.8C224.8 197.1 230.4 193.5 232.8 182C235.3 170 230 166.2 218.3 166.2H215.3Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M244 210L281.8 153.6H302.6L312.8 210H291.4L286.5 175.6L286.3 175.5L264.9 210H244Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M316 210L327.9 153.6H347.3L338 197.3H360.7L358.1 210H316Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M84.2998 210L96.1998 153.6H115.5L103.6 210H84.2998Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M244 210L281.8 153.6H302.6L312.8 210H291.4L286.5 175.6L286.3 175.5L264.9 210H244Z" fill="#636467"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24.5998 205.4C52.5998 211.4 54.6998 196 56.4998 188.5C58.2998 181 66.9998 139.6 66.9998 139.6H88.7998C88.7998 139.6 82.9998 167 77.7998 191.8C73.9998 209.1 60.7998 222.1 37.3998 220.5C30.4998 220 24.7998 217.7 22.0998 215.6C22.0998 215.6 20.4998 214.5 20.2998 214.3L22.9998 205C23.1998 205.1 24.1998 205.3 24.5998 205.4Z" fill="#636467"/>
  </svg>
);

const extractQuantities = (medsText) => {
  if (!medsText) return '';
  const lines = String(medsText).split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  const quantities = lines.map(line => {
    // Strip list prefixes like "1. ", "2) ", "* ", etc.
    let cleaned = line.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '').trim();
    if (!cleaned) return '';
    
    // Look for explicit quantity after separators like '-' or ':' or '*' or 'x' or 'qty:'
    const match = cleaned.match(/(?:-|\bx\b|\bqty:?|\btotal:?|:)\s*(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?|ml)?\s*$/i)
               || cleaned.match(/\((\d+)\)\s*$/)
               || cleaned.match(/\b(\d+)\s*(?:tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\s*$/i)
               || cleaned.match(/\s+(\d+)\s*$/); // trailing number at the end
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback: search for any number that is not parts of strength (like 500mg, 10ml, etc.)
    const numbers = cleaned.match(/\b\d+\b/g);
    if (numbers) {
      const filtered = numbers.filter(n => {
        const idx = cleaned.indexOf(n);
        const after = cleaned.substring(idx + n.length, idx + n.length + 5).toLowerCase();
        return !after.startsWith('mg') && !after.startsWith('ml') && !after.startsWith('g');
      });
      if (filtered.length > 0) {
        return filtered[filtered.length - 1]; // pick the last number
      }
    }
    
    return '1'; // default quantity is 1 if not specified
  });
  
  return quantities.filter(Boolean).join(',');
};

const generateCardId = () => Date.now();

const OPDCardPrintable = () => {
  const [printScale, setPrintScale] = useState(1);
  const [toast, setToast] = useState('');
  
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem('opd_cards_list');
      return saved ? JSON.parse(saved) : [{ id: 1, title: 'Card 1' }];
    } catch {
      return [{ id: 1, title: 'Card 1' }];
    }
  });
  const [activeCardId, setActiveCardId] = useState(() => {
    try {
      const saved = localStorage.getItem('opd_active_card_id');
      return saved ? JSON.parse(saved) : 1;
    } catch {
      return 1;
    }
  });

  const autoSaveTimeoutRef = useRef(null);

  const handleFormChange = () => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(true); // Silent auto-sync in background
    }, 1500); // 1.5s debounce
  };

  const addCard = async () => {
    await handleSave(true); // Silently auto-save current card
    const newId = generateCardId();
    setCards([...cards, { id: newId, title: 'Card ' + (cards.length + 1) }]);
    setActiveCardId(newId);
  };

  const handlePrint = () => {
    try {
      if (window.electron && typeof window.electron.printCommand === 'function') {
        window.electron.printCommand({ landscape: false });
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  const handlePreview = () => {
    try {
      if (window.electron && typeof window.electron.previewPrint === 'function') {
        window.electron.previewPrint({ landscape: false });
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  const handleClear = () => {
    const form = document.getElementById(`opd-form-${activeCardId}`);
    if (form) form.reset();
    // Clear the OPD ID mapping so next save creates a new row
    setCardOpdIds(prev => {
      const updated = { ...prev };
      delete updated[activeCardId];
      return updated;
    });
  };

  // Track which OPD row ID each card has been assigned
  const [cardOpdIds, setCardOpdIds] = useState(() => {
    try {
      const saved = localStorage.getItem('opd_card_opd_ids_map');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const handleSave = async (silent = false) => {
    const form = document.getElementById(`opd-form-${activeCardId}`);
    if (!form) return;
    const elements = Array.from(form.querySelectorAll('input, textarea, select'));
    
    // Capitalize fields programmatically before saving
    elements.forEach(el => {
      if (el.name && typeof el.value === 'string' && el.value.trim() !== '') {
        const name = el.name;
        if (['patientName', 'drName', 'contractor', 'service', 'department'].includes(name)) {
          el.value = el.value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else if (['diagnosis', 'investigation', 'medicinesDetails'].includes(name)) {
          el.value = el.value.charAt(0).toUpperCase() + el.value.slice(1);
        }
      }
    });

    // Save as key-value object to avoid indexing shifts when form elements are added
    const formDataObj = {};
    elements.forEach(el => {
      if (el.name) formDataObj[el.name] = el.value;
    });
    
    // Automatically extract medicine quantity from medicinesDetails into medicineQty
    if (formDataObj.medicinesDetails !== undefined) {
      formDataObj.medicineQty = extractQuantities(formDataObj.medicinesDetails);
      formDataObj._lastParsedMeds = formDataObj.medicinesDetails;
    }
    
    try {
      localStorage.setItem(`opd_card_saved_${activeCardId}`, JSON.stringify(formDataObj));
    } catch (e) {
      console.error('[OPDCardPrintable] Failed to save OPD card locally:', e);
    }
    
    try {
      // Resolve the active tab's storage key (same as DailyOPDTally)
      let storageKey = 'cms_daily_opd_sheet';
      try {
        const activeTabId = localStorage.getItem('cms_daily_opd_sheet_active_tab_id');
        if (activeTabId) {
          const tabsIndexRaw = localStorage.getItem('cms_daily_opd_sheet_tabs_index');
          if (tabsIndexRaw) {
            const tabs = JSON.parse(tabsIndexRaw);
            const activeTab = tabs.find(t => String(t.id) === String(activeTabId));
            if (activeTab && activeTab.storageKey) {
              storageKey = activeTab.storageKey;
            }
          }
        }
      } catch (e) {
        console.error('Error resolving active OPD tab:', e);
      }
      const sheetData = await getSheetData(storageKey) || [];
      
      // Check if this card already has an assigned OPD row ID
      const existingOpdId = cardOpdIds[activeCardId];
      
      if (existingOpdId) {
        // Update the existing row
        const existingIndex = sheetData.findIndex(row => row.id === existingOpdId);
        if (existingIndex >= 0) {
          sheetData[existingIndex] = { ...sheetData[existingIndex], ...formDataObj, extracted: false };
        }
      } else {
        // Create a new row with proper OPD-XXX ID
        let nextIdNum = await getSheetMeta(`${storageKey}_nextid`) || 1;
        const newId = `OPD-${String(nextIdNum).padStart(3, '0')}`;
        
        const newRow = {
          ...formDataObj,
          id: newId,
          date: formDataObj.date || new Date().toISOString().split('T')[0]
        };
        
        sheetData.unshift(newRow);
        await saveSheetMeta(`${storageKey}_nextid`, nextIdNum + 1);
        
        // Remember which OPD ID was assigned to this card
        setCardOpdIds(prev => ({ ...prev, [activeCardId]: newId }));
      }
      
      await saveSheetData(storageKey, sheetData);
      if (silent !== true) showToast('✅ OPD Card saved successfully and synced to Daily OPD Log!');
    } catch (err) {
      console.error(err);
      if (silent !== true) showToast('❌ Saved locally, but failed to sync to Daily OPD Log.');
    }
  };

  useEffect(() => {
    cards.forEach(card => {
      const form = document.getElementById(`opd-form-${card.id}`);
      if (!form) return;
      const saved = localStorage.getItem(`opd_card_saved_${card.id}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const elements = Array.from(form.querySelectorAll('input, textarea, select'));
          if (Array.isArray(data)) {
            // Old array-based format
            const oldNamesOrder = [
              'cardNo', 'drName', 'date', 'regdNo', 'patientName', 'empCode', 
              'department', 'service', 'age', 'phoneNo', 'contractor', 
              'vitalsTemp', 'vitalsSPO2', 'vitalsPR', 'vitalsBP', 'vitalsWt', 
              'investigation', 'diagnosis'
            ];
            elements.forEach((el) => {
              if (el.name) {
                const oldIndex = oldNamesOrder.indexOf(el.name);
                if (oldIndex !== -1 && data[oldIndex] !== undefined) {
                  el.value = data[oldIndex];
                }
                if (el.name === 'gender' && data[8] !== undefined) {
                  // Try to parse gender from the old combined age field at index 8
                  const oldAgeVal = String(data[8]);
                  if (oldAgeVal.includes('/')) {
                    const parts = oldAgeVal.split('/');
                    const genderPart = parts[1].trim().toLowerCase();
                    if (genderPart.startsWith('m')) el.value = 'Male';
                    else if (genderPart.startsWith('f')) el.value = 'Female';
                    else if (genderPart.startsWith('o')) el.value = 'Other';
                  }
                }
              }
            });
          } else if (typeof data === 'object' && data !== null) {
            // New object-based format
            elements.forEach((el) => {
              if (el.name && data[el.name] !== undefined) {
                el.value = data[el.name];
              } else if (el.name === 'medicinesDetails' && data['diagnosis'] !== undefined) {
                el.value = data['diagnosis']; // Backward compatibility
              }
            });
          }
        } catch (e) { console.error(e); }
      }
    });
  }, [activeCardId, cards]);

  // Persist cardOpdIds to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('opd_card_opd_ids_map', JSON.stringify(cardOpdIds));
    } catch (e) {
      console.error('Error persisting cardOpdIds:', e);
    }
  }, [cardOpdIds]);

  // Persist cards list to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('opd_cards_list', JSON.stringify(cards));
    } catch (e) {
      console.error('Error persisting cards list:', e);
    }
  }, [cards]);

  // Persist activeCardId to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('opd_active_card_id', JSON.stringify(activeCardId));
    } catch (e) {
      console.error('Error persisting activeCardId:', e);
    }
  }, [activeCardId]);

  // Programmatic capitalization on input blur (focusout)
  useEffect(() => {
    const handleBlur = (e) => {
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.name) {
        const val = el.value;
        if (typeof val === 'string' && val.trim() !== '') {
          if (['patientName', 'drName', 'contractor', 'service', 'department'].includes(el.name)) {
            el.value = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          } else if (['diagnosis', 'investigation', 'medicinesDetails'].includes(el.name)) {
            el.value = val.charAt(0).toUpperCase() + val.slice(1);
          }
        }
      }
    };

    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Move to next field on Enter key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const el = e.target;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT')) {
          const form = el.closest('form');
          if (form && form.id && form.id.startsWith('opd-form-')) {
            e.preventDefault();
            const focusableElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea'));
            const currentIndex = focusableElements.indexOf(el);
            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
              focusableElements[currentIndex + 1].focus();
            }
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="animate-fade-in" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Non-printable controls */}
      <div className="print-hide glass-card" style={{ width: '100%', maxWidth: '850px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.25rem' }}>Interactive OPD Card</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Fill out the form below and click Print to generate a printable card.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Settings size={16} color="#64748b" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Print Scale:</span>
            <select 
              value={printScale} 
              onChange={(e) => setPrintScale(parseFloat(e.target.value))}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
            >
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
              <option value={0.9}>90%</option>
              <option value={1}>100%</option>
              <option value={1.1}>110%</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={handleClear}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            <RefreshCcw size={18} /> Clear
          </button>
          <button 
            type="button"
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
            }}
          >
            <Save size={18} /> Save
          </button>
          <button 
            type="button"
            onClick={handlePreview}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: 'white', color: '#1e40af', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            👁️ Preview
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
            }}
          >
            <Printer size={18} /> Print Card
          </button>
        </div>
      </div>

      {/* Tabs UI */}
      <div className="print-hide" style={{ width: '100%', maxWidth: '850px', display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '20px', overflowX: 'auto' }}>
        {cards.map(card => (
          <div 
            key={card.id}
            onClick={async () => {
              await handleSave(true);
              setActiveCardId(card.id);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', cursor: 'pointer', fontWeight: activeCardId === card.id ? 600 : 500,
              background: activeCardId === card.id ? 'white' : '#f8fafc',
              color: activeCardId === card.id ? '#1e3a8a' : '#64748b',
              borderTop: `3px solid ${activeCardId === card.id ? '#2563eb' : 'transparent'}`,
              borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1',
              borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
              borderBottom: activeCardId === card.id ? '1px solid white' : '1px solid #cbd5e1',
              marginBottom: '-1px', zIndex: activeCardId === card.id ? 10 : 1, position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            {card.title}
            {cards.length > 1 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  const newCards = cards.filter(c => c.id !== card.id);
                  setCards(newCards);
                  if (activeCardId === card.id) setActiveCardId(newCards[0].id);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: activeCardId === card.id ? '#e2e8f0' : 'transparent',
                  color: activeCardId === card.id ? '#475569' : '#94a3b8'
                }}
              >
                <X size={12} />
              </span>
            )}
          </div>
        ))}
        <div 
          onClick={addCard}
          title="New Card"
          style={{
            padding: '10px 16px', cursor: 'pointer', background: '#f8fafc', color: '#64748b',
            borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1 }}>+</span>
        </div>
      </div>

      {/* Printable Form Container */}
      {cards.map(card => (
      <form key={card.id} id={`opd-form-${card.id}`} className="print-only-container" onChange={handleFormChange} style={{
        display: activeCardId === card.id ? 'block' : 'none',
        background: '#ffffff',
        width: '100%',
        maxWidth: '850px', // A4/A5 scaleable width
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        position: 'relative',
        zoom: printScale
      }}>
        
        {/* BORDERED CARD BODY */}
        <div style={{ border: '1px solid #000' }}>
          
          {/* SECTION 1 - Header */}
          <div style={{ position: 'relative', padding: '15px 20px', borderBottom: '1px solid #000' }}>
            
            {/* Top-left Logo and number */}
            <JindalLogo style={{ position: 'absolute', top: '15px', left: '20px', height: '40px', width: 'auto' }} />
            <div style={{ position: 'absolute', top: '70px', left: '20px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
              <input type="text" name="cardNo" style={{ border: 'none', width: '50px', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: '#000', background: 'transparent' }} />
            </div>
            
            {/* Top-right Medical Officer & Date */}
            <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '13px', textAlign: 'right' }}>
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <span>Medical Officer: Dr.</span>
                <input type="text" name="drName" style={{ border: 'none', borderBottom: '1px solid #000', width: '120px', marginLeft: '5px', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <span>Date &amp; Time:</span>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} style={{ border: 'none', borderBottom: '1px solid #000', width: '140px', marginLeft: '5px', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', background: 'transparent' }} />
              </div>
            </div>

            {/* Centered Titles */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              {/* Blank placeholders to preserve vertical layout height */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', lineHeight: '1.2' }}>&nbsp;</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>&nbsp;</div>
              </div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold' }}>OCCUPATIONAL HEALTH CENTRE</h1>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'normal' }}>Jindal Steel, Patratu (JH)</h2>
              <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>OPD CARD</h3>
            </div>
          </div>

          {/* SECTION 2 - Patient Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '15px 20px', borderBottom: '1px solid #000' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Regd. No. :</span>
                <input type="text" name="regdNo" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Name of Patient:</span>
                <input type="text" name="patientName" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>E Code/ GP No.:</span>
                <input type="text" name="empCode" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Address/ Deptt. :</span>
                <input type="text" name="department" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Service :</span>
                <input type="text" name="service" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Age / Sex :</span>
                <input type="text" name="age" placeholder="Age" style={{ width: '50px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent', textAlign: 'center' }} />
                <span>/</span>
                <select name="gender" defaultValue="Male" style={{ flex: 1, border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent', cursor: 'pointer' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Child">Child</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Mob No.:</span>
                <input type="text" name="phoneNo" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>Contractor/Company :</span>
                <input type="text" name="contractor" style={{ flex: 1, marginLeft: '5px', border: 'none', borderBottom: '1px solid #000', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* SECTION 3 - Vitals & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '400px' }}>
            
            {/* Left Narrow Column (Vitals) */}
            <div style={{ padding: '20px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', width: '50px' }}>Temp.</span>
                <input type="text" name="vitalsTemp" style={{ flex: 1, margin: '0 10px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
                <span style={{ fontSize: '14px', color: '#555', width: '40px', textAlign: 'right' }}>&deg;F</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', width: '50px' }}>SPO2</span>
                <input type="text" name="vitalsSPO2" style={{ flex: 1, margin: '0 10px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
                <span style={{ fontSize: '14px', color: '#555', width: '40px', textAlign: 'right' }}>%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', width: '50px' }}>PR</span>
                <input type="text" name="vitalsPR" style={{ flex: 1, margin: '0 10px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
                <span style={{ fontSize: '14px', color: '#555', width: '40px', textAlign: 'right' }}>/min.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', width: '50px' }}>BP</span>
                <input type="text" name="vitalsBP" style={{ flex: 1, margin: '0 10px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
                <span style={{ fontSize: '14px', color: '#555', width: '40px', textAlign: 'right' }}>mmHg</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', width: '50px' }}>Wt.</span>
                <input type="text" name="vitalsWt" style={{ flex: 1, margin: '0 10px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }} />
                <span style={{ fontSize: '14px', color: '#555', width: '40px', textAlign: 'right' }}>Kg</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                <span style={{ fontSize: '14px', marginBottom: '5px' }}>Investigation :</span>
                <textarea name="investigation" style={{ width: '100%', height: '80px', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}></textarea>
              </div>

            </div>

            {/* Right Wide Column (Notes) */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <textarea name="medicinesDetails" style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.6', background: 'transparent' }}></textarea>
            </div>

          </div>

        </div>

        {/* SECTION 4 - Footer */}
        <div style={{ padding: '20px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <input type="text" style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent', marginBottom: '4px' }} />
            <span style={{ fontSize: '14px', fontStyle: 'italic' }}>Signature of Doctor</span>
          </div>
        </div>
        
      </form>
      ))}
      
      <style dangerouslySetInnerHTML={{__html: `
        [id^="opd-form-"], [id^="opd-form-"] * {
          box-sizing: border-box;
        }
        [id^="opd-form-"] input, [id^="opd-form-"] textarea {
          min-width: 0;
        }
        [id^="opd-form-"] input[name="patientName"],
        [id^="opd-form-"] input[name="drName"],
        [id^="opd-form-"] input[name="contractor"],
        [id^="opd-form-"] input[name="service"],
        [id^="opd-form-"] input[name="department"] {
          text-transform: capitalize;
        }
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .animate-fade-in {
            background: white !important;
            padding: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-only-container {
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
            page-break-inside: avoid;
          }
          input, textarea {
            background: transparent !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
        }
      `}} />
      
      {toast && (
        <div className="print-hide" style={{
          position: 'fixed', bottom: '24px', right: '24px', background: '#1e293b', color: 'white',
          padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 999999, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
          borderLeft: '4px solid #10b981', animation: 'slide-in 0.2s ease-out'
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default OPDCardPrintable;
