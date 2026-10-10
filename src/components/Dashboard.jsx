import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PackageSearch, AlertTriangle, Clock, ShieldAlert, Bell, Users, Activity, TrendingUp, Package, Stethoscope, BriefcaseMedical, Pill, ArrowRight, CalendarClock, Mail, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAllSheets } from '../utils/sheetDB';

const Dashboard = ({ setCurrentView }) => {
  const [todayOpdTotal, setTodayOpdTotal] = useState(0);
  const [opdMale, setOpdMale] = useState(0);
  const [opdFemale, setOpdFemale] = useState(0);
  const [opdChild, setOpdChild] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [medStockData, setMedStockData] = useState([]);
  const [patientCount, setPatientCount] = useState(0);
  const [injuryCount, setInjuryCount] = useState(0);
  const [opdWeeklyTrend, setOpdWeeklyTrend] = useState([]);
  const [deptVisits, setDeptVisits] = useState([]);
  const [checkups, setCheckups] = useState([]);
  const [occDiseases, setOccDiseases] = useState([]);
  const [openInjuriesList, setOpenInjuriesList] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_dismissed_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeAlertCategory, setActiveAlertCategory] = useState('All');

  // Persist dismissed alerts
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_dismissed_alerts', JSON.stringify(dismissedAlerts));
    } catch (e) {
      console.error('Error persisting dismissed alerts:', e);
    }
  }, [dismissedAlerts]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocalDateStr = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  useEffect(() => {
    loadAllData();
    // Refresh data every 30 seconds so new records appear and todayStr stays fresh
    const refreshInterval = setInterval(loadAllData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const loadAllData = async () => {
    try {
      const allSheets = await getAllSheets() || {};
      
      const getSheetDataMerged = (key) => {
        if (allSheets[key]) return allSheets[key];
        const local = localStorage.getItem(key);
        if (local) {
          try { return JSON.parse(local); } catch (e) {}
        }
        return null;
      };

      const allKeys = new Set(Object.keys(allSheets));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) allKeys.add(k);
      }
      
      let opdRows = [];
      let medItems = [];
      let injuryRows = [];
      let checkupRows = [];
      let diseaseRows2 = [];

      allKeys.forEach(key => {
        if (!key) return;

        // 1. OPD Data
        if (
          (key === 'cms_daily_opd_sheet' || key.startsWith('cms_daily_opd_sheet_tab_')) &&
          !key.endsWith('_columns') &&
          !key.endsWith('_nextid') &&
          !key.endsWith('_tabs_index') &&
          !key.endsWith('_active_tab_id')
        ) {
          const parsed = getSheetDataMerged(key);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => r && (
              (r.patientName && typeof r.patientName === 'string' && r.patientName.trim() !== '') || 
              (r.empCode && typeof r.empCode === 'string' && r.empCode.trim() !== '') ||
              (r.patientname && typeof r.patientname === 'string' && r.patientname.trim() !== '') || 
              (r.empId && typeof r.empId === 'string' && r.empId.trim() !== '')
            ));
            opdRows = [...opdRows, ...filtered];
          }
        }

        // 2. Medicine Stock
        if (
          (key === 'cms_medstock_data' || key.startsWith('cms_medstock_data_tab_')) &&
          !key.endsWith('_columns') &&
          !key.endsWith('_nextid') &&
          !key.endsWith('_tabs_index') &&
          !key.endsWith('_active_tab_id')
        ) {
          const parsed = getSheetDataMerged(key);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(m => m && m.medicineName && typeof m.medicineName === 'string' && m.medicineName.trim() !== '');
            medItems = [...medItems, ...filtered];
          }
        }

        // 3. Injury Data
        if (
          (key === 'cms_injury_data' || key.startsWith('cms_injury_data_tab_')) &&
          !key.endsWith('_columns') &&
          !key.endsWith('_nextid') &&
          !key.endsWith('_tabs_index') &&
          !key.endsWith('_active_tab_id')
        ) {
          const parsed = getSheetDataMerged(key);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => r && (
              (r.employeeName && typeof r.employeeName === 'string' && r.employeeName.trim() !== '') || 
              (r.empCode && typeof r.empCode === 'string' && r.empCode.trim() !== '')
            ));
            injuryRows = [...injuryRows, ...filtered];
          }
        }

        // 4. Annual Health Checkups
        if (
          (key === 'cms_ahc_data' || key.startsWith('cms_ahc_data_tab_')) &&
          !key.endsWith('_columns') &&
          !key.endsWith('_nextid') &&
          !key.endsWith('_tabs_index') &&
          !key.endsWith('_active_tab_id')
        ) {
          const parsed = getSheetDataMerged(key);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => r && r.empName && typeof r.empName === 'string' && r.empName.trim() !== '');
            checkupRows = [...checkupRows, ...filtered];
          }
        }

        // 5. Occupational Diseases
        if (
          (key === 'cms_occ_disease_data' || key.startsWith('cms_occ_disease_data_tab_')) &&
          !key.endsWith('_columns') &&
          !key.endsWith('_nextid') &&
          !key.endsWith('_tabs_index') &&
          !key.endsWith('_active_tab_id')
        ) {
          const parsed = getSheetDataMerged(key);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => r && r.empName && typeof r.empName === 'string' && r.empName.trim() !== '');
            diseaseRows2 = [...diseaseRows2, ...filtered];
          }
        }
      });

      // Now set states from collected records
      // Compute todayStr fresh each time to stay correct across midnight
      const todayStr = getLocalDateStr(0);
      const todayRows = opdRows.filter(r => r.date === todayStr);
      
      const getGenderAndAge = (r) => {
        let gender = (r.gender || '').trim().toLowerCase();
        let ageStr = String(r.age || '').trim();
        let ageVal = parseInt(ageStr);
        
        // Fallback if gender is empty but age contains slash (like 25/M or 8/F)
        if (!gender && ageStr.includes('/')) {
          const parts = ageStr.split('/');
          if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
            ageVal = parseInt(parts[0]);
            const genderPart = parts[1].trim().toLowerCase();
            if (genderPart.startsWith('m')) gender = 'male';
            else if (genderPart.startsWith('f')) gender = 'female';
            else if (genderPart.startsWith('o')) gender = 'other';
          }
        }
        
        return { gender, ageVal };
      };

      const m = todayRows.filter(r => {
        const { gender, ageVal } = getGenderAndAge(r);
        const isMale = gender === 'male';
        const isChild = gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
        return isMale && !isChild;
      }).length;
      
      const f = todayRows.filter(r => {
        const { gender, ageVal } = getGenderAndAge(r);
        const isFemale = gender === 'female';
        const isChild = gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
        return isFemale && !isChild;
      }).length;
      
      const c = todayRows.filter(r => {
        const { gender, ageVal } = getGenderAndAge(r);
        return gender === 'child' || (!isNaN(ageVal) && ageVal <= 12);
      }).length;
      
      setOpdMale(m);
      setOpdFemale(f);
      setOpdChild(c);
      setTodayOpdTotal(todayRows.length);
      setPatientCount(opdRows.length);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const dateStr = getLocalDateStr(i);
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = dayNames[d.getDay()];
        
        const dayRows = opdRows.filter(r => r.date === dateStr);
        weekData.push({ name: dayName, visits: dayRows.length });
      }
      setOpdWeeklyTrend(weekData);

      const deptMap = {};
      opdRows.forEach(p => {
        const dept = p.department || p.dept || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const deptArr = Object.entries(deptMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      if (deptArr.length > 0) setDeptVisits(deptArr);

      setMedStockData(medItems);

      const openInjuries = injuryRows.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'open' || s === 'active' || s === 'under investigation';
      });
      setInjuryCount(openInjuries.length);
      setOpenInjuriesList(openInjuries);

      setCheckups(checkupRows);
      setOccDiseases(diseaseRows2);

    } catch (e) {
      console.error("Error loading dashboard data:", e);
    }
  };


  const navigateToClinicalTab = (tabId) => {
    localStorage.setItem('cms_active_clinical_tab', tabId);
    setCurrentView('clinical');
  };

  // Calculate comprehensive system alerts (Medicine Stock, Expiry, HSE & Safety Compliance)
  const getSystemAlerts = () => {
    const alerts = [];
    const today = new Date();

    // 1. Medicine Inventory Alerts
    medStockData.forEach((m, idx) => {
      const name = m.medicineName || m.name || 'Unknown';
      const qty = Number(m.quantity) || 0;
      const reorder = Number(m.reorder) || Number(m.reorderLevel) || 0;
      const uid = `stock_low_${m.id || idx}`;

      if (qty <= reorder && reorder > 0) {
        alerts.push({
          id: uid,
          type: 'warning',
          category: 'Stock',
          icon: <AlertTriangle size={18} />,
          message: `Low Stock: ${name} — ${qty} left (Reorder: ${reorder})`,
          action: () => {
            localStorage.setItem('cms_pending_grid_search', name);
            setCurrentView('inventory');
          },
          actionText: 'Manage Stock'
        });
      }
      if (m.expiry) {
        const expDate = new Date(m.expiry);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        const expUid = `stock_exp_${m.id || idx}`;
        if (diffDays < 0) {
          alerts.push({
            id: expUid,
            type: 'danger',
            category: 'Stock',
            icon: <ShieldAlert size={18} />,
            message: `EXPIRED: ${name} expired ${Math.abs(diffDays)} days ago!`,
            action: () => {
              localStorage.setItem('cms_pending_grid_search', name);
              setCurrentView('inventory');
            },
            actionText: 'Dispose Stock'
          });
        } else if (diffDays <= 30) {
          alerts.push({
            id: expUid,
            type: 'danger',
            category: 'Stock',
            icon: <Clock size={18} />,
            message: `Expiring Soon: ${name} in ${diffDays} days`,
            action: () => {
              localStorage.setItem('cms_pending_grid_search', name);
              setCurrentView('inventory');
            },
            actionText: 'Review Stock'
          });
        } else if (diffDays <= 90) {
          alerts.push({
            id: expUid,
            type: 'warning',
            category: 'Stock',
            icon: <Clock size={18} />,
            message: `Expiring in ${diffDays} days: ${name}`,
            action: () => {
              localStorage.setItem('cms_pending_grid_search', name);
              setCurrentView('inventory');
            },
            actionText: 'Review Stock'
          });
        }
      }
    });



    // 4. Overdue periodic medical exams (Annual Checkups)
    checkups.forEach((c, idx) => {
      if (c.nextDueDate) {
        const dueDate = new Date(c.nextDueDate);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const emp = c.empName || 'Employee';
        const uid = `checkup_${c.id || idx}`;
        if (diffDays < 0) {
          alerts.push({
            id: uid,
            type: 'danger',
            category: 'Compliance',
            icon: <ShieldAlert size={18} />,
            message: `OVERDUE EXAM: ${emp}'s Periodic Medical Exam is overdue by ${Math.abs(diffDays)} days!`,
            action: () => {
              localStorage.setItem('cms_pending_grid_search', emp);
              navigateToClinicalTab('checkup');
            },
            actionText: 'Schedule Exam'
          });
        } else if (diffDays <= 30) {
          alerts.push({
            id: uid,
            type: 'warning',
            category: 'Compliance',
            icon: <Clock size={18} />,
            message: `Exam Due Soon: ${emp}'s Medical Exam is due in ${diffDays} days`,
            action: () => {
              localStorage.setItem('cms_pending_grid_search', emp);
              navigateToClinicalTab('checkup');
            },
            actionText: 'Schedule Exam'
          });
        }
      }
    });



    // 6. Active Occupational Diseases alerts
    occDiseases.forEach((d, idx) => {
      const cond = d.disease || 'Occupational Condition';
      const emp = d.empName || 'Employee';
      const status = (d.status || '').toLowerCase();
      const uid = `occdis_${d.id || idx}`;
      if (status === 'chronic' || status === 'active') {
        alerts.push({
          id: uid,
          type: 'danger',
          category: 'Compliance',
          icon: <ShieldAlert size={18} />,
          message: `OCC DISEASE CASE: ${emp} diagnosed with ${cond}`,
          action: () => {
            localStorage.setItem('cms_pending_grid_search', emp);
            navigateToClinicalTab('disease');
          },
          actionText: 'Review Case'
        });
      }
    });

    // 7. Active Injury Reports
    openInjuriesList.forEach((inj, idx) => {
      const empName = inj.employeeName || inj.empName || 'Employee';
      const dept = inj.department || 'Unknown Dept';
      const uid = `injury_${inj.id || idx}`;
      alerts.push({
        id: uid,
        type: 'danger',
        category: 'Safety',
        icon: <AlertTriangle size={18} />,
        message: `OPEN INJURY: ${empName} (${dept}) — ${inj.natureOfInjury || 'Incident reported'}`,
        action: () => {
          localStorage.setItem('cms_pending_grid_search', empName);
          setCurrentView('injury');
        },
        actionText: 'Investigate'
      });
    });

    return alerts.filter(a => !dismissedAlerts.includes(a.id));
  };

  // Calculate compliance statistics for the dynamic scorecard
  const getComplianceStats = () => {
    const today = new Date();

    // 1. Medicine Stock Health %
    const totalMedsCount = medStockData.length;
    const lowStockCountLocal = medStockData.filter(m => {
      const qty = Number(m.quantity) || 0;
      const reorder = Number(m.reorder) || Number(m.reorderLevel) || 0;
      return reorder > 0 && qty <= reorder;
    }).length;
    const expiredStockCount = medStockData.filter(m => m.expiry && new Date(m.expiry) < today).length;
    const healthyMedsCount = totalMedsCount - (lowStockCountLocal + expiredStockCount);
    const stockHealthPercent = totalMedsCount > 0 ? Math.round((healthyMedsCount / totalMedsCount) * 100) : 100;

    // 2. Periodic Exam Coverage %
    const totalCheckups = checkups.length;
    const overdueCheckupsCount = checkups.filter(c => c.nextDueDate && new Date(c.nextDueDate) < today).length;
    const examCoveragePercent = totalCheckups > 0 ? Math.round(((totalCheckups - overdueCheckupsCount) / totalCheckups) * 100) : 100;

    // Overall HSE Compliance Score (Average of the 2 active dimensions)
    const overallScore = Math.round((stockHealthPercent + examCoveragePercent) / 2);

    return {
      stock: stockHealthPercent,
      exams: examCoveragePercent,
      overall: overallScore
    };
  };

  // Memoize expensive computations to avoid recalculating on every 1-second clock tick
  const alerts = useMemo(() => getSystemAlerts(), [medStockData, checkups, occDiseases, openInjuriesList, dismissedAlerts]);
  const compStats = useMemo(() => getComplianceStats(), [medStockData, checkups]);

  const lowStockCount = useMemo(() => medStockData.filter(m => {
    const qty = Number(m.quantity) || 0;
    const reorder = Number(m.reorder) || 0;
    return reorder > 0 && qty <= reorder;
  }).length, [medStockData]);
  const expiredCount = useMemo(() => medStockData.filter(m => m.expiry && new Date(m.expiry) < new Date()).length, [medStockData]);
  const totalMedItems = medStockData.length;

  const [manualShift, setManualShift] = useState(null);
  const [isEditingShift, setIsEditingShift] = useState(false);

  const shiftOptions = [
    { name: 'A Shift', time: '6:00 AM – 2:00 PM', color: '#3b82f6' },
    { name: 'B Shift', time: '2:00 PM – 10:00 PM', color: '#f59e0b' },
    { name: 'C Shift', time: '10:00 PM – 6:00 AM', color: '#6366f1' },
    { name: 'General Shift', time: '9:00 AM – 6:00 PM', color: '#10b981' }
  ];

  // Shift detection
  const getCurrentShift = () => {
    if (manualShift) return manualShift;
    const hr = currentTime.getHours();
    if (hr >= 6 && hr < 14) return shiftOptions[0];
    if (hr >= 14 && hr < 22) return shiftOptions[1];
    return shiftOptions[2];
  };
  const shift = getCurrentShift();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const greeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (

    <div className="animate-slide-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header with Live Clock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="gradient-text-animated" style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {greeting()}, Doctor 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>
            Plant Occupational Health Center Dashboard
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
          <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255, 255, 255, 0.55)', textAlign: 'right', minWidth: '240px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <div className="gradient-text-animated" style={{ fontSize: '1.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <div 
                onClick={() => setIsEditingShift(!isEditingShift)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: shift.color + '15', color: shift.color, border: `1px solid ${shift.color}35`, cursor: 'pointer', transition: 'all 0.2s' }}
                title="Click to override current shift"
                onMouseOver={e => { e.currentTarget.style.background = shift.color + '25'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseOut={e => { e.currentTarget.style.background = shift.color + '15'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                ⏱ {shift.name} ({shift.time}) ✏️
              </div>
              
              {isEditingShift && (
                <div className="glass-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: '10px', zIndex: 100, width: '240px', textAlign: 'left', backdropFilter: 'blur(10px)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', fontWeight: 700, padding: '0 4px', letterSpacing: '1px' }}>MANUAL OVERRIDE</div>
                  {shiftOptions.map(opt => (
                    <div 
                      key={opt.name}
                      onClick={() => { setManualShift(opt); setIsEditingShift(false); }}
                      style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s', marginBottom: '2px' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong style={{ color: opt.color }}>{opt.name}</strong> <span style={{ fontSize: '11px', opacity: 0.8 }}>{opt.time}</span>
                    </div>
                  ))}
                  <div 
                    onClick={() => { setManualShift(null); setIsEditingShift(false); }}
                    style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', color: '#dc2626', borderTop: '1px solid rgba(226, 232, 240, 0.5)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    🔄 Reset to Auto
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div 
          className="glass-card glow-blue animate-slide-in-stagger-1" 
          style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          onClick={() => setCurrentView('opdcounter')}
          title="Open OPD Counter"
        >
          <div className="card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}><Users size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.75px' }}>Today's OPD</div>
            <div className="animate-number-pop" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1', margin: '2px 0' }}>{todayOpdTotal}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>👨 {opdMale} · 👩 {opdFemale} · 👶 {opdChild}</div>
          </div>
        </div>

        <div 
          className="glass-card glow-green animate-slide-in-stagger-2" 
          style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          onClick={() => setCurrentView('opd')}
        >
          <div className="card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}><Stethoscope size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.75px' }}>Total Patients</div>
            <div className="animate-number-pop" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1', margin: '2px 0' }}>{patientCount}</div>
            <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>All-time records</div>
          </div>
        </div>

        <div 
          className="glass-card glow-rose animate-slide-in-stagger-2" 
          style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          onClick={() => setCurrentView('injury')}
        >
          <div className="card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}><Activity size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.75px' }}>Open Injuries</div>
            <div className="animate-number-pop" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1', margin: '2px 0' }}>{injuryCount}</div>
            <div style={{ color: injuryCount > 0 ? '#ef4444' : '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>{injuryCount > 0 ? 'Needs attention' : 'All clear ✓'}</div>
          </div>
        </div>

        <div 
          className="glass-card glow-amber animate-slide-in-stagger-3" 
          style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          onClick={() => setCurrentView('inventory')}
        >
          <div className="card-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#f59e0b', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}><Package size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.75px' }}>Medicine Stock</div>
            <div className="animate-number-pop" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1', margin: '2px 0' }}>{totalMedItems}</div>
            <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>{lowStockCount} low · {expiredCount} expired</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { id: 'opd', icon: '📝', label: 'Daily OPD Log', color: '#3b82f6' },
          { id: 'opdcounter', icon: '🏥', label: 'OPD Counter', color: '#3b82f6' },
          { id: 'dispense', icon: '💊', label: 'Dispense', color: '#10b981' },
          { id: 'medconsume', icon: '📉', label: 'Medicine Consume', color: '#ec4899' },
          { id: 'inventory', icon: '📦', label: 'Medicine Stock', color: '#f59e0b' },
          { id: 'monthlybalance', icon: '📑', label: 'Monthly Balance', color: '#f59e0b' },
          { id: 'shift', icon: '📉', label: 'Daily Consume', color: '#ec4899' },
          { id: 'patient', icon: '📥', label: 'Medicine Incoming', color: '#8b5cf6' },
          { id: 'injury', icon: '🤕', label: 'Injury Log', color: '#ef4444' },
          { id: 'mis', icon: '📊', label: 'MIS Report', color: '#0ea5e9' },
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => setCurrentView(action.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px',
              background: 'white', border: `1px solid rgba(255,255,255,0.8)`, borderRadius: '12px',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#334155',
              transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
              boxShadow: '0 4px 10px rgba(0,0,0,0.03), inset 0 -2px 0 rgba(0,0,0,0.02)'
            }}
            onMouseOver={e => { 
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.color = action.color;
              e.currentTarget.style.borderColor = action.color + '50';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${action.color}15`;
            }}
            onMouseOut={e => { 
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.03), inset 0 -2px 0 rgba(0,0,0,0.02)';
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{action.icon}</span> {action.label}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Real OPD Trend Chart */}
        <div className="glass-card glow-blue animate-slide-in-stagger-2" style={{ padding: '24px' }}>
          <h3 className="text-shine" style={{ margin: '0 0 24px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarClock size={20} color="#3b82f6" /> OPD Visit Trend (Last 7 Days)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {opdWeeklyTrend.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={opdWeeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.4)', 
                      background: 'rgba(255,255,255,0.85)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 24px rgba(31,38,135,0.08)', 
                      padding: '12px 16px', 
                      fontWeight: 700 
                    }}
                    formatter={(value) => [`${value} patients`, 'Visits']}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontWeight: 500 }}>
                No OPD data yet. Start recording visits in the OPD Tally sheet.
              </div>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="glass-card glow-rose animate-slide-in-stagger-3" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-shine" style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
            <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px', display: 'flex', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.1)' }}><Bell size={18} color="#ef4444" /></div> 
            System Alerts 
            {alerts.length > 0 && <span className="animate-pulse" style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '3px 9px', borderRadius: '20px', fontWeight: 800, marginLeft: '6px' }}>{alerts.length}</span>}
          </h3>

          {/* Dynamic HSE Compliance Scorecard */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HSE Compliance Index</span>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: compStats.overall >= 80 ? '#10b981' : compStats.overall >= 50 ? '#f59e0b' : '#ef4444'
              }}>{compStats.overall}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(226, 232, 240, 0.6)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ 
                width: `${compStats.overall}%`, 
                height: '100%', 
                background: `linear-gradient(90deg, #3b82f6, ${compStats.overall >= 80 ? '#10b981' : compStats.overall >= 50 ? '#f59e0b' : '#ef4444'})`,
                borderRadius: '3px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            
            {/* Sub-metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Stock Health</span>
                  <strong style={{ color: '#334155' }}>{compStats.stock}%</strong>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'rgba(226, 232, 240, 0.5)', borderRadius: '1.5px', overflow: 'hidden' }}>
                  <div style={{ width: `${compStats.stock}%`, height: '100%', background: '#3b82f6', borderRadius: '1.5px' }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Checkups Coverage</span>
                  <strong style={{ color: '#334155' }}>{compStats.exams}%</strong>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'rgba(226, 232, 240, 0.5)', borderRadius: '1.5px', overflow: 'hidden' }}>
                  <div style={{ width: `${compStats.exams}%`, height: '100%', background: '#f59e0b', borderRadius: '1.5px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '2px', 
            marginBottom: '14px', 
            background: 'rgba(241, 245, 249, 0.8)', 
            padding: '2px', 
            borderRadius: '8px',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            {['All', 'Stock', 'Safety', 'Compliance'].map((cat) => {
              const catCount = cat === 'All' 
                ? alerts.length 
                : alerts.filter(a => a.category === cat).length;
                
              const isActive = activeAlertCategory === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => setActiveAlertCategory(cat)}
                  style={{
                    flex: 1,
                    padding: '6px 2px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#1e40af' : '#64748b',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {cat}
                  {catCount > 0 && (
                    <span style={{ 
                      fontSize: '8px', 
                      fontWeight: 800, 
                      background: isActive ? '#dbeafe' : 'rgba(226, 232, 240, 0.6)', 
                      color: isActive ? '#1e40af' : '#64748b',
                      padding: '0.5px 4px',
                      borderRadius: '8px'
                    }}>{catCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Alerts Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', paddingRight: '4px' }}>
            {(() => {
              const filteredAlerts = activeAlertCategory === 'All'
                ? alerts
                : alerts.filter(a => a.category === activeAlertCategory);

              if (filteredAlerts.length === 0) {
                return (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontWeight: 500 }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '8px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.03))' }}>✅</div>
                    No active {activeAlertCategory !== 'All' ? `${activeAlertCategory.toLowerCase()} ` : ''}alerts.
                  </div>
                );
              }

              return filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '10px', 
                    padding: '10px 12px', 
                    borderRadius: '10px',
                    background: alert.type === 'danger' ? 'rgba(254, 242, 242, 0.85)' : 'rgba(255, 251, 235, 0.85)',
                    border: `1px solid ${alert.type === 'danger' ? 'rgba(252, 165, 165, 0.4)' : 'rgba(253, 230, 138, 0.4)'}`,
                    fontSize: '0.8rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                    position: 'relative',
                    cursor: alert.action ? 'pointer' : 'default',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.03)';
                    if (alert.action) {
                      e.currentTarget.style.borderColor = alert.type === 'danger' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)';
                    }
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.01)';
                    e.currentTarget.style.borderColor = alert.type === 'danger' ? 'rgba(252, 165, 165, 0.4)' : 'rgba(253, 230, 138, 0.4)';
                  }}
                  onClick={() => {
                    if (alert.action) alert.action();
                  }}
                >
                  <div style={{ color: alert.type === 'danger' ? '#dc2626' : '#d97706', marginTop: '1px', flexShrink: 0 }}>
                    {alert.icon}
                  </div>
                  <div style={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.35, paddingRight: '16px', flex: 1 }}>
                    <span style={{ 
                      display: 'inline-block', 
                      fontSize: '8px', 
                      fontWeight: 800, 
                      padding: '1px 4px', 
                      borderRadius: '3px', 
                      background: alert.type === 'danger' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)', 
                      color: alert.type === 'danger' ? '#dc2626' : '#d97706',
                      marginRight: '6px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px' 
                    }}>{alert.category}</span>
                    {alert.message}
                    {alert.action && (
                      <div style={{ 
                        marginTop: '3px', 
                        fontSize: '0.72rem', 
                        color: alert.type === 'danger' ? '#dc2626' : '#d97706', 
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {alert.actionText || 'Resolve'} <ArrowRight size={10} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissedAlerts(prev => [...prev, alert.id]);
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px',
                      borderRadius: '50%',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                      e.currentTarget.style.color = '#475569';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                    title="Dismiss Alert"
                  >
                    <X size={12} />
                  </button>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      {(deptVisits.length > 0 || medStockData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Department Pie Chart */}
          {deptVisits.length > 0 ? (
            <div className="glass-card animate-slide-in-stagger-4" style={{ padding: '24px' }}>
              <h3 className="text-shine" style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 700 }}>Department-wise Patient Distribution</h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={deptVisits} cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deptVisits.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.06))' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', minHeight: '340px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Department-wise Patient Distribution</h3>
              <p style={{ fontWeight: 500 }}>No department data found in OPD logs yet.</p>
            </div>
          )}

          {/* Medicine Stock Bar Chart */}
          {medStockData.length > 0 ? (
            <div className="glass-card animate-slide-in-stagger-4" style={{ padding: '24px' }}>
              <h3 className="text-shine" style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 700 }}>Medicine Stock Levels (Top 8)</h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer>
                  <BarChart data={medStockData.slice(0, 8).map(m => ({ 
                    name: (m.medicineName || m.name || '').substring(0, 12), 
                    qty: Number(m.quantity) || 0,
                    reorder: Number(m.reorder) || 0
                  }))} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid rgba(255,255,255,0.4)', 
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)' 
                      }} 
                    />
                    <Bar dataKey="qty" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} name="In Stock">
                      {medStockData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="url(#blueGrad)" />
                      ))}
                    </Bar>
                    <Bar dataKey="reorder" fill="url(#amberGrad)" radius={[4, 4, 0, 0]} name="Reorder Level">
                      {medStockData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-reorder-${index}`} fill="url(#amberGrad)" />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', minHeight: '340px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Medicine Stock Levels</h3>
              <p style={{ fontWeight: 500 }}>No medicine stock data found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

