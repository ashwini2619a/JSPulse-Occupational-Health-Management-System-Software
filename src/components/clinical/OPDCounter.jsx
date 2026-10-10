import { useState, useEffect, useMemo } from 'react';
import { Download, Printer, Eye } from 'lucide-react';
import { getAllSheets } from '../../utils/sheetDB';

const todayFormatted = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function OPDCounter() {
  const [patientRows, setPatientRows] = useState([]);
  
  // The exact YYYY-MM-DD format used in ExcelGrid date columns
  const todayStr = useMemo(() => {
    const d = new Date();
    // Use local time for YYYY-MM-DD
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      let allRows = [];
      try {
        const allSheets = await getAllSheets() || {};
        
        const getSheetDataMerged = (key) => {
          if (allSheets[key]) return allSheets[key];
          const local = localStorage.getItem(key);
          if (local) {
            try { return JSON.parse(local); } catch { return null; }
          }
          return null;
        };

        const allKeys = new Set(Object.keys(allSheets));
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) allKeys.add(k);
        }

        allKeys.forEach(key => {
          if (
            (key === 'cms_daily_opd_sheet' || key.startsWith('cms_daily_opd_sheet_tab_')) &&
            !key.endsWith('_columns') &&
            !key.endsWith('_nextid') &&
            !key.endsWith('_tabs_index') &&
            !key.endsWith('_active_tab_id')
          ) {
            const parsed = getSheetDataMerged(key);
            if (Array.isArray(parsed)) {
              // Strictly ignore empty rows (must have either a name or employee code to count)
              const filtered = parsed.filter(r => r && (
                (r.patientName && typeof r.patientName === 'string' && r.patientName.trim() !== '') || 
                (r.empCode && typeof r.empCode === 'string' && r.empCode.trim() !== '') ||
                (r.patientname && typeof r.patientname === 'string' && r.patientname.trim() !== '') || 
                (r.empId && typeof r.empId === 'string' && r.empId.trim() !== '')
              ));
              allRows = [...allRows, ...filtered];
            }
          }
        });
        setPatientRows(allRows);
      } catch (e) {
        console.error("Error loading patients in OPDCounter:", e);
      }
    };

    loadPatients();
    const interval = setInterval(loadPatients, 10000); // Poll every 10 seconds (was 2s — reduced to prevent performance issues over hours)
    
    // Pause polling when tab is hidden to save resources
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Calculate totals for today based on patient rows
  const todayPatients = patientRows.filter(r => r.date === todayStr);

  const getGenderAndAge = (r) => {
    let gender = (r.gender || '').trim().toLowerCase();
    let ageStr = String(r.age || '').trim();
    let ageVal = parseInt(ageStr);
    
    // Fallback if gender is empty but age contains slash (like 25/M or 8/F)
    if (!gender && ageStr.includes('/')) {
      const parts = ageStr.split('/');
      ageVal = parseInt(parts[0]);
      const genderPart = parts[1].trim().toLowerCase();
      if (genderPart.startsWith('m')) gender = 'male';
      else if (genderPart.startsWith('f')) gender = 'female';
      else if (genderPart.startsWith('o')) gender = 'other';
    }
    
    return { gender, ageVal };
  };

  const male = todayPatients.filter(r => {
    const { gender, ageVal } = getGenderAndAge(r);
    const isMale = gender === 'male';
    const isChild = gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
    return isMale && !isChild;
  }).length;

  const female = todayPatients.filter(r => {
    const { gender, ageVal } = getGenderAndAge(r);
    const isFemale = gender === 'female';
    const isChild = gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
    return isFemale && !isChild;
  }).length;

  const child = todayPatients.filter(r => {
    const { gender, ageVal } = getGenderAndAge(r);
    return gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
  }).length;

  const total = male + female + child;

  const handlePrint = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    try {
      if (isElectron && window.electron) {
        window.electron.printCommand();
      } else if (isElectron && window['require']) {
        const { ipcRenderer } = window['require']('electron');
        ipcRenderer.send('print-command');
      } else if (!isElectron) {
        window.print();
      } else {
        alert("Print failed: Electron IPC not available. Please check contextBridge preload configurations.");
      }
    } catch (err) {
      console.error(err);
      if (!isElectron) {
        window.print();
      } else {
        alert("Print failed: " + err.message);
      }
    }
  };

  const handlePrintPreview = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    try {
      if (isElectron && window.electron) {
        if (window.electron.previewPrint) {
          window.electron.previewPrint();
        } else {
          window.electron.printCommand();
        }
      } else if (isElectron && window['require']) {
        const { ipcRenderer } = window['require']('electron');
        ipcRenderer.send('preview-print');
      } else {
        window.print();
      }
    } catch (err) {
      console.error(err);
      alert("Preview failed: " + err.message);
    }
  };

  const exportCSV = () => {
    const csv = 'Category,Count\nMale,' + male + '\nFemale,' + female + '\nChild,' + child + '\nTotal,' + total;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opd_tally_${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    {
      label: 'MALE',
      value: male,
      gradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
      glowClass: 'tally-glow-male',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      icon: '👨',
    },
    {
      label: 'FEMALE',
      value: female,
      gradient: 'linear-gradient(135deg, rgba(131, 24, 67, 0.8) 0%, rgba(236, 72, 153, 0.8) 100%)',
      glowClass: 'tally-glow-female',
      borderColor: 'rgba(236, 72, 153, 0.4)',
      icon: '👩',
    },
    {
      label: 'CHILD',
      value: child,
      gradient: 'linear-gradient(135deg, rgba(6, 95, 70, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%)',
      glowClass: 'tally-glow-child',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      icon: '👶',
    },
  ];

  return (
    <div className="animate-fade-in" style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '32px 40px', 
      background: 'radial-gradient(circle at top right, #0f172a 0%, #1e293b 50%, #0f172a 100%)', 
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      {/* Header */}
      <div className="glass-card animate-slide-in" style={{
        background: 'rgba(30, 41, 59, 0.55)', color: '#ffffff', padding: '32px 40px',
        borderRadius: '24px', marginBottom: '32px', textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}>
        <h1 className="gradient-text-animated-light" style={{ margin: 0, fontSize: '36px', fontWeight: '900', letterSpacing: '1px' }}>
          🏥 Daily OPD Dashboard
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: '20px', color: '#94a3b8', fontWeight: '600' }}>
          {todayFormatted()}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap',
      }}>
        <button onClick={exportCSV} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
          background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '12px',
          cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.25s',
          backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Download size={16} /> Export CSV
        </button>
        <button onClick={handlePrint} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
          background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '12px',
          cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.25s',
          backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Printer size={16} /> Print
        </button>
        <button onClick={handlePrintPreview} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
          background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '12px',
          cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.25s',
          backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Eye size={16} /> Print Preview
        </button>
      </div>

      {/* Counter Cards */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '28px', marginBottom: '44px', flexWrap: 'wrap',
      }}>
        {cards.map((card, i) => (
          <div key={card.label} className={`glass-card ${card.glowClass} animate-float`} style={{
            background: card.gradient,
            borderRadius: '24px', padding: '40px 44px',
            color: '#ffffff', textAlign: 'center',
            minWidth: '260px', flex: '1', maxWidth: '340px',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative', overflow: 'hidden',
            border: `1px solid ${card.borderColor}`,
            animationDelay: `${i * 0.15}s`
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
          >
            {/* Background decoration */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px',
              width: '120px', height: '120px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px',
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
            }} />

            <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>{card.icon}</div>
            <h2 style={{
              margin: '0 0 12px', fontSize: '18px', fontWeight: '800',
              letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.85,
            }}>
              {card.label}
            </h2>

            <div className="animate-number-pop" style={{
              fontSize: '84px', fontWeight: '900', lineHeight: '1',
              margin: '16px 0 0', textShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="glass-card" style={{
        background: 'rgba(30, 41, 59, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px', padding: '36px 40px',
        color: '#ffffff', textAlign: 'center',
        maxWidth: '540px', margin: '0 auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}>
        <h3 style={{
          margin: '0 0 12px', fontSize: '15px', fontWeight: '700',
          letterSpacing: '5px', color: '#94a3b8', textTransform: 'uppercase'
        }}>
          TOTAL PATIENTS TODAY
        </h3>
        <div className="animate-number-pop gradient-text-animated-light" style={{
          fontSize: '80px', fontWeight: '900', lineHeight: '1',
          marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.4))'
        }}>
          {total}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '20px', fontSize: '16px', fontWeight: '600' }}>
          <span style={{ color: '#60a5fa', textShadow: '0 0 10px rgba(96,165,250,0.2)' }}>👨 Male: {male}</span>
          <span style={{ color: '#f472b6', textShadow: '0 0 10px rgba(244,114,182,0.2)' }}>👩 Female: {female}</span>
          <span style={{ color: '#34d399', textShadow: '0 0 10px rgba(52,211,153,0.2)' }}>👶 Child: {child}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '36px', textAlign: 'center', fontSize: '15px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px'
      }}>
        💡 Note: These counts are automatically updated in real-time from your Daily OPD Log!
      </div>
    </div>
  );
}

