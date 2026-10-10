## 31. Appendix: Primary Source Code Listings

This appendix provides the raw, unedited source code for the most critical modules of the JSPulse OHMS application. It serves as an exhaustive reference for the custom React logic, proxy engines, and algorithms detailed in previous chapters.

### A.1 src/main.jsx
```javascript
// Unregister any active service worker to prevent local asset caching bugs
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  }).catch(err => console.warn('Service worker unregistration failed:', err));
}

// Global LocalStorage Safe Guard for non-Electron or fallback environments
try {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    try {
      originalSetItem.call(this, key, value);
    } catch (e) {
      console.error('[Storage Safe] Native localStorage.setItem failed:', e);
    }
  };
} catch (e) {
  console.warn('[Storage Safe] Failed to patch Storage.prototype.setItem:', e);
}

// ----------------- Desktop Storage Override -----------------
// Overrides the standard window.localStorage with a persistent desktop file storage backend
// when running inside the Electron container, bypassing the 5MB browser quota.
if (window.electron && window.electron.isElectron) {
  const nativeLocalStorage = window.localStorage;

  // 1. One-time transparent migration of existing browser data to file storage
  try {
    const fileStorageLength = window.electron.storageLength();
    if (fileStorageLength === 0 && nativeLocalStorage && nativeLocalStorage.length > 0) {
      console.log('[Desktop Storage] Empty desktop database found. Migrating data from browser localStorage...');
      for (let i = 0; i < nativeLocalStorage.length; i++) {
        const key = nativeLocalStorage.key(i);
        const val = nativeLocalStorage.getItem(key);
        if (key && val !== null) {
          window.electron.storageSet(key, val);
        }
      }
      console.log('[Desktop Storage] Data migration completed successfully.');
    }
  } catch (err) {
    console.warn('[Desktop Storage] Error during data migration:', err);
  }

  // 1.5. Initialize the in-memory cache from desktop file storage
  let _cache = {};
  try {
    _cache = window.electron.storageAll() || {};
  } catch (e) {
    console.error('[Desktop Storage] Failed to initialize cache:', e);
  }

  // 2. Create the localStorage Proxy wrapper with in-memory caching to prevent synchronous file IO bottlenecks
  const customLocalStorage = new Proxy({}, {
    get(target, prop) {
      if (target === null) return undefined;
      if (prop === 'getItem') {
        return (key) => {
          const val = _cache[key];
          return val !== undefined ? val : null;
        };
      }
      if (prop === 'setItem') {
        return (key, value) => {
          const strVal = String(value);
          _cache[key] = strVal;
          try {
            window.electron.storageSet(key, strVal);
          } catch (e) {
            console.error('[Desktop Storage] setItem failed:', e);
          }
        };
      }
      if (prop === 'removeItem') {
        return (key) => {
          delete _cache[key];
          try {
            window.electron.storageRemove(key);
          } catch (e) {
            console.error('[Desktop Storage] removeItem failed:', e);
          }
        };
      }
      if (prop === 'clear') {
        return () => {
          Object.keys(_cache).forEach(k => delete _cache[k]);
          try {
            window.electron.storageClear();
          } catch (e) {
            console.error('[Desktop Storage] clear failed:', e);
          }
        };
      }
      if (prop === 'key') {
        return (index) => {
          const keys = Object.keys(_cache);
          return keys[index] !== undefined ? keys[index] : null;
        };
      }
      if (prop === 'length') {
        return Object.keys(_cache).length;
      }
      // Direct property access fallback (e.g., localStorage.someKey)
      if (typeof prop === 'string') {
        if (prop in Object.prototype) {
          return undefined;
        }
        return _cache[prop];
      }
      return undefined;
    },
    set(target, prop, value) {
      if (target === null) return false;
      if (typeof prop === 'string') {
        const strVal = String(value);
        _cache[prop] = strVal;
        try {
          window.electron.storageSet(prop, strVal);
        } catch (e) {
          console.error('[Desktop Storage] property set failed:', e);
        }
        return true;
      }
      return false;
    },
    deleteProperty(target, prop) {
      if (target === null) return false;
      if (typeof prop === 'string') {
        delete _cache[prop];
        try {
          window.electron.storageRemove(prop);
        } catch (e) {
          console.error('[Desktop Storage] property delete failed:', e);
        }
        return true;
      }
      return false;
    },
    ownKeys() {
      return Object.keys(_cache);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (target === null) return undefined;
      if (prop in _cache) {
        return {
          value: _cache[prop],
          writable: true,
          enumerable: true,
          configurable: true
        };
      }
      return undefined;
    }
  });

  // 3. Override window.localStorage
  try {
    Object.defineProperty(window, 'localStorage', {
      value: customLocalStorage,
      configurable: true,
      writable: true,
      enumerable: true
    });
    console.log('[Desktop Storage] Successfully bypassed 5MB limit by routing localStorage to local file system.');
  } catch (e) {
    console.error('[Desktop Storage] Failed to override localStorage:', e);
  }
}
// -------------------------------------------------------------

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error('[JSPulse OHMS] Fatal: Root element #root not found in document.');
}

```

### A.2 src/App.jsx
```javascript
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DispenseMedicine from './components/DispenseMedicine';
import InteractionChecker from './components/InteractionChecker';
import ChatAssistant from './components/ChatAssistant';
import FirstAidRecord from './components/FirstAidRecord';
import ClinicalRecords from './components/clinical/ClinicalRecords';
import FirstAidBoxTracker from './components/clinical/FirstAidBoxTracker';
import DailyConsume from './components/clinical/DailyConsume';
import AdvancedPatientRecords from './components/clinical/AdvancedPatientRecords';
import MonthlyMISReport from './components/clinical/MonthlyMISReport';
import MedicineStockRegister from './components/clinical/MedicineStockRegister';
import MonthlyBalance from './components/clinical/MonthlyBalance';
import InjuryReportLog from './components/clinical/InjuryReportLog';
import DailyOPDTally from './components/clinical/DailyOPDTally';
import OPDCounter from './components/clinical/OPDCounter';
import OPDCardPrintable from './components/clinical/OPDCardPrintable';
import ShortcutsReference from './components/clinical/ShortcutsReference';
import DataBackupRestore from './components/clinical/DataBackupRestore';
import SystemHealthTool from './components/clinical/SystemHealthTool';
import GlobalSearch from './components/GlobalSearch';
import ExcelGrid from './components/clinical/ExcelGrid';
import ErrorBoundary from './components/ErrorBoundary';
import { MessageSquare, X, ChevronRight } from 'lucide-react';
import './index.css'; // Make sure global CSS is imported

const viewsList = [
  'dashboard', 'inventory', 'monthlybalance', 'injury', 'clinical', 'opdcounter', 'opd', 'opdcard', 'dispense', 
  'patient', 'shift', 'firstaidbox', 'firstaid', 'mis', 'shortcuts', 'backup'
];

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarState, setSidebarState] = useState(() => {
    return localStorage.getItem('cms_sidebar_state') || 'expanded'; // 'expanded', 'collapsed', 'hidden'
  });

  React.useEffect(() => {
    localStorage.setItem('cms_sidebar_state', sidebarState);
  }, [sidebarState]);

  React.useEffect(() => {
    if (currentView === 'clinical') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarState('collapsed');
    }
  }, [currentView]);

  // Global hotkey for search (Ctrl+K) and View Switching (Alt+Left/Right)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Global Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }

      // Intercept Ctrl+P to prevent Windows default and force our own print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        // Use portrait for OPD card, landscape for all other views (sheets/grids)
        const isPortrait = currentView === 'opdcard';
        try {
          if (window.electron && typeof window.electron.printCommand === 'function') {
            window.electron.printCommand({ landscape: !isPortrait });
          } else {
            window.print();
          }
        } catch (err) {
          console.error(err);
          window.print();
        }
      }

      // Cycle Views
      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        setCurrentView(current => {
          const idx = viewsList.indexOf(current);
          if (idx === -1) return 'dashboard';
          if (e.key === 'ArrowRight') {
            return viewsList[(idx + 1) % viewsList.length];
          } else {
            return viewsList[(idx - 1 + viewsList.length) % viewsList.length];
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, currentView]);

  return (
    <div className="app-container">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenSearch={() => setIsSearchOpen(true)} 
        sidebarState={sidebarState}
        setSidebarState={setSidebarState}
      />
      
      <main className={['dashboard', 'shortcuts', 'backup', 'systemhealth', 'mis', 'opdcard'].includes(currentView) ? 'dashboard-view' : 'grid-view'}>
        <ErrorBoundary key={currentView}>
          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
          {currentView === 'inventory' && <MedicineStockRegister />}
          {currentView === 'monthlybalance' && <MonthlyBalance />}
          {currentView === 'injury' && <InjuryReportLog />}
          {currentView === 'dispense' && <DispenseMedicine />}
          {currentView === 'interactions' && <InteractionChecker />}
          {currentView === 'patient' && <AdvancedPatientRecords />}
          {currentView === 'shift' && <DailyConsume />}
          {currentView === 'firstaidbox' && <FirstAidBoxTracker />}
          {currentView === 'firstaid' && <FirstAidRecord />}
          {currentView === 'mis' && <MonthlyMISReport />}
          {currentView === 'opd' && <DailyOPDTally />}
          {currentView === 'opdcard' && <OPDCardPrintable />}
          {currentView === 'opdcounter' && <OPDCounter />}
          {currentView === 'clinical' && <ClinicalRecords />}
          {currentView === 'shortcuts' && <ShortcutsReference />}
          {currentView === 'backup' && <DataBackupRestore />}
          {currentView === 'systemhealth' && <SystemHealthTool />}
          {currentView === 'customsheets' && (
            <ExcelGrid 
              title="Custom Sheet" 
              storageKey="cms_custom_sheets" 
              columns={[
                { key: 'sn', label: 'S.N.', letter: 'A', width: 70, type: 'number' },
                { key: 'date', label: 'Date', letter: 'B', width: 120, type: 'date' },
                { key: 'name', label: 'Name', letter: 'C', width: 180, type: 'text' },
                { key: 'department', label: 'Department', letter: 'D', width: 150, type: 'text' },
                { key: 'description', label: 'Description', letter: 'E', width: 220, type: 'text' },
                { key: 'quantity', label: 'Quantity', letter: 'F', width: 100, type: 'number' },
                { key: 'remarks', label: 'Remarks', letter: 'G', width: 200, type: 'text' },
              ]} 
              idPrefix="CS-" 
              disableRenameTabs={false}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Floating Restore Sidebar Button */}
      {sidebarState === 'hidden' && (
        <button
          onClick={() => setSidebarState('expanded')}
          style={{
            position: 'fixed',
            left: '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '60px',
            borderRadius: '0 8px 8px 0',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002,
            transition: 'background 0.2s, width 0.2s',
            opacity: 0.7
          }}
          onMouseOver={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.width = '28px';
          }}
          onMouseOut={e => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.width = '24px';
          }}
          title="Show Sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Floating Chat Assistant */}
      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} setCurrentView={setCurrentView} />

      {/* Floating Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isChatOpen ? 'var(--danger)' : 'var(--primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg), 0 0 20px rgba(2, 132, 199, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s',
          transform: isChatOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
        onMouseOver={e => e.currentTarget.style.transform = isChatOpen ? 'rotate(90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = isChatOpen ? 'rotate(90deg) scale(1)' : 'rotate(0deg) scale(1)'}
      >
        {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        setCurrentView={setCurrentView} 
      />
    </div>
  );
}

export default App;

```

### A.3 src/components/Dashboard.jsx
```javascript
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
        const isChild = !isNaN(ageVal) && ageVal <= 12;
        return isMale && !isChild;
      }).length;
      
      const f = todayRows.filter(r => {
        const { gender, ageVal } = getGenderAndAge(r);
        const isFemale = gender === 'female';
        const isChild = !isNaN(ageVal) && ageVal <= 12;
        return isFemale && !isChild;
      }).length;
      
      const c = todayRows.filter(r => {
        const { gender, ageVal } = getGenderAndAge(r);
        return !isNaN(ageVal) && ageVal <= 12;
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


```

### A.4 src/components/clinical/ExcelGrid.jsx
```javascript
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { exportToExcel } from '../../utils/exportUtils';
import { Settings, FileSpreadsheet, ZoomIn, ZoomOut, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, PaintBucket, Minus, Plus, Printer, Calculator, Sigma, Search, Replace, Maximize, Minimize, Edit, Eraser, ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react';
import { getSheetData, saveSheetData, getSheetMeta, saveSheetMeta, deleteSheet } from '../../utils/sheetDB';

const evaluateFormula = (formulaStr, allData, cols, depth = 0) => {
  if (depth > 50) return 0;
  if (!formulaStr || !String(formulaStr).startsWith('=')) return formulaStr;
  try {
    let expr = String(formulaStr).substring(1).toUpperCase();
    
    expr = expr.replace(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (match, c1, r1, c2, r2) => {
      let sum = 0;
      const startR = Math.min(parseInt(r1), parseInt(r2)) - 1;
      const endR = Math.max(parseInt(r1), parseInt(r2)) - 1;
      const c1Idx = cols.findIndex(c => c.letter === c1);
      const c2Idx = cols.findIndex(c => c.letter === c2);
      if (c1Idx === -1 || c2Idx === -1) return 0;
      const startC = Math.min(c1Idx, c2Idx);
      const endC = Math.max(c1Idx, c2Idx);
      for (let r = startR; r <= endR; r++) {
        if (!allData[r]) continue;
        for (let c = startC; c <= endC; c++) {
          const val = allData[r][cols[c].key];
          let numVal = val;
          if (String(val).startsWith('=')) numVal = evaluateFormula(val, allData, cols, depth + 1);
          const num = parseFloat(numVal);
          if (!isNaN(num)) sum += num;
        }
      }
      return sum;
    });

    expr = expr.replace(/([A-Z]+)(\d+)/g, (match, letter, rowStr) => {
      const col = cols.find(c => c.letter === letter);
      if (!col) return 0;
      const rIdx = parseInt(rowStr) - 1;
      if (!allData[rIdx]) return 0;
      const val = allData[rIdx][col.key];
      let numVal = val;
      if (String(val).startsWith('=')) numVal = evaluateFormula(val, allData, cols, depth + 1);
      const num = parseFloat(numVal);
      return isNaN(num) ? 0 : num;
    });

    const result = new Function(`return ${expr}`)();
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : '#ERROR!';
  } catch (err) {
    return '#ERROR!';
  }
};

const getCleanData = (rawRows) => {
  if (!Array.isArray(rawRows)) return [];
  return rawRows.filter(row => {
    if (!row) return false;
    const hasData = Object.keys(row).some(k => {
      if (k === 'id' || k === 'extracted' || k === '_cellStyles' || k === 'status') return false;
      const val = row[k];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
    const hasStyles = row._cellStyles && Object.keys(row._cellStyles).length > 0;
    return hasData || hasStyles;
  });
};

const isRowEmpty = (row, cols) => {
  if (!row) return true;
  return !cols.some(col => {
    const key = (col.key || '').toLowerCase();
    
    // Ignore ID, serial numbers, styles, and extraction flags
    if (key === 'id' || key === 'sn' || key === 's.n.' || key === 'serial' || key === 'extracted' || key === '_cellstyles') {
      return false;
    }
    
    // Ignore read-only columns (which are typically auto-calculated)
    if (col.readOnly) {
      return false;
    }
    
    // Ignore standard calculated summary/balance column keys
    if (
      key === 'total' || 
      key === 'totalincoming' || 
      key === 'totaloutgoing' || 
      key === 'finalbalance' || 
      key === 'monthlygrandtotal' || 
      key === 'expirystatus' ||
      key.endsWith('_total') ||
      key.endsWith('_balance')
    ) {
      return false;
    }
    
    const val = row[col.key];
    return val !== null && val !== undefined && String(val).trim() !== '';
  });
};

const getCleanGridData = (rows, cols) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => !isRowEmpty(row, cols));
};

const ExcelGrid = ({ 
  title = "Records", 
  storageKey, 
  initialData = [], 
  columns = [], 
  idPrefix = "ID-",
  getRowStyle = () => ({}),
  getCustomCellContent = null,
  computeRow = null,
  onDataChange = null,
  filters = [],
  toolbarRight = null,
  disableTabs = false,
  disableRenameTabs = true,
  refreshTrigger = 0
}) => {
  const getActiveTabStorageKeyOnMount = () => {
    if (disableTabs) return storageKey;
    try {
      const activeId = localStorage.getItem(`${storageKey}_active_tab_id`) || 'default';
      const savedIndex = localStorage.getItem(`${storageKey}_tabs_index`);
      if (savedIndex) {
        const parsed = JSON.parse(savedIndex);
        if (Array.isArray(parsed)) {
          const found = parsed.find(t => t && t.id === activeId);
          if (found) return found.storageKey;
        }
      }
    } catch (e) {}
    return storageKey;
  };

  const initialActiveStorageKey = getActiveTabStorageKeyOnMount();

  const TABS_INDEX_KEY = `${storageKey}_tabs_index`;

  const [tabs, setTabs] = useState(() => {
    if (disableTabs) return [{ id: 'default', name: title, storageKey: storageKey }];
    try {
      const saved = localStorage.getItem(TABS_INDEX_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 'default', name: title, storageKey: storageKey }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    if (disableTabs) return 'default';
    try {
      const saved = localStorage.getItem(`${storageKey}_active_tab_id`);
      if (saved) return saved;
    } catch (e) {}
    return 'default';
  });

  const activeTab = (Array.isArray(tabs) ? tabs.find(t => t && t.id === activeTabId) : null) || (Array.isArray(tabs) && tabs[0]) || { id: 'default', name: title, storageKey: storageKey };
  const activeStorageKey = activeTab.storageKey;

  const [data, setData] = useState(() => {
    // Initial loading placeholder: 20 empty rows
    const initialRows = [];
    for (let i = 0; i < 20; i++) {
      const emptyRow = {};
      columns.forEach(c => emptyRow[c.key] = '');
      initialRows.push(emptyRow);
    }
    return initialRows;
  });
  
  const [nextIdNum, setNextIdNum] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printScale, setPrintScale] = useState(1);
  const [printLayout, setPrintLayout] = useState('landscape');
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCellState] = useState(null);
  const editStartTimeRef = useRef(0);
  const pendingEditRef = useRef(false); // Track transition into edit mode to buffer keystrokes
  const setEditingCell = useCallback((cell) => {
    setEditingCellState(cell);
    editStartTimeRef.current = cell ? Date.now() : 0;
    if (cell) pendingEditRef.current = true;
  }, []);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const dragOriginRef = useRef(null); // Track mouse-down origin for drag threshold
  const isDraggingRef = useRef(false); // Only true after mouse moves past threshold
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [activeColor, setActiveColor] = useState('#fef08a');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [highlightUndoStack, setHighlightUndoStack] = useState([]);
  const [highlightRedoStack, setHighlightRedoStack] = useState([]);
  const [draggingColIdx, setDraggingColIdx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, row: null, col: null });
  const [toast, setToast] = useState('');
  const [selectionType, setSelectionType] = useState('cell'); // 'cell', 'row', 'column'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const [editingHeader, setEditingHeader] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingSuperGroup, setEditingSuperGroup] = useState(null);
  
  const [customColumns, setCustomColumns] = useState(() => columns.map(c => ({ ...c })));
  const [colWidths, setColWidths] = useState(() => {
    const widths = {};
    columns.forEach(col => {
      widths[col.key] = col.width || 120;
    });
    return widths;
  });
  const [rowHeights, setRowHeights] = useState({});
  const [resizingCol, setResizingCol] = useState(null);
  const [resizingRow, setResizingRow] = useState(null);
  const [dragStart, setDragStart] = useState(0);
  const [sizeStart, setSizeStart] = useState(0);

  // Adjustable Import State
  const [importModalData, setImportModalData] = useState(null); // { headers: [], rows: [] }
  const [importMapping, setImportMapping] = useState({}); // { systemColKey: fileColIdx }

  // Sync customColumns and colWidths when columns prop changes or active tab changes
  useEffect(() => {
    async function loadCols() {
      try {
        // Use global storageKey for column metadata (shared across all tabs)
        let savedCols = await getSheetMeta(`${storageKey}_columns`);
        
        // Migration fallback: check old per-tab key and migrate to global key
        if (!savedCols && activeStorageKey !== storageKey) {
          savedCols = await getSheetMeta(`${activeStorageKey}_columns`);
          if (savedCols) {
            await saveSheetMeta(`${storageKey}_columns`, savedCols);
          }
        }
        
        // Migration fallback from localStorage
        if (!savedCols) {
          const savedLocal = localStorage.getItem(`${storageKey}_columns`) || localStorage.getItem(`${activeStorageKey}_columns`);
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                savedCols = parsed;
                await saveSheetMeta(`${storageKey}_columns`, parsed);
                localStorage.removeItem(`${storageKey}_columns`);
                localStorage.removeItem(`${activeStorageKey}_columns`);
              }
            } catch (e) {}
          }
        }

        if (savedCols) {
          setCustomColumns(columns.map(c => {
            const matched = savedCols.find(p => p && p.key === c.key);
            return matched ? { ...c, label: matched.label, group: matched.group || c.group, superGroup: matched.superGroup || c.superGroup, width: matched.width !== undefined ? matched.width : c.width } : c;
          }));
          
          setColWidths(prev => {
            const widths = { ...prev };
            savedCols.forEach(col => {
              if (col && col.key) {
                widths[col.key] = col.width !== undefined ? col.width : (widths[col.key] || col.width || 120);
              }
            });
            return widths;
          });
        } else {
          setCustomColumns(columns.map(c => ({ ...c })));
          setColWidths(prev => {
            const widths = { ...prev };
            columns.forEach(col => {
              if (col && col.key) {
                widths[col.key] = col.width || 120;
              }
            });
            return widths;
          });
        }
      } catch (err) {
        console.error("Failed to load columns:", err);
      }
    }

    loadCols();
  }, [columns, activeStorageKey]);

  // Handle pending search from dashboard alerts deep-linking
  useEffect(() => {
    const pendingSearch = localStorage.getItem('cms_pending_grid_search');
    if (!pendingSearch) return;

    // Safety timeout to clear pending search if no match is found after 2 seconds
    const timeoutId = setTimeout(() => {
      localStorage.removeItem('cms_pending_grid_search');
    }, 2000);

    const termLower = pendingSearch.toLowerCase();
    const matchedRowIdx = data.findIndex(row => {
      return customColumns.some(col => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(termLower);
      });
    });

    if (matchedRowIdx !== -1) {
      setSearchTerm(pendingSearch);
      
      const colIdx = customColumns.length > 2 ? 2 : (customColumns.length > 1 ? 1 : 0);
      setSelectedCell({ row: matchedRowIdx, col: colIdx });
      setRangeStart({ row: matchedRowIdx, col: colIdx });
      setRangeEnd({ row: matchedRowIdx, col: colIdx });
      
      localStorage.removeItem('cms_pending_grid_search');
      clearTimeout(timeoutId);

      setTimeout(() => {
        const selectedEl = document.querySelector('.cell-selected, [data-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
      }, 300);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStorageKey, data, customColumns]);

  // Sync when activeTabId changes
  useEffect(() => {
    if (disableTabs) return;
    try {
      localStorage.setItem(`${storageKey}_active_tab_id`, activeTabId);
    } catch (e) {
      console.error('[ExcelGrid] Failed to save active tab ID:', e);
    }
    
    setSelectedCell(null);
    setEditingCell(null);
    setRangeStart(null);
    setRangeEnd(null);

    // Reset scroll tracking values for the new tab
    lastScrollLeftRef.current = 0;
    lastScrollTopRef.current = 0;
  }, [activeTabId, activeStorageKey, disableTabs]);

  // Handle mouse movements for column/row resizing
  useEffect(() => {
    if (resizingCol === null && resizingRow === null) return;

    const handleMouseMove = (e) => {
      if (resizingCol !== null) {
        const delta = e.clientX - dragStart;
        const newWidth = Math.max(60, sizeStart + delta);
        setColWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
        latestWidthRef.current = newWidth;
      } else if (resizingRow !== null) {
        const delta = e.clientY - dragStart;
        const newHeight = Math.max(24, sizeStart + delta);
        setRowHeights(prev => ({ ...prev, [resizingRow]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      if (resizingCol !== null && latestWidthRef.current !== undefined) {
        const finalWidth = latestWidthRef.current;
        setCustomColumns(prevCols => {
          const newCols = prevCols.map(c => c.key === resizingCol ? { ...c, width: finalWidth } : c);
          saveSheetMeta(`${storageKey}_columns`, newCols).catch(err => console.error(err));
          return newCols;
        });
        latestWidthRef.current = undefined;
      }
      setResizingCol(null);
      setResizingRow(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, resizingRow, dragStart, sizeStart]);

  // Tab management logic inside ExcelGrid
  const saveTabsIndex = (updatedTabs) => {
    try {
      localStorage.setItem(TABS_INDEX_KEY, JSON.stringify(updatedTabs));
    } catch (e) {
      console.error('[ExcelGrid] Failed to save tabs index:', e);
    }
  };

  const handleCreateTab = async () => {
    let sheetName = `Sheet ${tabs.length + 1}`;
    if (!disableRenameTabs) {
      try {
        const input = prompt("Enter a name for the new sheet:", sheetName);
        if (input === null) return; // Cancelled
        const trimmed = input.trim();
        if (trimmed) sheetName = trimmed;
      } catch (err) {
        console.warn("Prompt blocked, using default name:", err);
      }
    }

    const id = 'tab_' + Date.now();
    const tabStorageKey = `${storageKey}_tab_${id}`;
    
    const newTab = {
      id,
      name: sheetName,
      storageKey: tabStorageKey
    };

    const emptyRows = [];
    for (let r = 0; r < 20; r++) {
      const emptyRow = {};
      customColumns.forEach(c => emptyRow[c.key] = '');
      emptyRows.push(emptyRow);
    }
    await saveSheetData(tabStorageKey, emptyRows);
    await saveSheetMeta(`${tabStorageKey}_nextid`, 1);

    const updated = [...tabs, newTab];
    setTabs(updated);
    saveTabsIndex(updated);
    setActiveTabId(id);
  };

  const handleDeleteTab = (id) => {
    if (id === 'default') {
      alert("Cannot delete the default sheet.");
      return;
    }
    if (tabs.length <= 1) {
      alert("Cannot delete the last remaining sheet.");
      return;
    }
    if (!confirm('Delete this sheet and all its data?')) return;
    
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      deleteSheet(tab.storageKey);
    }

    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    saveTabsIndex(updated);

    if (activeTabId === id) {
      setActiveTabId(updated[0].id);
    }
  };

  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');

  const handleRenameTab = (id) => {
    if (!editingTabName.trim()) return;
    const updated = tabs.map(t => t.id === id ? { ...t, name: editingTabName.trim() } : t);
    setTabs(updated);
    saveTabsIndex(updated);
    setEditingTabId(null);
  };

  // Debounced auto-save strictly to IndexedDB to bypass localStorage limits and prevent main-thread lag
  useEffect(() => {
    if (isLoading) return; // Don't save while initial data is still loading

    const timer = setTimeout(async () => {
      try {
        const cleanData = getCleanGridData(data, customColumns);
        await saveSheetData(activeStorageKey, cleanData);
        await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum);
        await saveSheetMeta(`${storageKey}_columns`, customColumns);
        if (onDataChange) {
          onDataChange(cleanData);
        }
      } catch (e) {
        console.error('Failed to auto-save to IndexedDB:', e);
        setToast('❌ Critical: Database auto-save failed!');
      }
    }, 1000); // 1-second debounce to smooth out consecutive edits

    return () => clearTimeout(timer);
  }, [data, activeStorageKey, nextIdNum, customColumns, onDataChange, isLoading]);

  const lastStorageKeyRef = useRef(activeStorageKey);

  // Asynchronous primary data loading from IndexedDB (with localStorage migration fallback)
  useEffect(() => {
    let active = true;
    
    // Only show full loading overlay if the sheet key actually changed (switching tabs or months)
    if (lastStorageKeyRef.current !== activeStorageKey) {
      setIsLoading(true);
      lastStorageKeyRef.current = activeStorageKey;
    }

    async function loadData() {
      try {
        // 1. Try to load from IndexedDB first
        let loadedData = await getSheetData(activeStorageKey);
        let nextId = await getSheetMeta(`${activeStorageKey}_nextid`);
        let loadedCols = await getSheetMeta(`${storageKey}_columns`);

        // 2. Migration fallback: check if data exists in localStorage but not in IndexedDB
        if (!loadedData) {
          const savedLocal = localStorage.getItem(activeStorageKey);
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                loadedData = parsed;
                await saveSheetData(activeStorageKey, parsed);
                localStorage.removeItem(activeStorageKey);
                console.log(`[SheetDB] Migrated sheet data for ${activeStorageKey} to IndexedDB.`);
              }
            } catch (e) {}
          }
        }

        if (!nextId) {
          const savedLocalNextId = localStorage.getItem(`${activeStorageKey}_nextid`);
          if (savedLocalNextId) {
            nextId = parseInt(savedLocalNextId) || 1;
            await saveSheetMeta(`${activeStorageKey}_nextid`, nextId);
            localStorage.removeItem(`${activeStorageKey}_nextid`);
          }
        }

        if (!loadedCols) {
          // Migration: check old per-tab key in IndexedDB
          if (activeStorageKey !== storageKey) {
            loadedCols = await getSheetMeta(`${activeStorageKey}_columns`);
            if (loadedCols) {
              await saveSheetMeta(`${storageKey}_columns`, loadedCols);
            }
          }
        }
        if (!loadedCols) {
          const savedLocalCols = localStorage.getItem(`${storageKey}_columns`) || localStorage.getItem(`${activeStorageKey}_columns`);
          if (savedLocalCols) {
            try {
              const parsed = JSON.parse(savedLocalCols);
              if (Array.isArray(parsed)) {
                loadedCols = parsed;
                await saveSheetMeta(`${storageKey}_columns`, parsed);
                localStorage.removeItem(`${storageKey}_columns`);
                localStorage.removeItem(`${activeStorageKey}_columns`);
              }
            } catch (e) {}
          }
        }

        // 3. Process the loaded data
        if (!loadedData || loadedData.length === 0) {
          loadedData = initialData || [];
        }
        loadedData = getCleanGridData(loadedData, columns);

        if (computeRow && loadedData.length > 0) {
          loadedData = loadedData.map(r => {
            try {
              return computeRow(r);
            } catch (e) {
              return r;
            }
          });
        }

        // Pad to minimum 20 rows
        const padded = [...loadedData];
        while (padded.length < 20) {
          const emptyRow = {};
          columns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }

        if (active) {
          setData(padded);
          setNextIdNum(nextId || 1);
          if (loadedCols) {
            setCustomColumns(columns.map(c => {
              const matched = loadedCols.find(p => p && p.key === c.key);
              return matched ? { ...c, label: matched.label, group: matched.group || c.group, superGroup: matched.superGroup || c.superGroup, width: matched.width !== undefined ? matched.width : c.width } : c;
            }));
            setColWidths(prev => {
              const widths = { ...prev };
              loadedCols.forEach(col => {
                if (col && col.key) {
                  widths[col.key] = col.width !== undefined ? col.width : (widths[col.key] || col.width || 120);
                }
              });
              return widths;
            });
          } else {
            setCustomColumns(columns.map(c => ({ ...c })));
            setColWidths(prev => {
              const widths = { ...prev };
              columns.forEach(col => {
                if (col && col.key) {
                  widths[col.key] = col.width || 120;
                }
              });
              return widths;
            });
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load spreadsheet from IndexedDB, attempting auto-repair:", err);
        if (active) {
          try {
            let fallbackData = initialData || [];
            fallbackData = getCleanGridData(fallbackData, columns);
            if (computeRow && fallbackData.length > 0) {
              fallbackData = fallbackData.map(r => {
                try { return computeRow(r); } catch { return r; }
              });
            }
            const padded = [...fallbackData];
            while (padded.length < 20) {
              const emptyRow = {};
              columns.forEach(c => emptyRow[c.key] = '');
              padded.push(emptyRow);
            }
            setData(padded);
            setNextIdNum(1);
            saveSheetData(activeStorageKey, padded).catch(saveErr => console.error('[ExcelGrid] Repair save failed:', saveErr));
            showToast('Sheet data recovered from database corruption.');
          } catch (repairErr) {
            console.error('Database auto-repair failed:', repairErr);
          }
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [activeStorageKey, columns, computeRow, refreshTrigger]);


  const tableRef = useRef(null);
  const editInputRef = useRef(null);
  const gridContainerRef = useRef(null);
  const lastScrollLeftRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const latestWidthRef = useRef(undefined);
  const isFocusTransitionRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const scrollIntervalRef = useRef(null);

  const term = searchTerm.toLowerCase();
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply column filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(row => {
        for (const [key, val] of Object.entries(activeFilters)) {
          if (val && val !== '' && row[key] !== val) return false;
        }
        return true;
      });
    }

    // Apply search term
    if (term !== '') {
      result = result.filter(row => {
        return customColumns.some(col => {
          const val = row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }
    
    return result;
  }, [data, term, customColumns, activeFilters]);

  // O(1) row to absolute index map
  const rowToIndexMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < data.length; i++) {
      map.set(data[i], i);
    }
    return map;
  }, [data]);

  // O(1) row to filtered index map
  const rowToFilteredIndexMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < filteredData.length; i++) {
      map.set(filteredData[i], i);
    }
    return map;
  }, [filteredData]);

  // Precomputed range selection bounds for O(1) cell selection checks
  const selectionBounds = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const startRowObj = data[rangeStart.row];
    const endRowObj = data[rangeEnd.row];
    if (!startRowObj || !endRowObj) return null;
    const startFIdx = rowToFilteredIndexMap.get(startRowObj);
    const endFIdx = rowToFilteredIndexMap.get(endRowObj);
    if (startFIdx === undefined || endFIdx === undefined) return null;
    return {
      minF: Math.min(startFIdx, endFIdx),
      maxF: Math.max(startFIdx, endFIdx),
      minC: Math.min(rangeStart.col, rangeEnd.col),
      maxC: Math.max(rangeStart.col, rangeEnd.col)
    };
  }, [rangeStart, rangeEnd, data, rowToFilteredIndexMap]);

  // O(1) check if a cell is inside the selected range
  const isCellInRange = useCallback((originalIdx, col) => {
    if (!selectionBounds) return false;
    const rowObj = data[originalIdx];
    if (!rowObj) return false;
    const fIdx = rowToFilteredIndexMap.get(rowObj);
    if (fIdx === undefined) return false;
    return fIdx >= selectionBounds.minF && fIdx <= selectionBounds.maxF && col >= selectionBounds.minC && col <= selectionBounds.maxC;
  }, [selectionBounds, data, rowToFilteredIndexMap]);

  // Calculate selection metrics
  const selectionMetrics = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    let r1 = Math.min(rangeStart.row, rangeEnd.row);
    let r2 = Math.max(rangeStart.row, rangeEnd.row);
    let c1 = Math.min(rangeStart.col, rangeEnd.col);
    let c2 = Math.max(rangeStart.col, rangeEnd.col);

    // If it's a single cell, don't show metrics
    if (r1 === r2 && c1 === c2) return null;

    let sum = 0;
    let count = 0;
    let countA = 0;
    let min = Infinity;
    let max = -Infinity;
    const numericValues = [];

    for (let r = r1; r <= r2; r++) {
      const rowData = data[r];
      if (!rowData) continue;

      for (let c = c1; c <= c2; c++) {
        if (c >= customColumns.length) continue;
        const val = rowData[customColumns[c].key];
        if (val !== null && val !== undefined && val !== '') {
          countA++;
          const num = Number(val);
          if (!isNaN(num)) {
            sum += num;
            count++;
            numericValues.push(num);
            if (num < min) min = num;
            if (num > max) max = num;
          }
        }
      }
    }

    if (countA === 0) return null;

    // Calculate MEDIAN
    let median = null;
    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Calculate STDEV (sample standard deviation)
    let stdev = null;
    if (numericValues.length > 1) {
      const mean = sum / count;
      const squaredDiffs = numericValues.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (numericValues.length - 1);
      stdev = Math.sqrt(variance);
    }

    return {
      sum: count > 0 ? sum : null,
      avg: count > 0 ? (sum / count) : null,
      count: count,
      countA: countA,
      min: count > 0 ? min : null,
      max: count > 0 ? max : null,
      median: median,
      stdev: stdev
    };
  }, [rangeStart, rangeEnd, data, customColumns]);

  const [showTotals, setShowTotals] = useState(false);

  // Sync with parent is handled by the auto-save useEffect, so this is redundant

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current.type === 'text') {
        const val = editInputRef.current.value || '';
        try {
          editInputRef.current.setSelectionRange(val.length, val.length);
        } catch (e) {
          // Ignore DOMExceptions for unsupported input types
        }
      }
      // Clear the pending-edit flag now that the input is focused
      pendingEditRef.current = false;
    }
  }, [editingCell]);

  // Handle global clicks to close context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.show) setContextMenu(prev => ({ ...prev, show: false }));
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.show]);

  // Handle global mouse up for selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
      isDraggingRef.current = false;
      dragOriginRef.current = null;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle auto-scroll and selection updates during drag selection
  useEffect(() => {
    if (!isSelecting) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const container = gridContainerRef.current;
    if (!container) return;

    scrollIntervalRef.current = setInterval(() => {
      if (!isDraggingRef.current) return;

      const rect = container.getBoundingClientRect();
      const { x: clientX, y: clientY } = mousePositionRef.current;

      const edgeThreshold = 40; // px
      const maxScrollSpeed = 20; // px per tick

      let scrollX = 0;
      let scrollY = 0;

      if (clientY > rect.bottom - edgeThreshold) {
        scrollY = Math.min(maxScrollSpeed, ((clientY - (rect.bottom - edgeThreshold)) / edgeThreshold) * maxScrollSpeed);
        if (scrollY < 4) scrollY = 4;
      } else if (clientY < rect.top + edgeThreshold) {
        scrollY = -Math.min(maxScrollSpeed, (((rect.top + edgeThreshold) - clientY) / edgeThreshold) * maxScrollSpeed);
        if (scrollY > -4) scrollY = -4;
      }

      if (clientX > rect.right - edgeThreshold) {
        scrollX = Math.min(maxScrollSpeed, ((clientX - (rect.right - edgeThreshold)) / edgeThreshold) * maxScrollSpeed);
        if (scrollX < 4) scrollX = 4;
      } else if (clientX < rect.left + edgeThreshold) {
        scrollX = -Math.min(maxScrollSpeed, (((rect.left + edgeThreshold) - clientX) / edgeThreshold) * maxScrollSpeed);
        if (scrollX > -4) scrollX = -4;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        container.scrollLeft += scrollX;
        container.scrollTop += scrollY;

        try {
          const element = document.elementFromPoint(clientX, clientY);
          if (element) {
            const td = element.closest('td');
            if (td && td.id) {
              const match = td.id.match(/cell-.+-(\d+)-(\d+)$/);
              if (match) {
                const row = parseInt(match[1], 10);
                const col = parseInt(match[2], 10);
                setRangeEnd({ row, col });
              }
            }
          }
        } catch (err) {
          console.error("Error updating cell selection: ", err);
        }
      }
    }, 16);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isSelecting, activeStorageKey]);

  // Scroll and Resize observer for virtualization container measurements
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height || 600);
      }
    });
    resizeObserver.observe(container);
    
    const handleScrollEvent = () => {
      setScrollTop(container.scrollTop);
      // Always track scroll position unless we are in a programmatic focus transition
      if (!isFocusTransitionRef.current) {
        lastScrollLeftRef.current = container.scrollLeft;
        lastScrollTopRef.current = container.scrollTop;
      }
    };
    
    container.addEventListener('scroll', handleScrollEvent, { passive: true });
    // Initial dimensions
    setContainerHeight(container.clientHeight || 600);
    setScrollTop(container.scrollTop);
    
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScrollEvent);
    };
  }, []);

  // Print detection to disable virtualization, ensuring all rows render for print/PDF export
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Prevent browser scroll jumps when editing ends
  useEffect(() => {
    if (!editingCell && !editingHeader && !editingGroup && !editingSuperGroup && gridContainerRef.current) {
      gridContainerRef.current.focus({ preventScroll: true });
    }
  }, [editingCell, editingHeader, editingGroup, editingSuperGroup]);

  // Viewport alignment on keyboard selectedCell change removed to prevent auto-scrolling on mouse click

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const pushUndo = useCallback(() => {
    setUndoStack(prev => {
      const newStack = [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }];
      if (newStack.length > 30) newStack.shift();
      return newStack;
    });
    setRedoStack([]);
  }, [data, customColumns]);

  const pushHighlightUndo = useCallback(() => {
    const bgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightUndoStack(prev => {
      const newStack = [...prev, bgState];
      if (newStack.length > 30) newStack.shift();
      return newStack;
    });
    setHighlightRedoStack([]);
  }, [data]);

  const handleHighlightUndo = useCallback(() => {
    if (highlightUndoStack.length === 0) return;
    const currentBgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightRedoStack(prev => [...prev, currentBgState]);
    const previousBgState = highlightUndoStack[highlightUndoStack.length - 1];
    setData(prev => prev.map((row, idx) => {
      if (idx >= previousBgState.length) return row;
      const updatedRow = { ...row };
      updatedRow._cellStyles = { ...row._cellStyles };
      Object.keys(updatedRow._cellStyles).forEach(colKey => {
        const style = updatedRow._cellStyles[colKey];
        if (typeof style === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (style) {
          const newStyle = { ...style };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
      });
      const rowBgs = previousBgState[idx];
      Object.keys(rowBgs).forEach(colKey => {
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          currentStyle = { background: currentStyle };
        } else if (!currentStyle) {
          currentStyle = {};
        }
        updatedRow._cellStyles[colKey] = { ...currentStyle, background: rowBgs[colKey] };
      });
      return updatedRow;
    }));
    setHighlightUndoStack(prev => prev.slice(0, -1));
    setHasUnsaved(true);
  }, [data, highlightUndoStack]);

  const handleHighlightRedo = useCallback(() => {
    if (highlightRedoStack.length === 0) return;
    const currentBgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightUndoStack(prev => [...prev, currentBgState]);
    const nextBgState = highlightRedoStack[highlightRedoStack.length - 1];
    setData(prev => prev.map((row, idx) => {
      if (idx >= nextBgState.length) return row;
      const updatedRow = { ...row };
      updatedRow._cellStyles = { ...row._cellStyles };
      Object.keys(updatedRow._cellStyles).forEach(colKey => {
        const style = updatedRow._cellStyles[colKey];
        if (typeof style === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (style) {
          const newStyle = { ...style };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
      });
      const rowBgs = nextBgState[idx];
      Object.keys(rowBgs).forEach(colKey => {
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          currentStyle = { background: currentStyle };
        } else if (!currentStyle) {
          currentStyle = {};
        }
        updatedRow._cellStyles[colKey] = { ...currentStyle, background: rowBgs[colKey] };
      });
      return updatedRow;
    }));
    setHighlightRedoStack(prev => prev.slice(0, -1));
    setHasUnsaved(true);
  }, [data, highlightRedoStack]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }]);
    const previousState = undoStack[undoStack.length - 1];
    
    if (Array.isArray(previousState)) {
      setData(previousState);
    } else {
      setData(previousState.data);
      setCustomColumns(previousState.columns);
    }
    
    setUndoStack(prev => prev.slice(0, -1));
    setEditingCell(null);
    setHasUnsaved(true);
  }, [data, customColumns, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }]);
    const nextState = redoStack[redoStack.length - 1];
    
    if (Array.isArray(nextState)) {
      setData(nextState);
    } else {
      setData(nextState.data);
      setCustomColumns(nextState.columns);
    }
    
    setRedoStack(prev => prev.slice(0, -1));
    setEditingCell(null);
    setHasUnsaved(true);
  }, [data, customColumns, redoStack]);

  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
  
  const handleAnalyze = (action) => {
    setShowAnalysisMenu(false);
    if (!selectedCell && !rangeStart) {
      showToast('Please select a column to analyze.');
      return;
    }
    const cIdx = selectedCell ? selectedCell.col : rangeStart.col;
    if (cIdx >= customColumns.length) return;
    
    const colKey = customColumns[cIdx].key;
    const colLabel = customColumns[cIdx].label;

    // Smart detection: block math operations on logical fields
    const skipPatterns = [
      'age', 'mobile', 'phone', 'tel', 'contact', 'pin', 'zip', 'code',
      'id', 'empid', 'employee_id', 'employeeid', 's.n', 'sn', 'serial', 'sr',
      'date', 'time', 'year', 'month', 'day', 'dob', 'joining',
      'name', 'patient', 'employee', 'doctor', 'nurse', 'person',
      'department', 'dept', 'designation', 'shift', 'location', 'address',
      'remark', 'note', 'observation', 'status', 'gender', 'sex',
      'blood', 'group', 'batch', 'lot', 'rack', 'manufacturer',
      'complaint', 'diagnosis', 'treatment', 'medicine', 'prescribed',
      'referred', 'reported', 'checked', 'escorted', 'administered',
      'allerg', 'condition', 'effect', 'signature', 'ambulance',
      'body', 'part', 'nature', 'type', 'category', 'unit', 'dose',
      'vaccine', 'item', 'ppe', 'complian', 'fitness', 'vision',
      'hearing', 'lung', 'x-ray', 'ecg', 'overall', 'test', 'result',
      'expiry', 'replace', 'issue', 'emergency', 'response',
      'lastupdate', 'last_update', 'lastupdated',
      'handover', 'outside', 'g.code', 'gcode',
    ];
    
    const k = colKey.toLowerCase().replace(/[_\-\s]/g, '');
    const l = colLabel.toLowerCase().replace(/[_\-\s]/g, '');
    const isLogicalCol = customColumns[cIdx].type === 'date' || 
                         customColumns[cIdx].type === 'datetime-local' || 
                         customColumns[cIdx].type === 'select' || 
                         skipPatterns.some(p => {
                           const pattern = p.replace(/[_\-\s]/g, '');
                           return k.includes(pattern) || l.includes(pattern);
                         });

    const mathActions = ['running_total', 'rank', 'percent_total', 'sumif', 'averageif', 'top3', 'bottom3', 'math_multiply', 'math_add', 'math_subtract', 'math_divide', 'math_constant', 'quick_stats'];
    
    if (mathActions.includes(action) && isLogicalCol) {
      showToast(`Cannot perform mathematical operations on a logical or descriptive column ("${colLabel}"). Please select a numerical column like Quantity or Amount.`, 'error');
      return;
    }

    pushUndo();
    
    if (action === 'running_total') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `Running Total (${colLabel})`, width: 150, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 150 }));
      
      let runningSum = 0;
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        if (!isNaN(val)) runningSum += val;
        return { ...row, [newKey]: runningSum };
      }));
    } 
    else if (action === 'rank') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `Rank (${colLabel})`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      // Proper dense ranking: sort unique values, map each to its rank
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      const uniqueSorted = [...new Set(allNums)].sort((a, b) => b - a);
      const rankMap = new Map();
      uniqueSorted.forEach((v, i) => rankMap.set(v, i + 1));
      
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        return { ...row, [newKey]: !isNaN(val) ? rankMap.get(val) : '' };
      }));
    }
    else if (action === 'percent_total') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `% of Total (${colLabel})`, width: 150, type: 'text' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 150 }));
      
      const total = data.reduce((sum, r) => {
        const val = Number(r[colKey]);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        let pct = '';
        if (!isNaN(val) && total !== 0) {
          pct = ((val / total) * 100).toFixed(2) + '%';
        }
        return { ...row, [newKey]: pct };
      }));
    }
    else if (action === 'top3' || action === 'bottom3') {
      const isTop = action === 'top3';
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      const uniqueSorted = [...new Set(allNums)].sort((a, b) => isTop ? b - a : a - b);
      const thresholdSet = new Set(uniqueSorted.slice(0, 3));
      
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        if (!isNaN(val) && thresholdSet.has(val)) {
          const currentStyle = row._cellStyles ? row._cellStyles[colKey] : {};
          return {
            ...row,
            _cellStyles: {
              ...row._cellStyles,
              [colKey]: { ...currentStyle, background: isTop ? '#dcfce7' : '#fee2e2', color: isTop ? '#166534' : '#991b1b', bold: true }
            }
          };
        }
        return row;
      }));
    }
    else if (action === 'countif') {
      const searchVal = prompt(`Count cells in "${colLabel}" that match value:`);
      if (searchVal === null) return;
      const matchCount = data.filter(r => String(r[colKey] || '').toLowerCase() === searchVal.toLowerCase()).length;
      showToast(`COUNTIF result: ${matchCount} rows match "${searchVal}" in ${colLabel}`);
      return; // No data modification
    }
    else if (action === 'sumif') {
      const searchVal = prompt(`Sum "${colLabel}" where value in which column matches? Enter column name:`);
      if (searchVal === null) return;
      const condCol = customColumns.find(c => c.label.toLowerCase() === searchVal.toLowerCase());
      if (!condCol) { showToast(`Column "${searchVal}" not found.`); return; }
      const condVal = prompt(`Sum "${colLabel}" where "${condCol.label}" equals:`);
      if (condVal === null) return;
      const result = data.reduce((sum, r) => {
        if (String(r[condCol.key] || '').toLowerCase() === condVal.toLowerCase()) {
          const num = Number(r[colKey]);
          if (!isNaN(num)) sum += num;
        }
        return sum;
      }, 0);
      showToast(`SUMIF result: ${result.toLocaleString()} (Sum of ${colLabel} where ${condCol.label} = "${condVal}")`);
      return;
    }
    else if (action === 'math_multiply' || action === 'math_add' || action === 'math_subtract' || action === 'math_divide') {
      const targetColLabel = prompt(`Enter the exact name of the column you want to ${action === 'math_multiply' ? 'multiply' : action === 'math_add' ? 'add' : action === 'math_subtract' ? 'subtract' : 'divide'} "${colLabel}" with/by:`);
      if (!targetColLabel) return;
      
      const targetCol = customColumns.find(c => c.label.toLowerCase() === targetColLabel.trim().toLowerCase());
      if (!targetCol) {
        showToast(`Column "${targetColLabel}" not found.`, 'error');
        return;
      }
      
      const newKey = `customCol_${Date.now()}`;
      let operator = action === 'math_multiply' ? '×' : action === 'math_add' ? '+' : action === 'math_subtract' ? '-' : '÷';
      const newCol = { key: newKey, label: `${colLabel} ${operator} ${targetCol.label}`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      setData(prev => prev.map(row => {
        const val1 = Number(row[colKey]);
        const val2 = Number(row[targetCol.key]);
        let result = '';
        if (!isNaN(val1) && !isNaN(val2)) {
          if (action === 'math_multiply') result = val1 * val2;
          else if (action === 'math_add') result = val1 + val2;
          else if (action === 'math_subtract') result = val1 - val2;
          else if (action === 'math_divide') result = val2 !== 0 ? val1 / val2 : 'Error';
          
          if (typeof result === 'number' && !Number.isInteger(result)) result = result.toFixed(2);
        }
        return { ...row, [newKey]: result };
      }));
    }
    else if (action === 'math_constant') {
      const constantStr = prompt(`Enter a number to multiply "${colLabel}" by:`);
      if (!constantStr || isNaN(Number(constantStr))) {
        showToast("Invalid number", "error");
        return;
      }
      const constant = Number(constantStr);
      
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `${colLabel} × ${constant}`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      setData(prev => prev.map(row => {
        const val1 = Number(row[colKey]);
        let result = '';
        if (!isNaN(val1)) {
          result = val1 * constant;
          if (!Number.isInteger(result)) result = result.toFixed(2);
        }
        return { ...row, [newKey]: result };
      }));
    }
    else if (action === 'quick_stats') {
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      if (allNums.length === 0) {
        showToast("No numeric data found in this column", "error");
        return;
      }
      const min = Math.min(...allNums);
      const max = Math.max(...allNums);
      const avg = allNums.reduce((a, b) => a + b, 0) / allNums.length;
      alert(`Statistics for "${colLabel}":\n\nMin: ${min}\nMax: ${max}\nAverage: ${avg.toFixed(2)}\nCount: ${allNums.length} valid numbers\nSum: ${allNums.reduce((a, b) => a + b, 0)}`);
      return;
    }
    else if (action === 'dedup') {
      const seen = new Set();
      let dupsRemoved = 0;
      const newData = data.filter(row => {
        const val = String(row[colKey] || '').toLowerCase().trim();
        if (val === '') return true;
        if (seen.has(val)) { dupsRemoved++; return false; }
        seen.add(val);
        return true;
      });
      if (dupsRemoved === 0) { showToast(`No duplicates found in "${colLabel}".`); return; }
      if (!window.confirm(`Found ${dupsRemoved} duplicate(s) in "${colLabel}". Remove them?`)) return;
      setData(newData);
    }
    
    setHasUnsaved(true);
  };

  const handleCopy = async () => {
    if (!selectedCell && !rangeStart) return;
    let r1 = selectedCell ? selectedCell.row : rangeStart.row;
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }
    let tsv = '';
    for (let r = r1; r <= r2; r++) {
      const row = data[r];
      if (!row) continue;
      const rowData = [];
      for (let c = c1; c <= c2; c++) {
        rowData.push(row[customColumns[c].key] || '');
      }
      tsv += rowData.join('\t') + '\n';
    }
    try {
      await navigator.clipboard.writeText(tsv);
      showToast('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCut = async () => {
    if (!selectedCell && !rangeStart) return;
    let r1 = selectedCell ? selectedCell.row : rangeStart.row;
    let r2 = r1;
    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
    }
    let hasDeducted = false;
    for (let r = r1; r <= r2; r++) {
      if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
    }
    if (hasDeducted) {
      showToast('Cannot cut from already deducted row(s). Please undo deduction first.', 'warning');
      return;
    }
    await handleCopy();
    pushUndo();
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }
    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        let updatedRow = { ...row };
        for (let c = c1; c <= c2; c++) {
          updatedRow[customColumns[c].key] = '';
        }
        if (computeRow) {
          try {
            updatedRow = computeRow(updatedRow);
          } catch (err) {
            console.error("Error computing row on cut", err);
          }
        }
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const handlePaste = async () => {
    if (!selectedCell) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const rows = text.split('\n').map(r => r.split('\t'));
      if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
        rows.pop(); // remove trailing newline
      }
      
      let startRow = selectedCell.row;
      let endRow = Math.min(startRow + rows.length - 1, data.length - 1);
      let hasDeducted = false;
      for (let r = startRow; r <= endRow; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot paste into already deducted row(s). Please undo deduction first.', 'warning');
        return;
      }

      pushUndo();
      let startCol = selectedCell.col;
      
      setData(prev => {
        const newData = [...prev];
        for (let i = 0; i < rows.length; i++) {
          const r = startRow + i;
          if (r >= newData.length) break;
          let updatedRow = { ...newData[r] };
          for (let j = 0; j < rows[i].length; j++) {
            const c = startCol + j;
            if (c >= customColumns.length) break;
            updatedRow[customColumns[c].key] = rows[i][j];
          }
          if (computeRow) {
            try {
              updatedRow = computeRow(updatedRow);
            } catch (err) {
              console.error("Error computing row on paste", err);
            }
          }
          newData[r] = updatedRow;
        }
        return newData;
      });
      setHasUnsaved(true);
    } catch (err) {
      console.error('Failed to paste', err);
    }
  };

  const exportToPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF({ orientation: customColumns.length > 6 ? 'landscape' : 'portrait' });
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`Jindal Steel - ${title}`, 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        const date = new Date().toLocaleString();
        doc.text(`Generated on: ${date}`, 14, 30);
        
        // Add table
        const tableColumn = customColumns.map(col => col.label);
        const tableRows = filteredData.map(row => {
          return customColumns.map(col => {
            const val = row[col.key];
            return val !== null && val !== undefined ? String(val) : '';
          });
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 }
        });
        
        doc.save(`Jindal_Steel_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        showToast('PDF Exported Successfully!');
      });
    }).catch(err => {
      console.error('Failed to load jspdf', err);
      showToast('Error exporting PDF');
    });
  };

  const commitEdit = (value, force = false) => {
    if (!editingCell) return;

    // Guard against immediate blur events (within 100ms) to prevent focus jitter from closing the editor
    if (!force && editStartTimeRef.current && (Date.now() - editStartTimeRef.current < 100)) {
      if (editInputRef.current && document.activeElement !== editInputRef.current) {
        try {
          editInputRef.current.focus();
        } catch (e) {
          console.warn('[ExcelGrid] Failed to re-focus input on jitter:', e);
        }
      }
      return;
    }

    const col = customColumns[editingCell.col];
    let finalValue = value;

    if ((col.type === 'select' || col.type === 'status') && col.options && (finalValue === 'Other' || finalValue === 'other')) {
      const customVal = window.prompt(`Enter new custom value for ${col.label || col.letter}:`);
      if (customVal && customVal.trim() !== '') {
        const trimmedVal = customVal.trim();
        const capitalizedVal = trimmedVal.charAt(0).toUpperCase() + trimmedVal.slice(1);
        
        if (!col.options.includes(capitalizedVal)) {
          const otherIdx = col.options.findIndex(opt => opt.toLowerCase() === 'other');
          let newOptions = [...col.options];
          if (otherIdx !== -1) {
            newOptions.splice(otherIdx, 0, capitalizedVal);
          } else {
            newOptions.push(capitalizedVal);
          }
          
          const newCols = customColumns.map(c => {
            if (c.key === col.key) {
              return { ...c, options: newOptions };
            }
            return c;
          });
          setCustomColumns(newCols);
          saveSheetMeta(`${storageKey}_columns`, newCols).catch(err => console.error(err));
        }
        finalValue = capitalizedVal;
      } else {
        finalValue = data[editingCell.row][col.key] || col.options[0];
      }
    }

    if (col.type === 'number') {
      if (value === '') {
        finalValue = '';
      } else {
        const num = Number(value);
        finalValue = isNaN(num) ? '' : num;
      }
    } else if ((!col.type || col.type === 'text') && typeof finalValue === 'string' && finalValue.length > 0) {
      finalValue = finalValue.charAt(0).toUpperCase() + finalValue.slice(1);
    }

    if (data[editingCell.row][col.key] !== finalValue) {
      let newData = [...data];
      let updatedRow = { ...newData[editingCell.row], [col.key]: finalValue };
      if (updatedRow.extracted !== undefined) {
        updatedRow.extracted = false;
      }
      
      if (customColumns.some(c => c.key === 'lastUpdated')) {
         const d = new Date();
         const offset = d.getTimezoneOffset();
         const localDate = new Date(d.getTime() - (offset * 60 * 1000));
         updatedRow['lastUpdated'] = localDate.toISOString().split('T')[0];
      }

      // Auto-populate the "date" column with today's local date if it exists, is currently empty,
      // and is not the specific column being edited (to allow manual clearing).
      const dateCol = customColumns.find(c => c && c.key === 'date');
      if (dateCol && col.key !== dateCol.key && (!updatedRow[dateCol.key] || String(updatedRow[dateCol.key]).trim() === '')) {
         const d = new Date();
         const offset = d.getTimezoneOffset();
         const localDate = new Date(d.getTime() - (offset * 60 * 1000));
         updatedRow[dateCol.key] = localDate.toISOString().split('T')[0];
      }
      
      if (computeRow) {
        try {
          updatedRow = computeRow(updatedRow);
        } catch (e) {
          console.error("Error computing row on edit", e);
        }
      }
      
      newData[editingCell.row] = updatedRow;
      setData(newData);
      setHasUnsaved(true);
    }
    setEditingCell(null);
  };

  const moveSelection = useCallback((dx, dy) => {
    if (!selectedCell) return;
    
    const selectedRowObj = data[selectedCell.row];
    const currentFilteredIdx = selectedRowObj ? rowToFilteredIndexMap.get(selectedRowObj) : -1;
    if (currentFilteredIdx === -1 || currentFilteredIdx === undefined) return; 

    let newCol = selectedCell.col + dx;
    let newFilteredIdx = currentFilteredIdx + dy;

    if (newCol >= customColumns.length) { newCol = 0; newFilteredIdx++; }
    if (newCol < 0) { newCol = customColumns.length - 1; newFilteredIdx--; }

    if (newFilteredIdx < 0) newFilteredIdx = 0;
    if (newFilteredIdx >= filteredData.length) newFilteredIdx = filteredData.length - 1;

    const newRowObj = filteredData[newFilteredIdx];
    const newRowAbsolute = newRowObj ? rowToIndexMap.get(newRowObj) : -1;
    
    const newCell = { row: newRowAbsolute, col: newCol };
    setSelectedCell(newCell);
    setRangeStart(newCell);
    setRangeEnd(newCell);
    
      setTimeout(() => {
        const cellId = `cell-${activeStorageKey}-${newRowAbsolute}-${newCol}`;
        const cellElement = document.getElementById(cellId);
        if (cellElement && gridContainerRef.current) {
          const container = gridContainerRef.current;
          const cellRect = cellElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const topBuffer = 80;
          const bottomBuffer = 140;
          const leftBuffer = 60;
          const rightBuffer = 60;

          if (cellRect.top < containerRect.top + topBuffer) {
            container.scrollTop -= (containerRect.top + topBuffer - cellRect.top);
          } else if (cellRect.bottom > containerRect.bottom - bottomBuffer) {
            container.scrollTop += (cellRect.bottom - (containerRect.bottom - bottomBuffer));
          }

          if (cellRect.left < containerRect.left + leftBuffer) {
            container.scrollLeft -= (containerRect.left + leftBuffer - cellRect.left);
          } else if (cellRect.right > containerRect.right - rightBuffer) {
            container.scrollLeft += (cellRect.right - (containerRect.right - rightBuffer));
          }
        }
      }, 0);
  }, [selectedCell, customColumns.length, data, filteredData, activeStorageKey, rowToIndexMap, rowToFilteredIndexMap]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If we just set editingCell and the input hasn't focused yet (pendingEditRef),
      // let the browser deliver the key to the input natively — don't intercept it.
      if (pendingEditRef.current && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        return;
      }

      // Ignore keypresses if the user is typing in an external input (like a chatbox or search bar)
      // BUT do not ignore if they are typing inside the cell edit input!
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        if (e.target !== editInputRef.current) {
          return;
        }
      }

      const key = e.key.toLowerCase();
      if (e.ctrlKey && (key === 'y' || (e.shiftKey && key === 'z'))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.ctrlKey && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.ctrlKey && key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
      if (e.ctrlKey && key === 'c' && !editingCell) {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (e.ctrlKey && key === 'x' && !editingCell) {
        e.preventDefault();
        handleCut();
        return;
      }
      if (e.ctrlKey && key === 'v' && !editingCell) {
        e.preventDefault();
        handlePaste();
        return;
      }
      if (e.ctrlKey && key === 's') {
        e.preventDefault();
        saveData();
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        moveColumn('left');
        return;
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        moveColumn('right');
        return;
      }
      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        if (!selectedCell) return;
        pushUndo();
        let r1 = selectedCell.row;
        let r2 = selectedCell.row;
        let c1 = selectedCell.col;
        let c2 = selectedCell.col;
        if (rangeStart && rangeEnd) {
          r1 = Math.min(rangeStart.row, rangeEnd.row);
          r2 = Math.max(rangeStart.row, rangeEnd.row);
          c1 = Math.min(rangeStart.col, rangeEnd.col);
          c2 = Math.max(rangeStart.col, rangeEnd.col);
        }
        if (r1 !== r2) {
          setData(prev => {
            const newData = [...prev];
            for (let c = c1; c <= c2; c++) {
              const colKey = customColumns[c].key;
              const sourceVal = newData[r1][colKey];
              for (let r = r1 + 1; r <= r2; r++) {
                newData[r] = { ...newData[r], [colKey]: sourceVal };
                if (computeRow) {
                  try {
                    newData[r] = computeRow(newData[r]);
                  } catch (e) {
                    console.error("Error computing row on fill", e);
                  }
                }
              }
            }
            return newData;
          });
          setHasUnsaved(true);
        }
        return;
      }

      if (editingCell) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit(editInputRef.current.value, true);
          moveSelection(e.shiftKey ? -1 : 1, 0); // Enter moves RIGHT
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit(editInputRef.current.value, true);
          moveSelection(e.shiftKey ? -1 : 1, 0); // Tab moves RIGHT
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingCell(null);
        }
        return;
      }

      if (!selectedCell) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection(0, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        moveSelection(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          moveSelection(-1, 0); // Shift+Enter moves LEFT
        } else {
          const col = customColumns[selectedCell.col];
          if (col && !col.readOnly) {
            const rowObj = data[selectedCell.row];
            if (rowObj && rowObj.status === 'Deducted' && col.key !== 'status') {
              showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
              return;
            }
            pushUndo();
            setEditingCell({ ...selectedCell });
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        let r1 = selectedCell.row;
        let r2 = selectedCell.row;
        let c1 = selectedCell.col;
        let c2 = selectedCell.col;
        if (rangeStart && rangeEnd) {
          r1 = Math.min(rangeStart.row, rangeEnd.row);
          r2 = Math.max(rangeStart.row, rangeEnd.row);
          c1 = Math.min(rangeStart.col, rangeEnd.col);
          c2 = Math.max(rangeStart.col, rangeEnd.col);
        }
        let hasReadOnly = false;
        for (let c = c1; c <= c2; c++) {
          if (customColumns[c]?.readOnly) hasReadOnly = true;
        }
        if (hasReadOnly) return;

        let hasDeducted = false;
        for (let r = r1; r <= r2; r++) {
          if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
        }
        if (hasDeducted) {
          showToast('Cannot delete from already deducted row(s). Please undo deduction first.', 'warning');
          return;
        }

        pushUndo();
        setData(prev => prev.map((row, idx) => {
          if (idx >= r1 && idx <= r2) {
            let updatedRow = { ...row };
            for (let c = c1; c <= c2; c++) {
              updatedRow[customColumns[c].key] = '';
            }
            if (computeRow) {
              try {
                updatedRow = computeRow(updatedRow);
              } catch (err) {
                console.error("Error computing row on delete", err);
              }
            }
            return updatedRow;
          }
          return row;
        }));
        setHasUnsaved(true);
      } else if (e.key === 'Escape') {
        setSelectedCell(null);
        setRangeStart(null);
        setRangeEnd(null);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const col = customColumns[selectedCell.col];
        if (col && !col.readOnly) {
          const rowObj = data[selectedCell.row];
          if (rowObj && rowObj.status === 'Deducted' && col.key !== 'status') {
            showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
            return;
          }
          e.preventDefault();
          pushUndo();
          // Pass the typed key into the editing state so it becomes the initial value
          setEditingCell({ ...selectedCell, initialValue: e.key });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    editingCell, selectedCell, data, undoStack, redoStack, moveSelection, pushUndo,
    handleUndo, handleRedo, customColumns, rangeStart, rangeEnd, computeRow, saveData,
    selectAll, handleCopy, handleCut, handlePaste, moveColumn, commitEdit
  ]);

  const onCellMouseDown = (e, row, col) => {
    if (e.button === 2) return; 

    // If clicking the cell currently being edited, let the user interact with the input (position cursor, select text, open dropdown etc.)
    if (editingCell && editingCell.row === row && editingCell.col === col) {
      return;
    }

    // Focus the grid container instead of blurring to prevent focus-drop scroll reset.
    // Avoid re-focusing if the container already has focus.
    if (gridContainerRef.current) {
      const container = gridContainerRef.current;
      if (document.activeElement !== container) {
        container.focus({ preventScroll: true });
      }
    } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    e.preventDefault();
    if (contextMenu.show) setContextMenu({ ...contextMenu, show: false });

    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      if (editInputRef.current) commitEdit(editInputRef.current.value, true);
    }

    const cell = { row, col };
    setSelectedCell(cell);
    setRangeStart(cell);
    setRangeEnd(cell);
    // Record the mouse-down position; only activate drag-selection after the mouse moves past a threshold
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    setIsSelecting(true);
    setEditingCell(null);
    setSelectionType('cell');

    if (isEraserMode) {
      pushUndo();
      pushHighlightUndo();
      eraseCellHighlight(row, col);
    }
  };

  const onCellMouseOver = (e, row, col) => {
    if (!isSelecting) return;

    // Require the mouse to move at least 5px from the initial click before starting drag-selection.
    // This prevents accidental selection jumps caused by micro-movements during a normal click.
    if (!isDraggingRef.current && dragOriginRef.current) {
      const dx = Math.abs(e.clientX - dragOriginRef.current.x);
      const dy = Math.abs(e.clientY - dragOriginRef.current.y);
      if (dx < 5 && dy < 5) return; // Not a real drag yet
      isDraggingRef.current = true;
    }

    setRangeEnd({ row, col });
    if (isEraserMode) {
      eraseCellHighlight(row, col);
    }
  };

  const selectWholeRow = (rowIdx) => {
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const cellStart = { row: rowIdx, col: 0 };
    const cellEnd = { row: rowIdx, col: customColumns.length - 1 };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('row');
  };

  const selectWholeColumn = (colIdx) => {
    if (filteredData.length === 0) return;
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const firstVisibleRowAbs = rowToIndexMap.get(filteredData[0]);
    const lastVisibleRowAbs = rowToIndexMap.get(filteredData[filteredData.length - 1]);
    const cellStart = { row: firstVisibleRowAbs, col: colIdx };
    const cellEnd = { row: lastVisibleRowAbs, col: colIdx };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('column');
  };

  function selectAll() {
    if (filteredData.length === 0) return;
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const firstVisibleRowAbs = rowToIndexMap.get(filteredData[0]);
    const lastVisibleRowAbs = rowToIndexMap.get(filteredData[filteredData.length - 1]);
    const cellStart = { row: firstVisibleRowAbs, col: 0 };
    const cellEnd = { row: lastVisibleRowAbs, col: customColumns.length - 1 };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('cell');
  };

  // isCellInRange has been moved above and optimized for O(1) performance

  const handleContextMenu = (e, row, col) => {
    e.preventDefault();
    const cell = { row, col };
    const isInsideRange = isCellInRange(row, col);
    if (!isInsideRange) {
      setSelectedCell(cell);
      setRangeStart(cell);
      setRangeEnd(cell);
    }
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, row, col });
  };

  const getEmptyRow = (idNum) => {
    const newRow = {};
    customColumns.forEach(c => {
      newRow[c.key] = '';
      if (c.options && c.options.length > 0 && c.type !== 'status') {
         newRow[c.key] = c.options[0];
      }
    });
    
    const idCol = customColumns.find(c => c.key === 'id');
    if (idCol) {
      newRow[idCol.key] = `${idPrefix}${String(idNum).padStart(3, '0')}`;
    }
    
    // Automatically populate date and time columns with current local date/time
    customColumns.forEach(c => {
      const k = c.key.toLowerCase();
      if (!k.includes('expiry') && !k.includes('due') && !k.includes('dob')) {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        
        if (c.type === 'date' || k === 'date') {
          newRow[c.key] = localDate.toISOString().split('T')[0];
        } else if (c.type === 'time' || k === 'time') {
          newRow[c.key] = localDate.toISOString().split('T')[1].substring(0, 5);
        } else if (c.type === 'datetime-local') {
          newRow[c.key] = localDate.toISOString().substring(0, 16);
        }
      }
    });
    
    const statusCol = customColumns.find(c => c.type === 'status');
    if (statusCol && statusCol.options && statusCol.options.length > 0) {
      newRow[statusCol.key] = statusCol.options[0];
    }
    
    if (computeRow) {
      try {
        return computeRow(newRow);
      } catch (err) {
        console.error("Error computing row on empty creation", err);
      }
    }
    return newRow;
  };

  const contextAction = (action) => {
    const { row, col } = contextMenu;
    if (action === 'moveColLeft') {
      moveColumn('left');
      setContextMenu({ ...contextMenu, show: false });
      return;
    }
    if (action === 'moveColRight') {
      moveColumn('right');
      setContextMenu({ ...contextMenu, show: false });
      return;
    }

    // Integrity checks for already Deducted rows
    if (action === 'deleteRow') {
      let rowsToDelete = new Set();
      if (rangeStart && rangeEnd) {
         const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
         const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
         const minF = Math.min(startFIdx, endFIdx);
         const maxF = Math.max(startFIdx, endFIdx);
         for(let i=minF; i<=maxF; i++) {
            if (i !== -1) rowsToDelete.add(data.indexOf(filteredData[i]));
         }
      } else {
         rowsToDelete.add(row);
      }
      rowsToDelete.delete(-1);
      
      let hasDeducted = false;
      rowsToDelete.forEach(r => {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      });
      if (hasDeducted) {
        showToast('Cannot delete already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'clearCell') {
      let r1 = row;
      let r2 = row;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
      }
      let hasDeducted = false;
      for (let r = r1; r <= r2; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot clear cells in already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'clearColumn') {
      let hasDeducted = false;
      for (let r = 0; r < data.length; r++) {
        if (data[r] && data[r].status === 'Deducted' && data[r][customColumns[col].key] !== '') {
          hasDeducted = true;
        }
      }
      if (hasDeducted) {
        showToast('Cannot clear column values for already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'fillDown') {
      let r1 = row;
      let r2 = row;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
      }
      let hasDeducted = false;
      for (let r = r1; r <= r2; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot fill down into already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    }

    pushUndo();
    const newData = [...data];
    let newIdNum = nextIdNum;

    if (action === 'insertAbove') {
      newData.splice(row, 0, getEmptyRow(newIdNum++));
    } else if (action === 'insertBelow') {
      newData.splice(row + 1, 0, getEmptyRow(newIdNum++));
    } else if (action === 'deleteRow') {
      let rowsToDelete = new Set();
      if (rangeStart && rangeEnd) {
         const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
         const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
         const minF = Math.min(startFIdx, endFIdx);
         const maxF = Math.max(startFIdx, endFIdx);
         for(let i=minF; i<=maxF; i++) {
            if (i !== -1) rowsToDelete.add(data.indexOf(filteredData[i]));
         }
      } else {
         rowsToDelete.add(row);
      }
      rowsToDelete.delete(-1);
      if (rowsToDelete.size > 0) {
        const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
        sortedRows.forEach(r => newData.splice(r, 1));
      }
      setSelectedCell(null);
      setRangeStart(null);
      setRangeEnd(null);
    } else if (action === 'insertColLeft' || action === 'insertColRight') {
      const insertAt = action === 'insertColLeft' ? col : col + 1;
      const newCols = [...customColumns];
      newCols.splice(insertAt, 0, {
        key: 'custom_' + Date.now(),
        label: 'New Column',
        width: 120,
        type: 'text'
      });
      newCols.forEach((c, i) => {
        let letter = '';
        let temp = i;
        while (temp >= 0) {
          letter = String.fromCharCode((temp % 26) + 65) + letter;
          temp = Math.floor(temp / 26) - 1;
        }
        c.letter = letter;
      });
      setCustomColumns(newCols);
      saveSheetMeta(`${storageKey}_columns`, newCols);
      setHasUnsaved(true);
      return;
    } else if (action === 'deleteCol') {
      const newCols = [...customColumns];
      newCols.splice(col, 1);
      newCols.forEach((c, i) => {
        let letter = '';
        let temp = i;
        while (temp >= 0) {
          letter = String.fromCharCode((temp % 26) + 65) + letter;
          temp = Math.floor(temp / 26) - 1;
        }
        c.letter = letter;
      });
      setCustomColumns(newCols);
      saveSheetMeta(`${storageKey}_columns`, newCols);
      setHasUnsaved(true);
      return;
    } else if (action === 'clearCell') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          newData[r] = { ...newData[r], [customColumns[c].key]: '' };
        }
      }
    } else if (action === 'clearColumn') {
      const colKey = customColumns[col].key;
      for (let r = 0; r < newData.length; r++) {
        newData[r] = { ...newData[r], [colKey]: '' };
      }
    } else if (action === 'fillDown') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      if (r1 !== r2) {
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          const sourceVal = newData[r1][colKey];
          const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
          for (let r = r1 + 1; r <= r2; r++) {
            newData[r] = { ...newData[r], [colKey]: sourceVal };
            if (sourceStyle) {
              if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
              newData[r]._cellStyles[colKey] = { ...sourceStyle };
            }
            if (computeRow) {
              try {
                newData[r] = computeRow(newData[r]);
              } catch (e) {
                console.error("Error computing row on fill", e);
              }
            }
          }
        }
      }
    } else if (action === 'fillSeries') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      if (r1 !== r2) {
        const incrementValue = (val, step) => {
          if (val === null || val === undefined || val === '') return '';
          const numMatch = String(val).match(/^(.*?)(\d+)$/);
          if (numMatch && isNaN(val)) {
            const prefix = numMatch[1];
            const numStr = numMatch[2];
            const nextNum = parseInt(numStr) + step;
            return prefix + String(nextNum).padStart(numStr.length, '0');
          }
          if (!isNaN(val) && val !== '') {
            return Number(val) + step;
          }
          const dateReg = /^\d{4}-\d{2}-\d{2}$/;
          if (dateReg.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + step);
              return d.toISOString().split('T')[0];
            }
          }
          return val;
        };

        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          const sourceVal = newData[r1][colKey];
          const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
          let step = 1;
          for (let r = r1 + 1; r <= r2; r++) {
            newData[r] = { ...newData[r], [colKey]: incrementValue(sourceVal, step++) };
            if (sourceStyle) {
              if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
              newData[r]._cellStyles[colKey] = { ...sourceStyle };
            }
            if (computeRow) {
              try {
                newData[r] = computeRow(newData[r]);
              } catch (e) {
                console.error("Error computing row on fill", e);
              }
            }
          }
        }
      }
    } else if (action === 'copyRow') {
      const copy = { ...newData[row] };
      const idCol = customColumns.find(c => c.key.toLowerCase() === 'id' || c.key.toLowerCase().includes('id'));
      if (idCol) {
         copy[idCol.key] = `${idPrefix}${String(newIdNum++).padStart(3, '0')}`;
      }
      newData.splice(row + 1, 0, copy);
    }

    setNextIdNum(newIdNum);
    setData(newData);
    setHasUnsaved(true);
    setContextMenu({ ...contextMenu, show: false });
  };

  const highlightEntireRow = (color) => {
    if (!selectedCell) return;
    pushUndo();
    pushHighlightUndo();
    const targetRow = selectedCell.row;
    setData(prev => prev.map((row, idx) => {
      if (idx === targetRow) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        customColumns.forEach(col => {
          let currentStyle = updatedRow._cellStyles[col.key];
          if (typeof currentStyle === 'string') currentStyle = { background: currentStyle };
          else if (!currentStyle) currentStyle = {};
          updatedRow._cellStyles[col.key] = { ...currentStyle, background: color };
        });
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const highlightEntireCol = (color) => {
    if (!selectedCell) return;
    pushUndo();
    pushHighlightUndo();
    const targetColKey = customColumns[selectedCell.col].key;
    setData(prev => prev.map(row => {
      const updatedRow = { ...row };
      if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
      let currentStyle = updatedRow._cellStyles[targetColKey];
      if (typeof currentStyle === 'string') currentStyle = { background: currentStyle };
      else if (!currentStyle) currentStyle = {};
      updatedRow._cellStyles[targetColKey] = { ...currentStyle, background: color };
      return updatedRow;
    }));
    setHasUnsaved(true);
  };

  const eraseCellHighlight = (rowIdx, colIdx) => {
    const colKey = customColumns[colIdx].key;
    setData(prev => prev.map((row, idx) => {
      if (idx === rowIdx) {
        if (!row._cellStyles || !row._cellStyles[colKey]) return row;
        const updatedRow = { ...row };
        updatedRow._cellStyles = { ...row._cellStyles };
        
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (currentStyle) {
          const newStyle = { ...currentStyle };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const applyColor = (color) => {
    if (!selectedCell && !rangeStart) return;
    pushUndo();
    pushHighlightUndo();
    
    let r1 = selectedCell ? selectedCell.row : (rangeStart ? rangeStart.row : 0);
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : (rangeStart ? rangeStart.col : 0);
    let c2 = c1;

    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    // Convert from absolute grid rows to currently filtered rows if selection was done via filter
    // Wait, the selection is tracked in absolute data indices (`row` and `col` are data.indexOf).
    // rangeStart.row is the absolute index in data array.
    
    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        
        let changed = false;
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          let currentStyle = updatedRow._cellStyles[colKey];
          
          if (typeof currentStyle === 'string') {
            currentStyle = { background: currentStyle };
          } else if (!currentStyle) {
            currentStyle = {};
          }
          
          if (currentStyle.background !== color) {
            updatedRow._cellStyles[colKey] = { ...currentStyle, background: color };
            changed = true;
          }
        }
        return changed ? updatedRow : row;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const applyFormat = (formatType, value) => {
    if (!selectedCell && !rangeStart) return;
    pushUndo();
    
    let r1 = selectedCell ? selectedCell.row : (rangeStart ? rangeStart.row : 0);
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : (rangeStart ? rangeStart.col : 0);
    let c2 = c1;

    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        
        let changed = false;
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          let currentStyle = updatedRow._cellStyles[colKey];
          
          if (typeof currentStyle === 'string') {
            currentStyle = { background: currentStyle };
          } else if (!currentStyle) {
            currentStyle = {};
          }
          
          if (formatType === 'fontSize') {
             const currentSize = currentStyle.fontSize || 13;
             const newSize = value === '+' ? Math.min(36, currentSize + 1) : Math.max(8, currentSize - 1);
             updatedRow._cellStyles[colKey] = { ...currentStyle, fontSize: newSize };
             changed = true;
          } else if (currentStyle[formatType] !== value) {
            updatedRow._cellStyles[colKey] = { ...currentStyle, [formatType]: value };
            changed = true;
          } else if (formatType === 'bold' || formatType === 'italic' || formatType === 'underline') {
             // Toggle behavior for booleans if value is same (it won't be same due to currentStyle check, but handle toggle logic)
             updatedRow._cellStyles[colKey] = { ...currentStyle, [formatType]: !currentStyle[formatType] };
             changed = true;
          }
        }
        return changed ? updatedRow : row;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const addRow = () => {
    pushUndo();
    setSearchTerm('');
    setData([...data, getEmptyRow(nextIdNum)]);
    setNextIdNum(prev => prev + 1);
    setHasUnsaved(true);
    const newRowIdx = data.length;
    const cell = { row: newRowIdx, col: 0 };
    setSelectedCell(cell);
    setRangeStart(cell);
    setRangeEnd(cell);
    setTimeout(() => {
      if (tableRef.current) tableRef.current.parentElement.scrollTop = tableRef.current.parentElement.scrollHeight;
    }, 50);
  };

  const addColumn = () => {
    pushUndo();
    const newColIdx = customColumns.length;
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    const letter = getLetter(newColIdx);
    const newKey = `customCol_${Date.now()}`;
    const newCol = { key: newKey, label: 'New Column', letter: letter, width: 120, type: 'text' };
    
    setCustomColumns(prev => [...prev, newCol]);
    setColWidths(prev => ({ ...prev, [newKey]: 120 }));
    setHasUnsaved(true);
    
    // Automatically focus the new header for renaming
    setTimeout(() => {
      setEditingHeader(newColIdx);
      if (tableRef.current) tableRef.current.parentElement.scrollLeft = tableRef.current.parentElement.scrollWidth;
    }, 50);
  };

  const deleteColumn = () => {
    if (!selectedCell && !rangeStart) {
      alert('Please select a cell or range in the column(s) you want to delete.');
      return;
    }
    
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    const colIndices = [];
    const colLabels = [];
    const keysToDelete = [];
    for (let i = c1; i <= c2; i++) {
      if (customColumns[i]) {
        colIndices.push(i);
        colLabels.push(customColumns[i].label || customColumns[i].letter);
        keysToDelete.push(customColumns[i].key);
      }
    }

    if (colIndices.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete the column(s): ${colLabels.join(', ')} and all their data? This action can be undone.`)) {
      return;
    }

    pushUndo();

    // 1. Remove from customColumns
    const newColumns = customColumns.filter((_, idx) => !colIndices.includes(idx));
    
    // Recalculate letters for remaining columns
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));

    setCustomColumns(updatedColumns);

    // 2. Remove from row data properties
    setData(prev => prev.map(row => {
      const updatedRow = { ...row };
      keysToDelete.forEach(key => {
        delete updatedRow[key];
        if (updatedRow._cellStyles) {
          updatedRow._cellStyles = { ...updatedRow._cellStyles };
          delete updatedRow._cellStyles[key];
        }
      });
      return updatedRow;
    }));

    // Reset selection to safe cell
    setSelectedCell(prev => prev ? { row: prev.row, col: Math.max(0, c1 - 1) } : null);
    setRangeStart(null);
    setRangeEnd(null);
    setHasUnsaved(true);
    showToast(`Deleted ${colIndices.length} column(s).`);
  };

  function moveColumn(direction, skipPushUndo = false) {
    if (!selectedCell) {
      alert('Please select a cell in the column you want to move.');
      return;
    }
    const colIdx = selectedCell.col;
    if (direction === 'left' && colIdx === 0) return;
    if (direction === 'right' && colIdx === customColumns.length - 1) return;

    if (!skipPushUndo) pushUndo();

    const newColumns = [...customColumns];
    const targetIdx = direction === 'left' ? colIdx - 1 : colIdx + 1;
    
    // Swap columns
    const temp = newColumns[colIdx];
    newColumns[colIdx] = newColumns[targetIdx];
    newColumns[targetIdx] = temp;

    // Recalculate letters for columns
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));

    setCustomColumns(updatedColumns);
    saveSheetMeta(`${storageKey}_columns`, updatedColumns).catch(err => console.error(err));

    // Update selected cell location
    const newCell = { ...selectedCell, col: targetIdx };
    setSelectedCell(newCell);
    setRangeStart(newCell);
    setRangeEnd(newCell);
    setHasUnsaved(true);
    showToast(`Column moved ${direction}.`);
  };

  const handleDropColumn = (sourceIdx, targetIdx) => {
    if (sourceIdx === targetIdx || isNaN(sourceIdx)) return;
    
    pushUndo();
    
    const newColumns = [...customColumns];
    const [draggedCol] = newColumns.splice(sourceIdx, 1);
    newColumns.splice(targetIdx, 0, draggedCol);
    
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));
    
    setCustomColumns(updatedColumns);
    saveSheetMeta(`${storageKey}_columns`, updatedColumns).catch(err => console.error(err));
    
    setSelectedCell(prev => prev ? { ...prev, col: targetIdx } : null);
    setRangeStart(null);
    setRangeEnd(null);
    setHasUnsaved(true);
    showToast(`Column moved successfully.`);
  };

  const deleteSelected = () => {
    if (!selectedCell && !rangeStart) return;
    
    if (selectionType === 'column') {
      let c1 = selectedCell.col;
      let c2 = selectedCell.col;
      if (rangeStart && rangeEnd) {
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      
      const colLabels = [];
      for (let i = c1; i <= c2; i++) {
        colLabels.push(customColumns[i].label);
      }
      
      if (!window.confirm(`Clear all values in column(s): ${colLabels.join(', ')}?`)) return;
      
      pushUndo();
      setData(prev => prev.map(row => {
        const updatedRow = { ...row };
        for (let i = c1; i <= c2; i++) {
          updatedRow[customColumns[i].key] = '';
        }
        return updatedRow;
      }));
      setHasUnsaved(true);
      showToast('Column(s) cleared successfully!');
      return;
    }

    let rowsToDelete = new Set();
    if (rangeStart && rangeEnd) {
       const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
       const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
       const minF = Math.min(startFIdx, endFIdx);
       const maxF = Math.max(startFIdx, endFIdx);
       for(let i=minF; i<=maxF; i++) {
          if (i !== -1) {
             rowsToDelete.add(data.indexOf(filteredData[i]));
          }
       }
    } else {
       rowsToDelete.add(selectedCell.row);
    }
    
    rowsToDelete.delete(-1);
    if (rowsToDelete.size === 0) return;
    
    if (!window.confirm(`Delete ${rowsToDelete.size} row(s)?`)) return;
    
    pushUndo();
    const newData = data.filter((_, idx) => !rowsToDelete.has(idx));
    setData(newData);
    setSelectedCell(null);
    setRangeStart(null);
    setRangeEnd(null);
    setEditingCell(null);
    setHasUnsaved(true);
  };

  const [fileHandle, setFileHandle] = useState(null);
  const fileInputRef = useRef(null);

  const handleSerialize = () => {
    if (!rangeStart || !rangeEnd) {
      showToast('Please select a range of cells vertically to serialize first.');
      return;
    }
    
    let r1 = Math.min(rangeStart.row, rangeEnd.row);
    let r2 = Math.max(rangeStart.row, rangeEnd.row);
    let c1 = Math.min(rangeStart.col, rangeEnd.col);
    let c2 = Math.max(rangeStart.col, rangeEnd.col);
    
    if (r1 === r2) {
      showToast('Please select at least two cells vertically to serialize.');
      return;
    }

    pushUndo();
    
    const incrementValue = (val, step) => {
      if (val === null || val === undefined || val === '') return step;
      const numMatch = String(val).match(/^(.*?)(\d+)$/);
      if (numMatch && isNaN(val)) {
        const prefix = numMatch[1];
        const numStr = numMatch[2];
        const nextNum = parseInt(numStr) + step;
        return prefix + String(nextNum).padStart(numStr.length, '0');
      }
      if (!isNaN(val) && val !== '') {
        return Number(val) + step;
      }
      const dateReg = /^\d{4}-\d{2}-\d{2}$/;
      if (dateReg.test(val)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + step);
          return d.toISOString().split('T')[0];
        }
      }
      return val;
    };

    setData(prev => {
      const newData = [...prev];
      for (let c = c1; c <= c2; c++) {
        const colKey = customColumns[c].key;
        let sourceVal = newData[r1][colKey];
        if (sourceVal === null || sourceVal === undefined || sourceVal === '') {
          sourceVal = '1';
          newData[r1] = { ...newData[r1], [colKey]: '1' };
        }
        const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
        let step = 1;
        for (let r = r1 + 1; r <= r2; r++) {
          newData[r] = { ...newData[r], [colKey]: incrementValue(sourceVal, step++) };
          if (sourceStyle) {
            if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
            newData[r]._cellStyles[colKey] = { ...sourceStyle };
          }
          if (computeRow) {
            try {
              newData[r] = computeRow(newData[r]);
            } catch (e) {
              console.error("Error computing row on serialize", e);
            }
          }
        }
      }
      return newData;
    });
    setHasUnsaved(true);
    showToast('Serialization complete!');
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      import('xlsx').then((XLSX) => {
        try {
          const dataBytes = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(dataBytes, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (json.length < 2) {
            showToast('Import failed: File is empty or lacks headers.');
            return;
          }

          const rawHeaders = json[0];
          const headersLower = rawHeaders.map(h => String(h || '').trim().toLowerCase());
          const rows = json.slice(1);

          // Calculate initial "best guess" mapping
          const initialMapping = {};
          customColumns.forEach(col => {
            const label = col.label.trim().toLowerCase();
            const idx = headersLower.indexOf(label);
            if (idx !== -1) {
              initialMapping[col.key] = idx;
            } else {
              const letterIdx = headersLower.indexOf(col.letter.trim().toLowerCase());
              if (letterIdx !== -1) {
                initialMapping[col.key] = letterIdx;
              }
            }
          });

          // Open the mapping modal instead of importing directly
          setImportModalData({ headers: rawHeaders, rows: rows, fileName: file.name });
          setImportMapping(initialMapping);

        } catch (err) {
          console.error(err);
          showToast('Import failed: Invalid file format or parsing error.');
        }
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const executeImport = (mode) => {
    if (!importModalData) return;

    try {
      const parsedData = importModalData.rows.map(rowArr => {
        const newRow = {};
        customColumns.forEach(col => {
          const fileColIdx = importMapping[col.key];
          let val = (fileColIdx !== undefined && fileColIdx !== '') ? rowArr[fileColIdx] : undefined;
          
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0];
          } else if (typeof val === 'string') {
            val = val.trim();
          }
          newRow[col.key] = (val === undefined || val === null) ? '' : val;
        });
        return newRow;
      });

      let nextId = nextIdNum;
      const idCol = customColumns.find(c => c.key.toLowerCase() === 'id' || c.key.toLowerCase().includes('id'));
      const updatedParsedData = parsedData.map(row => {
        let updatedRow = { ...row };
        if (idCol && (!updatedRow[idCol.key] || String(updatedRow[idCol.key]).trim() === '')) {
          updatedRow[idCol.key] = `${idPrefix}${String(nextId++).padStart(3, '0')}`;
        }
        if (computeRow) {
          try {
            updatedRow = computeRow(updatedRow);
          } catch (e) {
            console.error("Error computing row on import", e);
          }
        }
        return updatedRow;
      });

      pushUndo();
      if (mode === 'append') {
        setData(prev => {
          const cleanPrev = getCleanGridData(prev, customColumns);
          const combined = [...cleanPrev, ...updatedParsedData];
          const padded = [...combined];
          while (padded.length < 20) {
            const emptyRow = {};
            customColumns.forEach(c => emptyRow[c.key] = '');
            padded.push(emptyRow);
          }
          return padded;
        });
      } else if (mode === 'replace') {
        const proceedReplace = window.confirm("Are you sure you want to delete all existing rows and replace them with the imported data?");
        if (!proceedReplace) return;
        const padded = [...updatedParsedData];
        while (padded.length < 20) {
          const emptyRow = {};
          customColumns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }
        setData(padded);
      } else if (mode === 'new_sheet') {
        const newTabId = `tab_${Date.now()}`;
        let newTabName = `Sheet${tabs.length + 1}`;
        if (importModalData.fileName) {
          const baseName = importModalData.fileName.replace(/\.[^/.]+$/, "");
          newTabName = baseName.substring(0, 20); 
        }
        const tabStorageKey = `${storageKey}_tab_${newTabId}`;
        const newTab = { id: newTabId, name: newTabName, storageKey: tabStorageKey };
        const newTabs = [...tabs, newTab];
        setTabs(newTabs);
        saveTabsIndex(newTabs);
        
        const padded = [...updatedParsedData];
        while (padded.length < 20) {
          const emptyRow = {};
          customColumns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }
        
        saveSheetData(tabStorageKey, getCleanGridData(padded, customColumns));
        saveSheetMeta(`${tabStorageKey}_nextid`, nextId);
        
        setActiveTabId(newTabId);
        setData(padded);
      }
      
      setNextIdNum(nextId);
      setHasUnsaved(true);
      setImportModalData(null);
      setImportMapping({});
      showToast(`Successfully imported ${updatedParsedData.length} row(s)!`);
    } catch (err) {
      console.error(err);
      showToast('Import processing failed.');
    }
  };

  const handleResetSheet = async () => {
    const confirmMessage = `Are you sure you want to reset this sheet ("${title}")? \n\nThis will permanently delete all records on this tab. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const baseData = initialData || [];
      const padded = [...baseData];
      while (padded.length < 20) {
        const emptyRow = {};
        columns.forEach(c => emptyRow[c.key] = '');
        padded.push(emptyRow);
      }
      
      // Save empty/initial state to IndexedDB
      await saveSheetData(activeStorageKey, getCleanGridData(padded, customColumns));
      await saveSheetMeta(`${activeStorageKey}_nextid`, 1);
      
      // Clear localStorage cache/fallback to ensure dashboard and other components sync correctly
      localStorage.removeItem(activeStorageKey);
      localStorage.removeItem(`${activeStorageKey}_nextid`);
      
      // Reset component state
      setData(padded);
      setNextIdNum(1);
      setHasUnsaved(false);
      setUndoStack([]);
      setRedoStack([]);
      setHighlightUndoStack([]);
      setHighlightRedoStack([]);
      
      showToast("Sheet data reset successfully.");
    } catch (err) {
      console.error("Failed to reset sheet:", err);
      showToast("Failed to reset sheet.", "error");
    }
  };

  async function saveData() {
    // 1. Save to localStorage instantly
    await saveSheetData(activeStorageKey, getCleanGridData(data, customColumns));
    await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum);
    await saveSheetMeta(`${storageKey}_columns`, customColumns);
    setHasUnsaved(false);

    // 2. Trigger native Excel Save
    setIsExporting(true);
    try {
      const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
      if (window.showSaveFilePicker && !isElectron) {
        // If we don't have a file handle yet, ask the user where to save
        let currentHandle = fileHandle;
        if (!currentHandle) {
           const today = new Date().toISOString().split('T')[0];
           const opts = {
             suggestedName: `${title.replace(/\s+/g, '_')}_${today}.xlsx`,
             types: [{
               description: 'Excel Workbook',
               accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']},
             }],
           };
           currentHandle = await window.showSaveFilePicker(opts);
           setFileHandle(currentHandle);
        }
        
        // Write the data natively using the retained handle
        import('xlsx').then(async (XLSX) => {
          const formattedData = filteredData.map(item => {
            const rowObj = {};
            customColumns.forEach(col => { rowObj[col.label] = item[col.key] || ''; });
            return rowObj;
          });
          const worksheet = XLSX.utils.json_to_sheet(formattedData);
          const colWidthsList = customColumns.map(col => {
            const headerLen = col.label.length;
            const maxContentLen = formattedData.reduce((max, row) => Math.max(max, row[col.label] ? row[col.label].toString().length : 0), headerLen);
            return { wch: maxContentLen + 2 }; 
          });
          worksheet['!cols'] = colWidthsList;
          worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
          
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          
          const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const writable = await currentHandle.createWritable();
          await writable.write(buffer);
          await writable.close();
          showToast('Saved to Excel successfully!');
          setIsExporting(false);
        });
      } else {
        const { exportToExcel } = await import('../../utils/exportUtils');
        await exportToExcel(filteredData, customColumns, title);
        showToast('Exported to Excel successfully!');
        setIsExporting(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
         showToast('Failed to save to Excel.');
      }
      setIsExporting(false);
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const { exportToExcel } = await import('../../utils/exportUtils');
        await exportToExcel(filteredData, customColumns, title, true);
        showToast('Exported successfully!');
      } catch (err) {
        showToast('Failed to export to Excel.');
      }
      setIsExporting(false);
    }, 300);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    let bg = '#f1f5f9', color = '#475569', icon = '';
    
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('good') || s.includes('complete') || s === 'open' || s.includes('fit') || s.includes('recovered')) { bg = '#dcfce7'; color = '#166534'; icon = '🟢'; }
    if (s.includes('critical') || s.includes('unfit') || s.includes('replace') || s.includes('overdue') || s.includes('chronic') || s.includes('severe')) { bg = '#fee2e2'; color = '#991b1b'; icon = '🔴'; }
    if (s.includes('follow-up') || s.includes('fair') || s.includes('pending') || s.includes('review') || s.includes('mild')) { bg = '#fef9c3'; color = '#854d0e'; icon = '🟡'; }
    if (s.includes('discharged') || s === 'closed' || s.includes('suspended')) { bg = '#f1f5f9'; color = '#475569'; icon = '⚪'; }

    return <span style={{ background: bg, color: color, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{icon} {status}</span>;
  };

  const formatDateDisplay = (val) => {
    if (!val) return '';
    const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return val;
  };

  // Calculate cumulative heights of all filtered rows for virtualization
  const { visibleRows, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (isPrinting) {
      return {
        visibleRows: filteredData,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0
      };
    }

    const offsets = [0];
    let current = 0;
    for (let i = 0; i < filteredData.length; i++) {
      const originalIdx = rowToIndexMap.get(filteredData[i]);
      const height = rowHeights[originalIdx] || 30;
      current += height;
      offsets.push(current);
    }
    const totalHeight = current;

    const bufferHeight = 150; // extra rows buffer
    const viewportTop = Math.max(0, scrollTop - bufferHeight);
    const viewportBottom = scrollTop + containerHeight + bufferHeight;

    let startIndex = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] > viewportTop) {
        startIndex = Math.max(0, i - 1);
        break;
      }
    }

    let endIndex = filteredData.length;
    for (let i = startIndex; i < offsets.length; i++) {
      if (offsets[i] > viewportBottom) {
        endIndex = Math.min(filteredData.length, i);
        break;
      }
    }

    const topSpacer = offsets[startIndex] || 0;
    const bottomSpacer = Math.max(0, totalHeight - offsets[endIndex]);
    const sliced = filteredData.slice(startIndex, endIndex);

    return {
      visibleRows: sliced,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer
    };
  }, [filteredData, rowToIndexMap, rowHeights, scrollTop, containerHeight, isPrinting]);

  return (
    <div className="print-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {!disableTabs && (
        <div className="print-hide" style={{
          display: 'flex', alignItems: 'flex-end', gap: '0',
          background: '#e2e8f0', paddingLeft: '8px', paddingTop: '6px',
          overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #cbd5e1'
        }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => { setActiveTabId(tab.id); setEditingTabId(null); }}
              onDoubleClick={() => { if (!disableRenameTabs || tab.id !== 'default') { setEditingTabId(tab.id); setEditingTabName(tab.name); } }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', cursor: 'pointer',
                background: activeTabId === tab.id ? 'white' : '#f1f5f9',
                borderTop: activeTabId === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1',
                fontWeight: activeTabId === tab.id ? 700 : 500,
                color: activeTabId === tab.id ? '#1e293b' : '#64748b',
                fontSize: '13px', whiteSpace: 'nowrap',
                borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
                marginRight: '-1px', position: 'relative'
              }}
            >
              {editingTabId === tab.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editingTabName}
                    onChange={e => setEditingTabName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameTab(tab.id); if (e.key === 'Escape') setEditingTabId(null); }}
                    style={{ padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '12px', width: '100px', outline: 'none' }}
                  />
                  <button
                    onClick={() => handleRenameTab(tab.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  </button>
                  <button
                    onClick={() => setEditingTabId(null)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>✗</span>
                  </button>
                </div>
              ) : (
                <>
                  <FileSpreadsheet size={14} />
                  {tab.name}
                  
                  {/* Edit/Rename icon */}
                  {(!disableRenameTabs || tab.id !== 'default') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); setEditingTabName(tab.name); }}
                      style={{
                        background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: '4px', color: '#94a3b8', transition: 'color 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
                      onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Rename sheet"
                    >
                      <Edit size={12} />
                    </button>
                  )}

                  {tabs.length > 1 && tab.id !== 'default' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id); }}
                      style={{
                        background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: '2px', color: '#94a3b8', fontSize: '12px', lineHeight: 1
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Delete sheet"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          <div
            onClick={handleCreateTab}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 14px', cursor: 'pointer', color: '#64748b',
              fontSize: '18px', fontWeight: 700, borderRadius: '8px 8px 0 0',
              transition: 'all 0.15s', marginLeft: '4px', background: '#f1f5f9',
              alignSelf: 'stretch'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            title="Add new empty sheet"
          >
            +
          </div>

          <div
            onClick={triggerImport}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 14px', cursor: 'pointer', color: '#10b981',
              fontSize: '14px', fontWeight: 700, borderRadius: '8px 8px 0 0',
              transition: 'all 0.15s', marginLeft: '2px', background: '#f1f5f9',
              alignSelf: 'stretch', gap: '4px'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.color = '#059669'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#10b981'; }}
            title="Import Excel file as a new sheet"
          >
            <FileSpreadsheet size={16} /> +
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#059669', color: 'white',
          padding: '12px 20px', borderRadius: '8px', fontWeight: 500, zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>✅ {toast}</div>
      )}

      <div className="print-hide" style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem', marginRight: '16px' }}>{title}</div>
        <div style={{ width: '250px', minWidth: '150px', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
          />
        </div>

        {filters.length > 0 && filters.map(f => (
          <select 
            key={f.key}
            value={activeFilters[f.key] || ''}
            onChange={e => setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', background: 'white', color: '#475569', fontWeight: 500 }}
          >
            <option value="">{f.label}</option>
            {f.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={handleUndo} disabled={undoStack.length === 0} style={{ background: 'transparent', border: 'none', cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: undoStack.length === 0 ? 0.5 : 1, padding: '4px' }} title="Undo (Ctrl+Z)">
            <Undo2 size={16} color="#475569" />
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ background: 'transparent', border: 'none', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: redoStack.length === 0 ? 0.5 : 1, padding: '4px' }} title="Redo (Ctrl+Y)">
            <Redo2 size={16} color="#475569" />
          </button>
        </div>

        <button onClick={addRow} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Add Row</button>
        <button onClick={addColumn} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Add Column</button>
        <button onClick={deleteSelected} style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Delete Selected Row(s)">Delete Row</button>
        <button onClick={deleteColumn} style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Delete Selected Column(s) entirely from the spreadsheet">Delete Column</button>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }} title="Shift Selected Column">
          <button 
            onClick={() => moveColumn('left')} 
            disabled={!selectedCell || selectedCell.col === 0} 
            style={{ 
              background: 'transparent', border: 'none', 
              cursor: (!selectedCell || selectedCell.col === 0) ? 'not-allowed' : 'pointer', 
              opacity: (!selectedCell || selectedCell.col === 0) ? 0.5 : 1, 
              padding: '4px', display: 'flex', alignItems: 'center' 
            }} 
            title="Move Column Left"
          >
            <ArrowLeft size={16} color="#475569" />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', padding: '0 2px' }}>Shift Col</span>
          <button 
            onClick={() => moveColumn('right')} 
            disabled={!selectedCell || selectedCell.col === customColumns.length - 1} 
            style={{ 
              background: 'transparent', border: 'none', 
              cursor: (!selectedCell || selectedCell.col === customColumns.length - 1) ? 'not-allowed' : 'pointer', 
              opacity: (!selectedCell || selectedCell.col === customColumns.length - 1) ? 0.5 : 1, 
              padding: '4px', display: 'flex', alignItems: 'center' 
            }} 
            title="Move Column Right"
          >
            <ArrowRight size={16} color="#475569" />
          </button>
        </div>
        <button onClick={handleSerialize} style={{ padding: '8px 16px', background: 'white', color: '#16a34a', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Fill Series Down">Serialize</button>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={() => setShowTotals(!showTotals)} style={{ padding: '4px 8px', background: showTotals ? '#2563eb' : 'transparent', color: showTotals ? 'white' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }} title="Toggle Grand Totals Row">
            <Sigma size={16} /> Totals
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAnalysisMenu(!showAnalysisMenu)} style={{ padding: '4px 8px', background: 'transparent', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }} title="Data Analysis Tools">
              <Calculator size={16} /> Analyze
            </button>
            {showAnalysisMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '4px 0', zIndex: 50, minWidth: '200px' }}>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Insert Calculation Column</div>
                <div onClick={() => handleAnalyze('running_total')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📈 Running Total</div>
                <div onClick={() => handleAnalyze('rank')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔢 Rank Column</div>
                <div onClick={() => handleAnalyze('percent_total')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📊 % of Total</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Conditional Functions</div>
                <div onClick={() => handleAnalyze('countif')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔍 COUNTIF</div>
                <div onClick={() => handleAnalyze('sumif')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➕ SUMIF</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Math Operations</div>
                <div onClick={() => handleAnalyze('math_multiply')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>✖️ Multiply by Column</div>
                <div onClick={() => handleAnalyze('math_add')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➕ Add Column</div>
                <div onClick={() => handleAnalyze('math_subtract')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➖ Subtract Column</div>
                <div onClick={() => handleAnalyze('math_divide')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➗ Divide by Column</div>
                <div onClick={() => handleAnalyze('math_constant')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔢 Multiply by Constant</div>
                <div onClick={() => handleAnalyze('quick_stats')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📌 Quick Stats (Min/Max/Avg/Sum)</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Formatting & Cleanup</div>
                <div onClick={() => handleAnalyze('top3')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#166534' }} onMouseOver={e => e.currentTarget.style.background = '#dcfce7'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🟢 Highlight Top 3</div>
                <div onClick={() => handleAnalyze('bottom3')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#991b1b' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔴 Highlight Bottom 3</div>
                <div onClick={() => handleAnalyze('dedup')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🧹 Remove Duplicates</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }} title="Zoom Out">
            <ZoomOut size={16} color="#475569" />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }} title="Zoom In">
            <ZoomIn size={16} color="#475569" />
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          {/* Text Style */}
          <button onClick={() => applyFormat('bold', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Bold (Ctrl+B)">
            <Bold size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('italic', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Italic (Ctrl+I)">
            <Italic size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('underline', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Underline (Ctrl+U)">
            <Underline size={16} color="#475569" />
          </button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Font Size */}
          <button onClick={() => applyFormat('fontSize', '-')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Decrease Font Size">
            <Type size={14} color="#475569" /><Minus size={10} color="#475569" />
          </button>
          <button onClick={() => applyFormat('fontSize', '+')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Increase Font Size">
            <Type size={18} color="#475569" /><Plus size={10} color="#475569" />
          </button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Alignment */}
          <button onClick={() => applyFormat('textAlign', 'left')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Left">
            <AlignLeft size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('textAlign', 'center')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Center">
            <AlignCenter size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('textAlign', 'right')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Right">
            <AlignRight size={16} color="#475569" />
          </button>

          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Colors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PaintBucket size={16} color="#475569" title="Background Color" />
            <button onClick={() => { applyColor('#fef08a'); setActiveColor('#fef08a'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#fef08a', border:'1px solid #eab308', cursor:'pointer'}} title="Highlight Yellow"></button>
            <button onClick={() => { applyColor('#dcfce7'); setActiveColor('#dcfce7'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#dcfce7', border:'1px solid #22c55e', cursor:'pointer'}} title="Highlight Green"></button>
            <button onClick={() => { applyColor('#fee2e2'); setActiveColor('#fee2e2'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#fee2e2', border:'1px solid #ef4444', cursor:'pointer'}} title="Highlight Red"></button>
            <button onClick={() => { applyColor('#dbeafe'); setActiveColor('#dbeafe'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#dbeafe', border:'1px solid #3b82f6', cursor:'pointer'}} title="Highlight Blue"></button>
            <button onClick={() => { applyColor('#ffedd5'); setActiveColor('#ffedd5'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#ffedd5', border:'1px solid #f97316', cursor:'pointer'}} title="Highlight Orange"></button>
            <button onClick={() => { applyColor(''); setActiveColor(''); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'white', border:'1px solid #cbd5e1', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}} title="Clear Highlight">🚫</button>
            <button 
              onClick={() => setIsEraserMode(!isEraserMode)} 
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: isEraserMode ? '#3b82f6' : 'white',
                color: isEraserMode ? 'white' : '#475569',
                cursor: 'pointer'
              }}
              title="Toggle Interactive Highlighter Eraser Mode (Click & drag to erase highlights)"
            >
              <Eraser size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 2px' }}></div>
            <button 
              onClick={handleHighlightUndo} 
              disabled={highlightUndoStack.length === 0} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: 'white',
                color: '#475569',
                cursor: highlightUndoStack.length === 0 ? 'not-allowed' : 'pointer',
                opacity: highlightUndoStack.length === 0 ? 0.5 : 1
              }} 
              title="Undo Highlight Only"
            >
              <Undo2 size={12} color="#dc2626" />
            </button>
            <button 
              onClick={handleHighlightRedo} 
              disabled={highlightRedoStack.length === 0} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: 'white',
                color: '#475569',
                cursor: highlightRedoStack.length === 0 ? 'not-allowed' : 'pointer',
                opacity: highlightRedoStack.length === 0 ? 0.5 : 1
              }} 
              title="Redo Highlight Only"
            >
              <Redo2 size={12} color="#16a34a" />
            </button>
          </div>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          <button onClick={() => highlightEntireRow(activeColor)} style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#475569' }} title="Highlight Selected Cell's Entire Row">Highlight Row</button>
          <button onClick={() => highlightEntireCol(activeColor)} style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#475569' }} title="Highlight Selected Cell's Entire Column">Highlight Col</button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <input type="color" onChange={(e) => applyFormat('color', e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Text Color" />
            </div>
          </div>
        </div>

        <button 
          onClick={triggerImport} 
          style={{ padding: '8px 16px', background: 'white', color: '#2563eb', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          📥 Import Excel/CSV
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImport} 
          style={{ display: 'none' }} 
          accept=".xlsx, .xls, .csv" 
        />
        <button 
          onClick={exportExcel} 
          disabled={isExporting}
          style={{ padding: '8px 16px', background: isExporting ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isExporting ? 'not-allowed' : 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileSpreadsheet size={16} /> 
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Settings size={14} color="#64748b" />
            <select 
              value={printLayout} 
              onChange={(e) => setPrintLayout(e.target.value)}
              style={{ padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '13px' }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <select 
              value={printScale} 
              onChange={(e) => setPrintScale(parseFloat(e.target.value))}
              style={{ padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '13px' }}
            >
              <option value={0.5}>50%</option>
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
              <option value={0.9}>90%</option>
              <option value={1}>100%</option>
            </select>
          </div>
        <button 
          onClick={exportToPDF} 
          style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Export as PDF"
        >
          📄 PDF
        </button>
        <button 
          onClick={() => {
            setIsPrinting(true);
            setTimeout(() => {
              try {
                if (window.electron && typeof window.electron.printCommand === 'function') {
                  window.electron.printCommand({ landscape: printLayout === 'landscape' });
                } else {
                  window.print();
                }
              } catch (err) {
                console.error(err);
                window.print();
              }
              setTimeout(() => setIsPrinting(false), 1000);
            }, 300);
          }} 
          style={{ padding: '8px 16px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={16} /> Print
        </button>
        <button 
          onClick={() => {
            setIsPrinting(true);
            setTimeout(() => {
              try {
                if (window.electron && typeof window.electron.previewPrint === 'function') {
                  window.electron.previewPrint({ landscape: printLayout === 'landscape' });
                } else {
                  window.print();
                }
              } catch (err) {
                console.error(err);
                window.print();
              }
              setTimeout(() => setIsPrinting(false), 1000);
            }, 300);
          }} 
          style={{ padding: '8px 16px', background: 'white', color: '#1e40af', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Print Preview"
        >
          <Eye size={16} /> Print Preview
        </button>
        <button 
          onClick={handleResetSheet} 
          disabled={isExporting}
          style={{ 
            padding: '8px 16px', 
            background: 'white', 
            color: '#dc2626', 
            border: '1px solid #fca5a5', 
            borderRadius: '6px', 
            cursor: isExporting ? 'not-allowed' : 'pointer', 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.border = '1px solid #ef4444';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.border = '1px solid #fca5a5';
            }
          }}
          title="Reset sheet to default template"
        >
          <RotateCcw size={16} /> Reset Sheet
        </button>
        <button 
          onClick={saveData} 
          disabled={isExporting}
          style={{ padding: '8px 16px', background: (isExporting || !hasUnsaved) ? '#059669' : '#047857', color: 'white', border: 'none', borderRadius: '6px', cursor: isExporting ? 'not-allowed' : 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          💾 {isExporting ? 'Saving...' : `Save ${hasUnsaved ? '*' : ''}`}
        </button>
        {toolbarRight && toolbarRight}
      </div>

      <div ref={gridContainerRef} tabIndex={-1} className="print-wrapper" style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', position: 'relative', outline: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4 ${printLayout}; margin: 10mm; }
            .print-wrapper table {
              zoom: ${printScale};
            }
          }
        `}} />
        {isLoading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, gap: '16px'
          }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb', borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>Loading spreadsheet records...</div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        <table ref={tableRef} style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', fontSize: '13px', fontFamily: 'Calibri, Arial, sans-serif', background: 'white', zoom: zoomLevel }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
            {(() => {
              const hasSuperGroups = customColumns.some(c => c.superGroup);
              if (!hasSuperGroups) return null;
              
              const sGroups = [];
              let currentSGroup = customColumns[0]?.superGroup;
              let colspan = 0;
              customColumns.forEach((col) => {
                if (col.superGroup === currentSGroup) {
                  colspan++;
                } else {
                  sGroups.push({ title: currentSGroup, colspan });
                  currentSGroup = col.superGroup;
                  colspan = 1;
                }
              });
              if (colspan > 0) sGroups.push({ title: currentSGroup, colspan });

              return (
                <tr>
                  <th style={{ background: '#94a3b8', border: '1px solid #64748b', position: 'sticky', left: 0, zIndex: 12 }}></th>
                  {sGroups.map((g, i) => {
                    const isEditing = editingSuperGroup === `${i}-${g.title}`;
                    return (
                      <th 
                        key={i} 
                        colSpan={g.colspan} 
                        onClick={() => setEditingSuperGroup(`${i}-${g.title}`)}
                        title="Click to rename"
                        style={{ background: '#cbd5e1', color: '#0f172a', border: '1px solid #94a3b8', padding: isEditing ? 0 : '10px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', position: 'relative' }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={g.title}
                            autoFocus
                            onBlur={(e) => {
                              const newTitle = e.target.value.trim();
                              if (newTitle && newTitle !== g.title) {
                                setCustomColumns(prev => {
                                  const newCols = prev.map(c => c.superGroup === g.title ? { ...c, superGroup: newTitle } : c);
                                  saveSheetMeta(`${storageKey}_columns`, newCols);
                                  return newCols;
                                });
                              }
                              setEditingSuperGroup(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingSuperGroup(null);
                            }}
                            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', textAlign: 'center', font: 'inherit', textTransform: 'uppercase' }}
                          />
                        ) : (
                          g.title || ''
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })()}
            {(() => {
              const hasGroups = customColumns.some(c => c.group);
              if (!hasGroups) return null;
              
              const groups = [];
              let currentGroup = customColumns[0]?.group;
              let colspan = 0;
              customColumns.forEach((col) => {
                if (col.group === currentGroup) {
                  colspan++;
                } else {
                  groups.push({ title: currentGroup, colspan });
                  currentGroup = col.group;
                  colspan = 1;
                }
              });
              if (colspan > 0) groups.push({ title: currentGroup, colspan });

              return (
                <tr>
                  <th style={{ background: '#cbd5e1', border: '1px solid #94a3b8', position: 'sticky', left: 0, zIndex: 12 }}></th>
                  {groups.map((g, i) => {
                    const isEditing = editingGroup === `${i}-${g.title}`;
                    return (
                      <th 
                        key={i} 
                        colSpan={g.colspan} 
                        onClick={() => setEditingGroup(`${i}-${g.title}`)}
                        title="Click to rename"
                        style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1', padding: isEditing ? 0 : '8px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', position: 'relative' }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={g.title}
                            autoFocus
                            onBlur={(e) => {
                              const newTitle = e.target.value.trim();
                              if (newTitle && newTitle !== g.title) {
                                setCustomColumns(prev => {
                                  const newCols = prev.map(c => c.group === g.title ? { ...c, group: newTitle } : c);
                                  saveSheetMeta(`${storageKey}_columns`, newCols);
                                  return newCols;
                                });
                              }
                              setEditingGroup(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingGroup(null);
                            }}
                            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', textAlign: 'center', font: 'inherit', textTransform: 'uppercase' }}
                          />
                        ) : (
                          g.title || ''
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })()}
            <tr>
              <th 
                onClick={selectAll}
                style={{ background: '#e2e8f0', color: '#64748b', width: '45px', border: '1px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 12, cursor: 'pointer' }}
                title="Select All"
              >
                #
              </th>
              {customColumns.map((col, colIdx) => {
                const isEditingHeader = editingHeader === colIdx;
                const width = colWidths[col.key] || 120;
                
                return (
                  <th 
                    key={col.key} 
                    draggable={!isEditingHeader}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", colIdx);
                      setDraggingColIdx(colIdx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceIdx = parseInt(e.dataTransfer.getData("text/plain"));
                      handleDropColumn(sourceIdx, colIdx);
                      setDraggingColIdx(null);
                    }}
                    onDragEnd={() => setDraggingColIdx(null)}
                    style={{ 
                      background: draggingColIdx === colIdx ? '#e2e8f0' : '#f8fafc', 
                      opacity: draggingColIdx === colIdx ? 0.5 : 1,
                      color: '#334155', border: '1px solid #cbd5e1', 
                      padding: isEditingHeader ? 0 : '6px 12px', textAlign: 'left', fontWeight: 600, 
                      cursor: isEditingHeader ? 'text' : 'grab', position: 'relative', width: `${width}px`, minWidth: `${width}px`
                    }}
                    title={isEditingHeader ? "" : `Drag header to move column. Double click to rename.`}
                  >
                    {isEditingHeader ? (
                      <input
                        type="text"
                        defaultValue={col.label}
                        autoFocus
                        onBlur={(e) => {
                          const newLabel = e.target.value.trim();
                          if (newLabel) {
                            setCustomColumns(prev => {
                              const newCols = prev.map((c, idx) => idx === colIdx ? { ...c, label: newLabel } : c);
                              saveSheetMeta(`${storageKey}_columns`, newCols);
                              return newCols;
                            });
                          }
                          setEditingHeader(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newLabel = e.target.value.trim();
                            if (newLabel) {
                              setCustomColumns(prev => prev.map((c, idx) => idx === colIdx ? { ...c, label: newLabel } : c));
                            }
                            setEditingHeader(null);
                          } else if (e.key === 'Escape') {
                            setEditingHeader(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', padding: '6px 12px', font: 'inherit' }}
                      />
                    ) : (
                      <div 
                        onClick={() => selectWholeColumn(colIdx)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}
                      >
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHeader(colIdx);
                          }}
                          title="Click to rename"
                          style={{ flex: 1, display: 'flex', alignItems: 'center' }}
                        >
                          {col.label}
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{col.letter}</span>
                      </div>
                    )}
                    
                    {/* Column Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingCol(col.key);
                        setDragStart(e.clientX);
                        setSizeStart(width);
                      }}
                      style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px',
                        cursor: 'col-resize', background: resizingCol === col.key ? '#2563eb' : 'transparent',
                        zIndex: 10
                      }}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={customColumns.length + 1} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              <>
                {topSpacerHeight > 0 && (
                  <tr style={{ height: `${topSpacerHeight}px` }}>
                    <td colSpan={customColumns.length + 1} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 'none' }}></td>
                  </tr>
                )}
                {visibleRows.map((row) => {
                  const originalIdx = rowToIndexMap.get(row);
                  const customRowStyle = getRowStyle(row);
                  const rowHeight = rowHeights[originalIdx] || 30;
                  
                  return (
                    <tr 
                      key={originalIdx} 
                      style={{ 
                        background: originalIdx % 2 === 0 ? 'white' : '#f8fafc', 
                        height: `${rowHeight}px`,
                        ...customRowStyle 
                      }}
                    >
                  <td 
                    onClick={() => selectWholeRow(originalIdx)}
                    style={{ 
                      background: '#f1f5f9', color: '#64748b', textAlign: 'center', 
                      borderRight: '2px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', 
                      position: 'sticky', left: 0, zIndex: 5, cursor: 'pointer' 
                    }}
                    title={`Select Row ${originalIdx + 1}`}
                  >
                    {originalIdx + 1}
                    
                    {/* Row Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingRow(originalIdx);
                        setDragStart(e.clientY);
                        setSizeStart(rowHeight);
                      }}
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                        cursor: 'row-resize', background: resizingRow === originalIdx ? '#2563eb' : 'transparent',
                        zIndex: 10
                      }}
                      title="Drag to resize row height"
                    />
                  </td>
                  {customColumns.map((col, colIdx) => {
                    const isSelected = selectedCell && selectedCell.row === originalIdx && selectedCell.col === colIdx;
                    const isEditing = editingCell && editingCell.row === originalIdx && editingCell.col === colIdx;
                    const isInRange = isCellInRange(originalIdx, colIdx);
                    const isMatch = term && String(row[col.key] || '').toLowerCase().includes(term);
                    const storedStyleObj = row._cellStyles ? row._cellStyles[col.key] : null;
                    
                    const getTemporalDefault = (type) => {
                      const d = new Date();
                      const offset = d.getTimezoneOffset();
                      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                      if (type === 'date') return localDate.toISOString().split('T')[0];
                      if (type === 'datetime-local') return localDate.toISOString().substring(0, 16);
                      if (type === 'time') return localDate.toISOString().split('T')[1].substring(0, 5);
                      return '';
                    };

                    let cellBackground = 'inherit';
                    let additionalStyles = { fontSize: '13px' };
                    
                    if (storedStyleObj) {
                      if (typeof storedStyleObj === 'string') {
                        cellBackground = storedStyleObj;
                      } else {
                        if (storedStyleObj.background) cellBackground = storedStyleObj.background;
                        if (storedStyleObj.bold) additionalStyles.fontWeight = 'bold';
                        if (storedStyleObj.italic) additionalStyles.fontStyle = 'italic';
                        if (storedStyleObj.underline) additionalStyles.textDecoration = 'underline';
                        if (storedStyleObj.color) additionalStyles.color = storedStyleObj.color;
                        if (storedStyleObj.fontSize) additionalStyles.fontSize = `${storedStyleObj.fontSize}px`;
                        if (storedStyleObj.textAlign) additionalStyles.textAlign = storedStyleObj.textAlign;
                      }
                    }
                    
                    let cellStyle = {
                      border: '1px solid #e2e8f0', height: '30px', padding: 0, position: 'relative', cursor: isEraserMode ? 'not-allowed' : 'cell',
                      background: cellBackground,
                      ...additionalStyles
                    };

                    if (isMatch) cellStyle = { ...cellStyle, background: '#fef08a', color: '#0f172a' };
                    else if (isInRange) cellStyle = { ...cellStyle, background: '#dbeafe', color: '#0f172a' };
                    
                    if (isSelected) cellStyle = { ...cellStyle, outline: '2px solid #2563eb', outlineOffset: '-1px', background: '#eff6ff', zIndex: 2, color: '#0f172a' };
                    if (isEditing) cellStyle = { ...cellStyle, outline: '2px solid #2563eb', outlineOffset: '-1px', background: 'white', zIndex: 3, color: '#0f172a' };

                    return (
                      <td 
                        key={col.key} id={`cell-${activeStorageKey}-${originalIdx}-${colIdx}`}
                        style={cellStyle}
                        onMouseDown={(e) => onCellMouseDown(e, originalIdx, colIdx)}
                        onMouseOver={(e) => onCellMouseOver(e, originalIdx, colIdx)}
                        onDoubleClick={() => { 
                          if (col.readOnly) return;
                          if (row.status === 'Deducted' && col.key !== 'status') {
                            showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
                            return;
                          }
                          pushUndo(); 
                          setEditingCell({ row: originalIdx, col: colIdx }); 
                        }}
                        onContextMenu={(e) => handleContextMenu(e, originalIdx, colIdx)}
                      >
                        {isEditing ? (
                          col.type === 'select' ? (
                            <>
                              <input 
                                ref={editInputRef} type="text" 
                                defaultValue={editingCell.initialValue !== undefined ? editingCell.initialValue : row[col.key]}
                                list={`list-${col.key}-${originalIdx}`}
                                onBlur={(e) => commitEdit(e.target.value)}
                                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                                autoFocus
                              />
                              <datalist id={`list-${col.key}-${originalIdx}`}>
                                {col.options && col.options.map(o => <option key={o} value={o} />)}
                              </datalist>
                            </>
                          ) : col.type === 'status' ? (
                            <select 
                              ref={editInputRef} defaultValue={row[col.key]} 
                              onChange={(e) => commitEdit(e.target.value, true)}
                              onBlur={(e) => commitEdit(e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                              autoFocus
                            >
                              {col.options && col.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : col.type === 'date' || col.type === 'datetime-local' ? (
                            <input 
                              ref={editInputRef} type={col.type} 
                              defaultValue={row[col.key] || getTemporalDefault(col.type)} 
                              onBlur={(e) => commitEdit(e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                              autoFocus
                            />
                          ) : (
                            <input
                              ref={editInputRef}
                              type="text"
                              inputMode={col.type === 'number' ? 'decimal' : 'text'}
                              defaultValue={editingCell.initialValue !== undefined ? editingCell.initialValue : row[col.key]}
                              autoFocus
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', font: 'inherit', color: '#0f172a', textAlign: 'inherit', userSelect: 'text' }}
                              onBlur={(e) => {
                                commitEdit(e.target.value);
                              }}
                            />
                          )
                        ) : (
                          <div style={{ padding: '4px 8px', minHeight: '28px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', justifyContent: additionalStyles.textAlign === 'center' ? 'center' : (additionalStyles.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
                            {getCustomCellContent ? (
                               getCustomCellContent(col, row[col.key], row) || (col.type === 'status' ? getStatusBadge(row[col.key]) : (col.type === 'date' ? formatDateDisplay(row[col.key]) : evaluateFormula(row[col.key], data, customColumns)))
                            ) : (
                               col.type === 'status' ? getStatusBadge(row[col.key]) : (col.type === 'date' ? formatDateDisplay(row[col.key]) : evaluateFormula(row[col.key], data, customColumns))
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {bottomSpacerHeight > 0 && (
              <tr style={{ height: `${bottomSpacerHeight}px` }}>
                <td colSpan={customColumns.length + 1} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 'none' }}></td>
              </tr>
            )}
              </>
            )}
            
            {showTotals && filteredData.length > 0 && (() => {
              // Smart detection: these column key/label patterns should NEVER be summed
              const skipPatterns = [
                'age', 'mobile', 'phone', 'tel', 'contact', 'pin', 'zip', 'code',
                'id', 'empid', 'employee_id', 'employeeid', 's.n', 'sn', 'serial', 'sr',
                'date', 'time', 'year', 'month', 'day', 'dob', 'joining',
                'name', 'patient', 'employee', 'doctor', 'nurse', 'person',
                'department', 'dept', 'designation', 'shift', 'location', 'address',
                'remark', 'note', 'observation', 'status', 'gender', 'sex',
                'blood', 'group', 'batch', 'lot', 'rack', 'manufacturer',
                'complaint', 'diagnosis', 'treatment', 'medicine', 'prescribed',
                'referred', 'reported', 'checked', 'escorted', 'administered',
                'allerg', 'condition', 'effect', 'signature', 'ambulance',
                'body', 'part', 'nature', 'type', 'category', 'unit', 'dose',
                'vaccine', 'item', 'ppe', 'complian', 'fitness', 'vision',
                'hearing', 'lung', 'x-ray', 'ecg', 'overall', 'test', 'result',
                'expiry', 'replace', 'issue', 'emergency', 'response',
                'lastupdate', 'last_update', 'lastupdated',
                'handover', 'outside', 'g.code', 'gcode',
              ];
              
              const shouldSkip = (col) => {
                const k = (col.key || '').toLowerCase().replace(/[_\-\s]/g, '');
                const l = (col.label || '').toLowerCase().replace(/[_\-\s]/g, '');
                // Skip date/select type columns
                if (col.type === 'date' || col.type === 'datetime-local') return true;
                if (col.type === 'select') return true;
                // Check against patterns
                return skipPatterns.some(p => {
                  const pattern = p.replace(/[_\-\s]/g, '');
                  return k.includes(pattern) || l.includes(pattern);
                });
              };

              return (
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #94a3b8', position: 'sticky', bottom: 0, zIndex: 11 }}>
                  <td style={{ background: '#e2e8f0', color: '#334155', textAlign: 'center', borderRight: '2px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 12 }}>
                    ∑
                  </td>
                  {customColumns.map((col, colIdx) => {
                    // Check if this column should be skipped
                    if (shouldSkip(col)) {
                      return (
                        <td key={`total-${col.key}`} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                          {colIdx === 0 ? 'Grand Total' : '—'}
                        </td>
                      );
                    }

                    let sum = 0;
                    let hasNumeric = false;
                    filteredData.forEach(row => {
                      const val = row[col.key];
                      if (val !== null && val !== undefined && val !== '') {
                        const num = Number(String(val).replace(/[,%₹$]/g, ''));
                        if (!isNaN(num)) {
                          sum += num;
                          hasNumeric = true;
                        }
                      }
                    });
                    return (
                      <td key={`total-${col.key}`} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: hasNumeric ? 'right' : 'center', color: hasNumeric ? '#1e293b' : '#94a3b8', fontSize: hasNumeric ? '13px' : '11px' }}>
                        {hasNumeric ? sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
          </tbody>
        </table>
        {/* Add new row button at bottom of grid */}
        <div 
          className="print-hide"
          onClick={addRow}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px 0', cursor: 'pointer', color: '#64748b',
            borderTop: '1px dashed #cbd5e1', background: '#f8fafc',
            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            userSelect: 'none', position: 'sticky', left: 0
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          title="Add a new blank row"
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Row
        </div>
      </div>

      <div className="print-hide" style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '8px 16px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Tab</kbd> Next</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Enter</kbd> Next</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Shift+Tab</kbd> Previous</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Esc</kbd> Cancel</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Ctrl+Z</kbd> Undo</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Ctrl+S</kbd> Save</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Arrows</kbd> Navigate</span>
          <span style={{ fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
            {filteredData.length === data.length
              ? `${data.length} records`
              : `Showing ${filteredData.length} of ${data.length}`
            } · {customColumns.length} cols
          </span>
        </div>
        
        {selectionMetrics && (
          <div style={{ display: 'flex', gap: '12px', fontWeight: 600, color: '#334155', fontSize: '11.5px', flexWrap: 'wrap' }}>
            {selectionMetrics.sum !== null && <span style={{ background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>Sum: {(Math.round(selectionMetrics.sum * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.avg !== null && <span style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>Avg: {(Math.round(selectionMetrics.avg * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.median !== null && <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>Median: {(Math.round(selectionMetrics.median * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.countA !== null && <span>Count: {selectionMetrics.countA}</span>}
            {selectionMetrics.min !== null && <span>Min: {selectionMetrics.min.toLocaleString()}</span>}
            {selectionMetrics.max !== null && <span>Max: {selectionMetrics.max.toLocaleString()}</span>}
            {selectionMetrics.stdev !== null && <span style={{ background: '#fdf2f8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fbcfe8' }}>StDev: {(Math.round(selectionMetrics.stdev * 100) / 100).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {contextMenu.show && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 9999, minWidth: '180px', fontSize: '13px' }}>
          <div onClick={() => contextAction('insertAbove')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬆️ Insert Row Above</div>
          <div onClick={() => contextAction('insertBelow')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬇️ Insert Row Below</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('insertColLeft')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬅️ Insert Column Left</div>
          <div onClick={() => contextAction('insertColRight')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Insert Column Right</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('copyRow')} style={{ padding: '8px 16px', cursor: 'pointer' }}>📋 Copy Row</div>
          <div onClick={() => contextAction('clearCell')} style={{ padding: '8px 16px', cursor: 'pointer' }}>🧹 Clear Cell / Selection</div>
          <div onClick={() => contextAction('clearColumn')} style={{ padding: '8px 16px', cursor: 'pointer' }}>🧹 Clear Entire Column</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('fillDown')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Fill Down (Ctrl+D)</div>
          <div onClick={() => contextAction('fillSeries')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Fill Series (1, 2, 3...)</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('deleteRow')} style={{ padding: '8px 16px', cursor: 'pointer', color: '#dc2626' }}>🗑 Delete Row(s)</div>
          <div onClick={deleteColumn} style={{ padding: '8px 16px', cursor: 'pointer', color: '#dc2626' }}>🗑 Delete Column</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('moveColLeft')} style={{ padding: '8px 16px', cursor: 'pointer' }}>◀️ Move Column Left (Alt+◀)</div>
          <div onClick={() => contextAction('moveColRight')} style={{ padding: '8px 16px', cursor: 'pointer' }}>▶️ Move Column Right (Alt+▶)</div>
        </div>
      )}

      {importModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>Import Data: Map Columns</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem' }}>
              We found {importModalData.headers.length} columns in your file. Match them to the grid's columns below.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>System Column</div>
              <div style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>File Column</div>
              
              {customColumns.map(col => (
                <React.Fragment key={col.key}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                    {col.label} {col.key.toLowerCase().includes('id') && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '6px', fontWeight: 'normal' }}>(Auto if empty)</span>}
                  </div>
                  <div>
                    <select
                      value={importMapping[col.key] !== undefined ? importMapping[col.key] : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setImportMapping(prev => ({ ...prev, [col.key]: val }));
                      }}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}
                    >
                      <option value="">-- Ignore / Skip --</option>
                      {importModalData.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `(Column ${i + 1})`}</option>
                      ))}
                    </select>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <button 
                onClick={() => { setImportModalData(null); setImportMapping({}); }} 
                style={{ padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={() => executeImport('append')} 
                style={{ padding: '12px 20px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
              >
                Append Data
              </button>
              <button 
                onClick={() => executeImport('replace')} 
                style={{ padding: '12px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
              >
                Replace Data
              </button>
              <button 
                onClick={() => executeImport('new_sheet')} 
                style={{ padding: '12px 20px', background: '#10b981', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#059669'}
                onMouseOut={e => e.currentTarget.style.background = '#10b981'}
              >
                Create New Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelGrid;

```

### A.5 src/components/clinical/OPDCounter.jsx
```javascript
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
    const isChild = !isNaN(ageVal) && ageVal <= 12;
    return isMale && !isChild;
  }).length;

  const female = todayPatients.filter(r => {
    const { gender, ageVal } = getGenderAndAge(r);
    const isFemale = gender === 'female';
    const isChild = !isNaN(ageVal) && ageVal <= 12;
    return isFemale && !isChild;
  }).length;

  const child = todayPatients.filter(r => {
    const { ageVal } = getGenderAndAge(r);
    return !isNaN(ageVal) && ageVal <= 12;
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


```

### A.6 src/components/DispenseMedicine.jsx
```javascript
import React, { useEffect, useState, useCallback, useRef } from 'react';
import ExcelGrid from './clinical/ExcelGrid';
import { ArrowRightLeft, Zap, RefreshCw } from 'lucide-react';
import { getSheetData, saveSheetData } from '../utils/sheetDB';

const capitalizeName = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const parseMedicineLine = (line) => {
  let cleaned = line.trim();
  // Strip list prefixes like "1. ", "2) ", "* ", etc.
  cleaned = cleaned.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '');
  cleaned = cleaned.trim();
  if (!cleaned) return null;

  // Look for common frequency markers
  const freqRegex = /\b(bd|bid|tds|tid|od|qid|sos|hs|twice|thrice|once|daily|after\s+food|before\s+food|ac|pc|1x2|1x3|1x1|1x4)\b/i;
  const match = cleaned.match(freqRegex);
  
  if (match) {
    const idx = match.index;
    const medName = cleaned.substring(0, idx).replace(/[\-\s\.,]+$/, '').trim();
    const dosage = cleaned.substring(idx).trim();
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // If no frequency marker, check if there's a trailing quantity like "x 10", "- 10", "10 tabs"
  const qtyRegex = /(?:\s+x\s*|\s*\-\s*|\s+)(\d+)\s*(?:tabs|tablets|caps|capsules|amp|amps|vials|pcs|pieces|bottles|ml|vial|tablet|capsule)\b/i;
  const qtyMatch = cleaned.match(qtyRegex);
  if (qtyMatch) {
    const idx = qtyMatch.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch[1]; // just the quantity
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  const qtyMatch2 = cleaned.match(/(?:\s+x\s*|\s*\-\s*)(\d+)\s*$/i);
  if (qtyMatch2) {
    const idx = qtyMatch2.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch2[1];
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // Default fallback: entire line is name, dosage is '1'
  return {
    name: capitalizeName(cleaned),
    dosage: '1'
  };
};

const columns = [
  { key: 'date', label: 'Date', letter: 'A', width: 120, type: 'date' },
  { key: 'patientName', label: "Patient's Name", letter: 'B', width: 200, type: 'text' },
  { key: 'gender', label: 'Gender', letter: 'C', width: 100, type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'age', label: 'Age', letter: 'D', width: 80, type: 'number' },
  { key: 'empId', label: 'Employee ID', letter: 'E', width: 120, type: 'text' },
  { key: 'company', label: 'Company', letter: 'F', width: 150, type: 'text' },
  { key: 'department', label: 'Department', letter: 'G', width: 150, type: 'text' },
  { key: 'diagnosis', label: 'Diagnosis', letter: 'H', width: 220, type: 'text' },
  { key: 'medicineName', label: 'Medicine Dispensed', letter: 'I', width: 200, type: 'text' },
  { key: 'dosage', label: 'Dosage', letter: 'J', width: 100, type: 'text' },
  { key: 'totalCharges', label: 'Total Charges', letter: 'K', width: 120, type: 'number' },
  { key: 'prescribedBy', label: 'Prescribed By', letter: 'L', width: 160, type: 'text' },
  { key: 'dispensedBy', label: 'Dispensed By', letter: 'M', width: 160, type: 'text' },
  { key: 'status', label: 'Status', letter: 'N', width: 120, type: 'select', options: ['Pending', 'Pushed'] },
  { key: 'remarks', label: 'Remarks', letter: 'O', width: 200, type: 'text' }
];

const sampleData = [];

const getRowStyle = (row) => {
  if (row.status === 'Pushed') {
    return { background: '#f0fdf4', color: '#166534' }; // Green for successfully pushed
  }
  if (row.status === 'Pending') {
    return { background: '#fffbeb', color: '#b45309' }; // Yellow/Orange for pending
  }
  return {};
};

const DispenseMedicine = () => {
  const [dataReady, setDataReady] = useState(false);
  const [gridKey, setGridKey] = useState(() => Date.now());
  const [autoSyncCount, setAutoSyncCount] = useState(0);
  const [lastAutoSync, setLastAutoSync] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('cms_dispense_autosync') !== 'false';
  });
  const isExtractingRef = useRef(false);

  useEffect(() => {
    async function migrateDispenseData() {
      try {
        let data = await getSheetData('cms_dispense_log');
        let modified = false;
        
        if (data && Array.isArray(data)) {
          // Check/migrate keys in IndexedDB
          const migrated = data.map(row => {
            if (!row) return row;
            const newRow = { ...row };
            
            // Migrate old keys to CamelCase to prevent blank render cells
            if (row.patientname !== undefined && row.patientName === undefined) { newRow.patientName = row.patientname; delete newRow.patientname; modified = true; }
            if (row.empCode !== undefined && row.empId === undefined) { newRow.empId = row.empCode; delete newRow.empCode; modified = true; }
            if (row.employeeId !== undefined && row.empId === undefined) { newRow.empId = row.employeeId; delete newRow.employeeId; modified = true; }
            if (row.medicinesDetails !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicinesDetails; delete newRow.medicinesDetails; modified = true; }
            if (row.medicineprescribed !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicineprescribed; delete newRow.medicineprescribed; modified = true; }
            if (row.totalCharge !== undefined && row.totalCharges === undefined) { newRow.totalCharges = row.totalCharge; delete newRow.totalCharge; modified = true; }
            if (row.doctorname !== undefined && row.prescribedBy === undefined) { newRow.prescribedBy = row.doctorname; delete newRow.doctorname; modified = true; }
            if (row.treatmentgiven !== undefined && row.dosage === undefined) { newRow.dosage = row.treatmentgiven; delete newRow.treatmentgiven; modified = true; }
            
            return newRow;
          });
          
          if (modified) {
            await saveSheetData('cms_dispense_log', migrated);
            console.log("[DispenseMedicine] Aligned keys in IndexedDB.");
          }
        } else {
          // If no data in IndexedDB, check localStorage 'cms_dispense_log'
          const savedLocal = localStorage.getItem('cms_dispense_log');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                const migrated = parsed.map(row => {
                  if (!row) return row;
                  const newRow = { ...row };
                  if (row.patientname !== undefined && row.patientName === undefined) { newRow.patientName = row.patientname; delete newRow.patientname; }
                  if (row.empCode !== undefined && row.empId === undefined) { newRow.empId = row.empCode; delete newRow.empCode; }
                  if (row.employeeId !== undefined && row.empId === undefined) { newRow.empId = row.employeeId; delete newRow.employeeId; }
                  if (row.medicinesDetails !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicinesDetails; delete newRow.medicinesDetails; }
                  if (row.medicineprescribed !== undefined && row.medicineName === undefined) { newRow.medicineName = row.medicineprescribed; delete newRow.medicineprescribed; }
                  if (row.totalCharge !== undefined && row.totalCharges === undefined) { newRow.totalCharges = row.totalCharge; delete newRow.totalCharge; }
                  if (row.doctorname !== undefined && row.prescribedBy === undefined) { newRow.prescribedBy = row.doctorname; delete newRow.doctorname; }
                  if (row.treatmentgiven !== undefined && row.dosage === undefined) { newRow.dosage = row.treatmentgiven; delete newRow.treatmentgiven; }
                  return newRow;
                });
                await saveSheetData('cms_dispense_log', migrated);
                localStorage.removeItem('cms_dispense_log');
                console.log("[DispenseMedicine] Migrated and aligned cms_dispense_log from localStorage to IndexedDB.");
              }
            } catch (e) {
              console.error(e);
            }
          } else {
            // Check legacy 'dispense_logs'
            const oldLogs = JSON.parse(localStorage.getItem('dispense_logs') || '[]');
            if (oldLogs.length > 0) {
              const migrated = oldLogs.map((log, idx) => ({
                id: idx + 1,
                date: log.date ? new Date(log.date).toISOString().slice(0, 16) : '',
                patientName: log.patientName || '',
                medicineName: `${log.medicineName || ''} ${log.dosage || ''}`.trim(),
                quantity: log.quantity || '',
                department: '',
                dispensedBy: 'System Migrated',
                status: 'Pending',
                remarks: ''
              }));
              await saveSheetData('cms_dispense_log', migrated);
              localStorage.removeItem('dispense_logs');
              console.log("[DispenseMedicine] Migrated dispense_logs from localStorage to IndexedDB.");
            }
          }
        }

        // Keep alignment validation for columns metadata as well
        const colsKey = 'cms_dispense_log_columns';
        const savedCols = localStorage.getItem(colsKey);
        if (savedCols) {
          try {
            const parsed = JSON.parse(savedCols);
            const requiredKeys = ['date', 'patientName', 'gender', 'age', 'empId', 'company', 'department', 'medicineName', 'dosage', 'totalCharges', 'prescribedBy', 'dispensedBy', 'status', 'diagnosis', 'remarks'];
            const hasAllKeys = requiredKeys.every(k => parsed.some(c => c.key === k));
            const hasObsolete = parsed.some(c => c.key === 'medicineConsumed' || c.key === 'quantity' || c.key === 'batchNo');
            if (!hasAllKeys || hasObsolete || parsed.length !== requiredKeys.length) {
              localStorage.removeItem(colsKey);
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cms_dispense_log_') && key.endsWith('_columns')) {
                  localStorage.removeItem(key);
                }
              }
            } else {
              const updated = parsed.map(c => c.key === 'patientName' && c.label === 'Patient Name' ? { ...c, label: "Patient's Name" } : c);
              localStorage.setItem(colsKey, JSON.stringify(updated));
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error("Migration error:", err);
      } finally {
        setDataReady(true);
      }
    }

    migrateDispenseData();
  }, []);

  const handleDataChange = useCallback(async (newData) => {
    await saveSheetData('cms_dispense_log', newData);
  }, []);

  // Core extraction logic (used by both manual and auto sync)
  const extractFromOPD = useCallback(async (silent = false) => {
    if (isExtractingRef.current) return;
    isExtractingRef.current = true;
    try {
      // Get all OPD tabs from localStorage index
      const savedTabs = localStorage.getItem('cms_daily_opd_sheet_tabs_index');
      let opdTabs = [];
      if (savedTabs) {
        try {
          opdTabs = JSON.parse(savedTabs);
        } catch (e) {}
      }
      if (!Array.isArray(opdTabs) || opdTabs.length === 0) {
        opdTabs = [{ id: 'default', name: 'Daily OPD Log', storageKey: 'cms_daily_opd_sheet' }];
      }

      const dispenseData = await getSheetData('cms_dispense_log') || [];
      
      // Filter out completely empty/padded rows from existing dispense logs
      const cleanDispenseData = dispenseData.filter(row => {
        if (!row) return false;
        return Object.entries(row).some(([k, v]) => 
          k !== 'id' && k !== 'status' && String(v).trim() !== ''
        );
      });

      let pulledCount = 0;
      const newDispenseLogs = [...cleanDispenseData];

      // Helper to check if a row is valid and not empty
      const isValidOpdRow = (r) => {
        if (!r) return false;
        const name = String(r.patientName || r.patientname || '').trim();
        const code = String(r.empCode || r.empId || '').trim();
        // Allow fallback if user is tracking outside employees (just using name)
        return name.length > 0 || code.length > 0;
      };       const getMedicine = (r) => String(r.medicinesDetails || r.medicineprescribed || '').trim();
       const isAlreadyDispensed = (opdRow) => {
         const opdId = String(opdRow.id || '');
         return newDispenseLogs.some(log => {
           const logOpdId = String(log.opdId || '');
           if (opdId && logOpdId) {
             return logOpdId === opdId;
           }
           const opdDate = String(opdRow.date || new Date().toISOString().split('T')[0]);
           const opdName = String(opdRow.patientName || opdRow.patientname || '').trim().toLowerCase();
           const opdCode = String(opdRow.empCode || opdRow.empId || '').trim().toLowerCase();
           
           const logDate = String(log.date || '');
           const logName = String(log.patientName || '').trim().toLowerCase();
           const logCode = String(log.empId || '').trim().toLowerCase();
           
           return logDate === opdDate && logName === opdName && logCode === logCode;
         });
       };
 
       for (const tab of opdTabs) {
         const tabData = await getSheetData(tab.storageKey);
         if (Array.isArray(tabData)) {
           let tabModified = false;
           const updatedTabData = tabData.map(opdRow => {
             if (!opdRow) return opdRow;
             
             // Fast path: skip already-extracted rows in auto-sync (silent mode)
             if (opdRow.extracted && silent) return opdRow;
             
             const rawMedText = getMedicine(opdRow);
             if (!rawMedText) return opdRow;
 
             const alreadyPushed = isAlreadyDispensed(opdRow);
             const shouldExtract = !alreadyPushed;
 
             if (isValidOpdRow(opdRow) && shouldExtract) {
               newDispenseLogs.push({
                 id: `DISP-${Date.now()}-${pulledCount}`,
                 opdId: opdRow.id || '',
                 date: opdRow.date || new Date().toISOString().split('T')[0],
                 patientName: opdRow.patientName || opdRow.patientname || '',
                 gender: opdRow.gender || '',
                 age: opdRow.age || '',
                 empId: opdRow.empCode || opdRow.empId || '',
                 company: opdRow.company || '',
                 department: opdRow.department || '',
                 medicineName: rawMedText,
                 dosage: opdRow.treatmentGiven || opdRow.treatmentgiven || '1',
                 quantity: 1,
                 totalCharges: opdRow.totalCharge || '',
                 prescribedBy: opdRow.drName || opdRow.doctorname || '',
                 dispensedBy: opdRow.doneBy || '',
                 status: 'Pending',
                 diagnosis: opdRow.diagnosis || '',
                 medicineConsumed: opdRow.medicineConsumed || '',
                 batchNo: opdRow.batchNo || ''
               });
               pulledCount++;
               tabModified = true;
               return { ...opdRow, extracted: true };
             } else if (isValidOpdRow(opdRow) && alreadyPushed && !opdRow.extracted) {
               tabModified = true;
               return { ...opdRow, extracted: true };
             }
             return opdRow;
           });
 
           if (tabModified) {
             await saveSheetData(tab.storageKey, updatedTabData);
           }
         }
       }

      if (pulledCount > 0) {
        await saveSheetData('cms_dispense_log', newDispenseLogs);
        setGridKey(Date.now());
        setAutoSyncCount(prev => prev + pulledCount);
        setLastAutoSync(new Date().toLocaleTimeString());
        
        if (!silent) {
          alert(`✅ Successfully extracted ${pulledCount} patient(s) with prescribed medicines from the OPD Log!`);
        }
        return pulledCount;
      } else {
        if (!silent) {
          alert('No new un-extracted patient records with medicines found in the OPD Log!');
        }
        return 0;
      }
    } catch (e) {
      console.error(e);
      if (!silent) alert('Error extracting from OPD');
      return 0;
    } finally {
      isExtractingRef.current = false;
    }
  }, []);

  // Auto-sync: runs on mount and every 10 seconds
  useEffect(() => {
    if (!dataReady || !autoSyncEnabled) return;

    // Run once on mount
    extractFromOPD(true).then(initialCount => {
      if (initialCount > 0) {
        setAutoSyncCount(initialCount);
      }
    });

    // Set up periodic check
    const interval = setInterval(() => {
      extractFromOPD(true);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [dataReady, autoSyncEnabled, extractFromOPD]);

  const toggleAutoSync = () => {
    const newVal = !autoSyncEnabled;
    setAutoSyncEnabled(newVal);
    localStorage.setItem('cms_dispense_autosync', newVal.toString());
  };

  if (!dataReady) return null;

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            💊 Clinical Dispensing Log
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            OPD records auto-sync here. Records are automatically sent to Daily Consume.
            {lastAutoSync && (
              <span style={{ marginLeft: '12px', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                🔄 Last sync: {lastAutoSync} ({autoSyncCount} new)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Auto-sync toggle */}
          <button
            onClick={toggleAutoSync}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: autoSyncEnabled ? '#059669' : '#94a3b8',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', fontSize: '13px',
              transition: 'all 0.2s'
            }}
            title={autoSyncEnabled ? 'Auto-sync is ON — OPD data flows here automatically every 10s' : 'Auto-sync is OFF'}
          >
            <Zap size={14} />
            Auto: {autoSyncEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Manual extract button */}
          <button 
            onClick={() => extractFromOPD(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
            title="Manually pull new prescriptions from the Daily OPD sheet"
          >
            <ArrowRightLeft size={16} /> Extract from OPD
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ExcelGrid 
          key={gridKey}
          title="Dispensing Logs"
          storageKey="cms_dispense_log"
          columns={columns}
          initialData={sampleData}
          idPrefix="DISP-"
          getRowStyle={getRowStyle}
          onDataChange={handleDataChange}
          filters={[
            { key: 'status', label: 'All Statuses', options: ['Pending', 'Pushed'] }
          ]}
        />
      </div>
    </div>
  );
};

export default DispenseMedicine;

```

### A.7 src/components/clinical/DailyConsume.jsx
```javascript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ExcelGrid from './ExcelGrid';
import { ArrowDownToLine, AlertCircle, Calendar } from 'lucide-react';
import { getSheetData, saveSheetData } from '../../utils/sheetDB';

const getStockData = async () => {
  let data = await getSheetData('cms_medstock_data');
  if (!data) {
    const saved = localStorage.getItem('cms_medstock_data');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_medstock_data', data);
        localStorage.removeItem('cms_medstock_data');
      } catch (e) {}
    }
  }
  return data || [];
};

const getDispenseData = async () => {
  let data = await getSheetData('cms_dispense_log');
  if (!data) {
    const saved = localStorage.getItem('cms_dispense_log');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_dispense_log', data);
        localStorage.removeItem('cms_dispense_log');
      } catch (e) {}
    }
  }
  return data || [];
};

const getMonthlyBalanceData = async () => {
  let data = await getSheetData('cms_yearly_monthly_balance');
  if (!data) {
    const saved = localStorage.getItem('cms_yearly_monthly_balance');
    if (saved) {
      try {
        data = JSON.parse(saved);
        await saveSheetData('cms_yearly_monthly_balance', data);
        localStorage.removeItem('cms_yearly_monthly_balance');
      } catch (e) {}
    }
  }
  return data || [];
};


const getExcelCol = (n) => {
  let s = '', t;
  while (n > 0) {
    t = (n - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    n = (n - t)/26 | 0;
  }
  return s || undefined;
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const sections = [
  { prefix: 'ohc', name: 'OHC Counter' },
  { prefix: 'dress', name: 'Dressing' },
  { prefix: 'life', name: 'Life Saving' },
  { prefix: 'first', name: 'First Aid' },
  { prefix: 'phys', name: 'Physiotherapy' },
  { prefix: 'pme', name: 'PME' },
  { prefix: 'exp', name: 'Exp.' }
];

const subCols = [];
sections.forEach(s => {
  for (let i = 1; i <= 4; i++) {
    subCols.push({ k: `${s.prefix}_${i}`, l: i.toString(), w: 80, grp: s.name });
  }
  subCols.push({ k: `${s.prefix}_total`, l: 'Total', w: 80, grp: s.name });
});
subCols.push({ k: 'total', l: 'TOTAL', w: 90, grp: 'Monthly Total' });

const daysArray = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const initialData = Array(5).fill(null).map((_, i) => ({
  id: `DC-00${i + 1}`,
  medicineName: '',
  type: '',
  status: 'Pending'
}));

const getRowStyle = (row) => {
  if (row.status === 'Deducted') {
    return { background: '#f0fdf4', color: '#166534' }; 
  }
  if (row.status === 'Pending') {
    return { background: '#fffbeb', color: '#b45309' }; 
  }
  return {};
};

// Standalone computeRow function to avoid ordering / scope dependencies
const computeRow = (row) => {
  let grandTotal = 0;
  const newRow = { ...row };
  
  daysArray.forEach(d => {
    const pfx = `day${d}`;
    let dTotal = 0;
    sections.forEach(s => {
      let sTotal = 0;
      for (let i = 1; i <= 4; i++) {
        sTotal += parseInt(newRow[`${pfx}_${s.prefix}_${i}`]) || 0;
      }
      newRow[`${pfx}_${s.prefix}_total`] = sTotal.toString();
      dTotal += sTotal;
    });
    newRow[`${pfx}_total`] = dTotal.toString();
    grandTotal += dTotal;
  });
  
  newRow.monthlyGrandTotal = grandTotal.toString();
  return newRow;
};

const capitalizeName = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const parseMedicineLine = (line) => {
  let cleaned = line.trim();
  // Strip list prefixes like "1. ", "2) ", "* ", etc.
  cleaned = cleaned.replace(/^\s*(?:\d+[\.\)\-]?|[\*\-\•])\s*/, '');
  cleaned = cleaned.trim();
  if (!cleaned) return null;

  // Look for common frequency markers
  const freqRegex = /\b(bd|bid|tds|tid|od|qid|sos|hs|twice|thrice|once|daily|after\s+food|before\s+food|ac|pc|1x2|1x3|1x1|1x4)\b/i;
  const match = cleaned.match(freqRegex);
  
  if (match) {
    const idx = match.index;
    const medName = cleaned.substring(0, idx).replace(/[\-\s\.,]+$/, '').trim();
    const dosage = cleaned.substring(idx).trim();
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // If no frequency marker, check if there's a trailing quantity like "x 10", "- 10", "10 tabs"
  const qtyRegex = /(?:\s+x\s*|\s*\-\s*|\s+)(\d+)\s*(?:tabs|tablets|caps|capsules|amp|amps|vials|pcs|pieces|bottles|ml|vial|tablet|capsule)\b/i;
  const qtyMatch = cleaned.match(qtyRegex);
  if (qtyMatch) {
    const idx = qtyMatch.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch[1]; // just the quantity
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  const qtyMatch2 = cleaned.match(/(?:\s+x\s*|\s*\-\s*)(\d+)\s*$/i);
  if (qtyMatch2) {
    const idx = qtyMatch2.index;
    const medName = cleaned.substring(0, idx).trim();
    const dosage = qtyMatch2[1];
    return {
      name: capitalizeName(medName || cleaned),
      dosage: dosage
    };
  }

  // Default fallback: entire line is name, dosage is '1'
  return {
    name: capitalizeName(cleaned),
    dosage: '1'
  };
};

// Quantity parser from dosage
const parseQuantity = (dosageStr) => {
  if (!dosageStr) return 1;
  const str = dosageStr.toLowerCase().trim();
  
  const qtyPatterns = [
    /x\s*(\d+)/,
    /\*\s*(\d+)/,
    /qty\s*:?\s*(\d+)/,
    /total\s*:?\s*(\d+)/,
    /(\d+)\s*(tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)/,
    /\((\d+)\s*(tabs?|caps?|pcs?|pieces?|tablets?|capsules?|vials?|bottles?|ampoules?|doses?)\)/,
  ];

  for (let pattern of qtyPatterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1]) || 1;
    }
  }

  const parenMatch = str.match(/\((\d+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parseInt(parenMatch[1]) || 1;
  }

  if (/^\d+$/.test(str)) {
    return parseInt(str) || 1;
  }

  const numberMatches = str.match(/\b\d+\b/g);
  if (numberMatches) {
    const filtered = numberMatches.filter(n => {
      const idx = str.indexOf(n);
      const after = str.substring(idx + n.length, idx + n.length + 5);
      return !after.startsWith('mg') && !after.startsWith('ml') && !after.startsWith('g');
    });
    if (filtered.length > 0) {
      return parseInt(filtered[filtered.length - 1]) || 1;
    }
  }

  const anyNumber = str.match(/\d+/);
  if (anyNumber) {
    return parseInt(anyNumber[0]) || 1;
  }

  return 1;
};

// Fuzzy medicine stock item lookup
const findStockItem = (medName, stockData) => {
  const cleanName = medName.toLowerCase().trim();
  
  let match = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === cleanName);
  if (match) return { item: match, type: 'exact' };

  const matches = stockData.filter(s => {
    const sName = (s.medicineName || '').toLowerCase().trim();
    return sName.includes(cleanName) || cleanName.includes(sName);
  });

  if (matches.length === 1) {
    return { item: matches[0], type: 'partial' };
  } else if (matches.length > 1) {
    return { items: matches, type: 'ambiguous' };
  }

  const cleanWords = cleanName.split(/\s+/).filter(w => w.length > 2 && w !== 'tab' && w !== 'caps' && w !== 'tablet' && w !== 'capsule');
  if (cleanWords.length > 0) {
    const wordMatches = stockData.filter(s => {
      const sName = (s.medicineName || '').toLowerCase().trim();
      return cleanWords.some(w => sName.includes(w));
    });
    if (wordMatches.length === 1) {
      return { item: wordMatches[0], type: 'partial' };
    } else if (wordMatches.length > 1) {
      return { items: wordMatches, type: 'ambiguous' };
    }
  }

  return null;
};

// Map dispense log row to correct Daily Consume section and shift
const getTargetSectionAndShift = (row) => {
  let section = 'ohc';
  let shift = '1';

  // Search fields (case-insensitive)
  const searchStr = [
    row.medicineConsumed,
    row.department,
    row.remarks,
    row.diagnosis,
    row.dispensedBy
  ].map(f => String(f || '').toLowerCase().trim()).join(' ');

  const hasWord = (words) => words.some(w => searchStr.includes(w));

  // Determine Section
  if (hasWord(['dress', 'wound', 'injury', 'cut', 'burn', 'bandage', 'suture', 'dressing'])) {
    section = 'dress';
  } else if (hasWord(['life', 'saving', 'lifesaving', 'emergency', 'cardiac', 'ambulance', 'shock'])) {
    section = 'life';
  } else if (hasWord(['first aid', 'firstaid', 'box', 'fa '])) {
    section = 'first';
  } else if (hasWord(['physio', 'phys', 'therapy', 'sprain', 'traction', 'exercise', 'ultrasound'])) {
    section = 'phys';
  } else if (hasWord(['pme', 'medical exam', 'health check', 'annual'])) {
    section = 'pme';
  } else if (hasWord(['exp', 'expired', 'scrap'])) {
    section = 'exp';
  } else {
    section = 'ohc'; // Default to OHC Counter
  }

  // Determine Shift: 1=A, 2=B, 3=C, 4=General
  if (hasWord(['shift 1', 'shift a', 'shift_1', 'shift_a', 'shift-1', 'shift-a', ' 1st shift', 'a shift', 'shift: a', 'shift: 1'])) {
    shift = '1';
  } else if (hasWord(['shift 2', 'shift b', 'shift_2', 'shift_b', 'shift-2', 'shift-b', ' 2nd shift', 'b shift', 'shift: b', 'shift: 2'])) {
    shift = '2';
  } else if (hasWord(['shift 3', 'shift c', 'shift_3', 'shift_c', 'shift-3', 'shift-c', ' 3rd shift', 'c shift', 'shift: c', 'shift: 3'])) {
    shift = '3';
  } else if (hasWord(['shift 4', 'shift g', 'general shift', 'gen shift', 'shift_4', 'shift-4', 'g shift', 'shift: g', 'shift: 4'])) {
    shift = '4';
  } else {
    // Check if time is encoded in the date string (e.g. YYYY-MM-DDTHH:MM)
    const dateStr = String(row.date || '');
    if (dateStr.includes('T')) {
      try {
        const timePart = dateStr.split('T')[1]; // e.g. "14:30"
        const hours = parseInt(timePart.split(':')[0]);
        if (!isNaN(hours)) {
          if (hours >= 6 && hours < 14) {
            shift = '1'; // A Shift (06:00 - 14:00)
          } else if (hours >= 14 && hours < 22) {
            shift = '2'; // B Shift (14:00 - 22:00)
          } else if (hours >= 22 || hours < 6) {
            shift = '3'; // C Shift (22:00 - 06:00)
          } else {
            shift = '4'; // General Shift
          }
        }
      } catch (e) {}
    } else {
      shift = '1'; // Default
    }
  }

  return { section, shift };
};

const DailyConsume = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
  const [hasPending, setHasPending] = useState(false);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[today.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  // Dynamic day filter state (default to today's date)
  const [selectedDay, setSelectedDay] = useState(() => today.getDate().toString());

  // Generate columns dynamically based on selected day to optimize rendering performance
  const columns = useMemo(() => {
    const cols = [
      { key: 'medicineName', label: 'Medicine\'s Name', letter: 'A', width: 200, type: 'text', superGroup: 'DETAILS', group: 'Basic Info' },
      { key: 'type', label: 'Type', letter: 'B', width: 100, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'], superGroup: 'DETAILS', group: 'Basic Info' }
    ];

    let colNum = 3;
    daysArray.forEach(d => {
      if (selectedDay !== 'all' && d !== selectedDay) {
        colNum += subCols.length;
        return;
      }
      const prefix = `day${d}`;
      subCols.forEach(sc => {
        cols.push({
          key: `${prefix}_${sc.k}`,
          label: sc.l,
          letter: getExcelCol(colNum++),
          width: sc.w,
          type: 'number',
          superGroup: `DAY ${d}`,
          group: sc.grp
        });
      });
    });

    cols.push({ key: 'monthlyGrandTotal', label: 'Monthly Grand Total', letter: getExcelCol(colNum++), width: 130, type: 'number', superGroup: 'SUMMARY', group: 'Totals', readOnly: true });
    cols.push({ key: 'status', label: 'Status', letter: getExcelCol(colNum++), width: 120, type: 'select', options: ['Pending', 'Deducted'], superGroup: 'SUMMARY', group: 'Status' });
    return cols;
  }, [selectedDay]);

  const isExtractingRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Auto-sync state
  const [autoExtractEnabled, setAutoExtractEnabled] = useState(() => {
    return localStorage.getItem('cms_dc_autoextract') !== 'false';
  });
  const [autoDeductEnabled, setAutoDeductEnabled] = useState(() => {
    return localStorage.getItem('cms_dc_autodeduct') !== 'false';
  });
  const [lastExtractSync, setLastExtractSync] = useState(null);
  const [lastDeductSync, setLastDeductSync] = useState(null);
  const [extractSyncCount, setExtractSyncCount] = useState(0);
  const [deductSyncCount, setDeductSyncCount] = useState(0);

  const currentStorageKey = `cms_monthly_consume_data_${selectedYear}_${selectedMonth}`;

  const checkPending = async () => {
    try {
      const data = await getSheetData(currentStorageKey) || [];
      const pending = data.some(r => r.monthlyGrandTotal && parseInt(r.monthlyGrandTotal) > 0 && r.status === 'Pending' && r.medicineName);
      setHasPending(pending);
    } catch (e) {}
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => clearInterval(interval);
  }, [currentStorageKey]);

  // --- Flow 2: Extract from Dispense (silent mode for auto) ---
  const handleExtractFromDispense = async (silent = false) => {
    if (isExtractingRef.current) return 0;
    isExtractingRef.current = true;
    try {
      const dispenseData = await getDispenseData();
      const consumeData = await getSheetData(currentStorageKey) || [];
      const stockData = await getStockData();
      let pulledCount = 0;

      dispenseData.forEach(row => {
        if (row.medicineName && (!row.status || row.status === 'Pending')) {
          const rawMedText = row.medicineName;
          
          // Split by newline, comma, or semicolon to extract individual medicines
          const lines = rawMedText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
          
          const dateObj = new Date(row.date || new Date());
          const day = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
          
          const { section, shift } = getTargetSectionAndShift(row);
          const targetCell = `day${day}_${section}_${shift}`;

          lines.forEach(line => {
            const parsed = parseMedicineLine(line);
            if (!parsed || !parsed.name) return;

            const medName = parsed.name;
            const medNameLower = medName.toLowerCase().trim();
            const qty = parseQuantity(parsed.dosage);

            let consumeRow = consumeData.find(c => (c.medicineName || '').toLowerCase().trim() === medNameLower);
            
            let medType = '';
            const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
            if (stockItem) {
              medType = stockItem.unit || stockItem.category || '';
            }

            if (consumeRow) {
              const currentVal = parseInt(consumeRow[targetCell]) || 0;
              consumeRow[targetCell] = (currentVal + qty).toString();
              consumeRow.status = 'Pending';
              
              const updated = computeRow(consumeRow);
              Object.assign(consumeRow, updated);
            } else {
              let newRow = {
                id: 'DC-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
                medicineName: medName,
                type: medType,
                status: 'Pending'
              };
              daysArray.forEach(d => {
                const pfx = `day${d}`;
                sections.forEach(s => {
                  for (let i = 1; i <= 4; i++) {
                    newRow[`${pfx}_${s.prefix}_${i}`] = '';
                  }
                  newRow[`${pfx}_${s.prefix}_total`] = '0';
                });
                newRow[`${pfx}_total`] = '0';
              });
              
              newRow[targetCell] = qty.toString();
              newRow = computeRow(newRow);
              consumeData.push(newRow);
            }
          });

          row.status = 'Pushed';
          pulledCount++;
        }
      });

      if (pulledCount > 0) {
        await saveSheetData('cms_dispense_log', dispenseData);
        await saveSheetData(currentStorageKey, consumeData);
        triggerRefresh();
        setExtractSyncCount(prev => prev + pulledCount);
        setLastExtractSync(new Date().toLocaleTimeString());
        if (!silent) {
          alert(`Successfully extracted ${pulledCount} records from Dispense Log!`);
        }
        return pulledCount;
      } else {
        if (!silent) {
          alert('No new records to extract from Dispense Log.');
        }
        return 0;
      }
    } catch (e) {
      if (!silent) alert('Error extracting data: ' + e.message);
      return 0;
    } finally {
      isExtractingRef.current = false;
    }
  };

  // --- Flow 3: Sync to Inventory (silent mode for auto) ---
  const handleSyncToInventory = async (silent = false) => {
    if (isSyncingRef.current) return 0;
    isSyncingRef.current = true;
    try {
      const dailyData = await getSheetData(currentStorageKey) || [];
      const stockData = await getStockData();
      const monthlyBalanceData = await getMonthlyBalanceData();

      if (stockData.length === 0) {
        if (!silent) alert('Medicine Stock is empty. Cannot deduct.');
        return 0;
      }

      let updatedCount = 0;
      let missingMeds = [];
      let addedToBalance = 0;

      const monthPrefix = selectedMonth.substring(0, 3).toLowerCase();

      for (const row of dailyData) {
        if (row.medicineName && row.monthlyGrandTotal && parseInt(row.monthlyGrandTotal) > 0 && row.status !== 'Deducted') {
          const consumedQty = Number(row.monthlyGrandTotal);

          let stockItem = null;
          const matchResult = findStockItem(row.medicineName, stockData);
          if (matchResult) {
            if (matchResult.type === 'exact' || matchResult.type === 'partial') {
              stockItem = matchResult.item;
            } else if (matchResult.type === 'ambiguous') {
              if (!silent) {
                const optionsStr = matchResult.items.map((item, idx) => `${idx + 1}. ${item.medicineName}`).join('\n');
                const userInput = prompt(`Ambiguous match for "${row.medicineName}". Please type the number of the correct medicine from stock (or cancel to skip):\n\n${optionsStr}`);
                if (userInput) {
                  const idx = parseInt(userInput) - 1;
                  if (idx >= 0 && idx < matchResult.items.length) {
                    stockItem = matchResult.items[idx];
                  }
                }
              } else {
                stockItem = matchResult.items[0];
              }
            }
          }

          if (stockItem) {
            const cleanStockNameLower = (stockItem.medicineName || '').toLowerCase().trim();
            stockItem.quantity = (Number(stockItem.quantity) || 0) - consumedQty;
            stockItem.lastUpdated = new Date().toISOString().split('T')[0];

            let balanceItem = monthlyBalanceData.find(m => 
              (m.medicineName || '').toLowerCase().trim() === cleanStockNameLower
            );

            if (balanceItem) {
              const outKey = `${monthPrefix}_outgoing`;
              balanceItem[outKey] = (Number(balanceItem[outKey]) || 0) + consumedQty;
            } else {
              const newBalanceRow = {
                id: 'MB-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
                medicineName: stockItem.medicineName || row.medicineName,
                type: row.type || stockItem.category || '',
                expiryDate: stockItem.expiry || '',
                composition: '',
                initialBalance: (Number(stockItem.quantity) + consumedQty),
              };
              newBalanceRow[`${monthPrefix}_outgoing`] = consumedQty;
              monthlyBalanceData.push(newBalanceRow);
              addedToBalance++;
            }

            // Recompute monthly balance running totals
            const balanceItemToRecompute = balanceItem || monthlyBalanceData[monthlyBalanceData.length - 1];
            if (balanceItemToRecompute) {
              const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              let runningBalance = Number(balanceItemToRecompute.initialBalance) || 0;
              let yearlyIncoming = 0;
              let yearlyOutgoing = 0;
              monthsList.forEach(m => {
                const incoming = Number(balanceItemToRecompute[`${m}_incoming`]) || 0;
                const outgoing = Number(balanceItemToRecompute[`${m}_outgoing`]) || 0;
                yearlyIncoming += incoming;
                yearlyOutgoing += outgoing;
                runningBalance = runningBalance + incoming - outgoing;
                balanceItemToRecompute[`${m}_balance`] = runningBalance.toString();
              });
              balanceItemToRecompute.totalIncoming = yearlyIncoming.toString();
              balanceItemToRecompute.totalOutgoing = yearlyOutgoing.toString();
              balanceItemToRecompute.finalBalance = runningBalance.toString();
            }

            row.status = 'Deducted';
            updatedCount++;
          } else {
            missingMeds.push(row.medicineName);
          }
        }
      }

      if (updatedCount > 0) {
        await saveSheetData(currentStorageKey, dailyData);
        await saveSheetData('cms_medstock_data', stockData);
        await saveSheetData('cms_yearly_monthly_balance', monthlyBalanceData);
        triggerRefresh();
        setDeductSyncCount(prev => prev + updatedCount);
        setLastDeductSync(new Date().toLocaleTimeString());
        
        if (!silent) {
          let msg = `✅ Successfully synced ${updatedCount} medicine(s)!\n\n`;
          msg += `📦 Medicine Inventory: Quantities deducted\n`;
          msg += `📊 Monthly Balance: ${selectedMonth} Outgoing updated\n`;
          if (addedToBalance > 0) {
            msg += `➕ ${addedToBalance} new medicine(s) added to Monthly Balance\n`;
          }
          if (missingMeds.length > 0) {
            msg += `\n⚠️ Not found in inventory (skipped):\n- ${[...new Set(missingMeds)].join('\n- ')}`;
          }
          alert(msg);
        }
        return updatedCount;
      } else {
        if (!silent && missingMeds.length > 0) {
          alert(`Could not deduct. The following medicines were not found in the Medicine Stock:\n- ${[...new Set(missingMeds)].join('\n- ')}`);
        } else if (!silent) {
          alert('No pending records found to deduct. Make sure you hit the "Save" button in the grid first!');
        }
        return 0;
      }
    } catch (err) {
      if (!silent) alert('Error syncing data: ' + err.message);
      return 0;
    } finally {
      isSyncingRef.current = false;
    }
  };

  // --- Flow 4: Undo Deduction ---
  const handleUndoDeduction = async () => {
    try {
      const dailyData = await getSheetData(currentStorageKey) || [];
      const stockData = await getStockData();
      const monthlyBalanceData = await getMonthlyBalanceData();

      const deductedRows = dailyData.filter(r => r.status === 'Deducted' && r.medicineName);

      if (deductedRows.length === 0) {
        alert('No deducted medicines found in this month\'s log to undo.');
        return;
      }

      const optionsStr = deductedRows.map((r, idx) => `${idx + 1}. ${r.medicineName} (${r.monthlyGrandTotal} units)`).join('\n');
      const userInput = prompt(`Select medicine to undo deduction (type the number):\n\n${optionsStr}`);

      if (!userInput) return;

      const idx = parseInt(userInput) - 1;
      if (idx < 0 || idx >= deductedRows.length) {
        alert('Invalid selection.');
        return;
      }

      const selectedRow = deductedRows[idx];
      const consumedQty = Number(selectedRow.monthlyGrandTotal) || 0;
      const medNameLower = (selectedRow.medicineName || '').toLowerCase().trim();

      // 1. Restore quantity back to cms_medstock_data
      const stockItem = stockData.find(s => (s.medicineName || '').toLowerCase().trim() === medNameLower);
      if (stockItem) {
        stockItem.quantity = (Number(stockItem.quantity) || 0) + consumedQty;
        stockItem.lastUpdated = new Date().toISOString().split('T')[0];
      }

      // 2. Remove outgoing from cms_yearly_monthly_balance
      const monthPrefix = selectedMonth.substring(0, 3).toLowerCase();
      const balanceItem = monthlyBalanceData.find(m => (m.medicineName || '').toLowerCase().trim() === medNameLower);
      if (balanceItem) {
        const outKey = `${monthPrefix}_outgoing`;
        balanceItem[outKey] = Math.max(0, (Number(balanceItem[outKey]) || 0) - consumedQty);
        
        // Recompute balance row
        const monthsList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let runningBalance = Number(balanceItem.initialBalance) || 0;
        let yearlyIncoming = 0;
        let yearlyOutgoing = 0;
        monthsList.forEach(m => {
          const incoming = Number(balanceItem[`${m}_incoming`]) || 0;
          const outgoing = Number(balanceItem[`${m}_outgoing`]) || 0;
          yearlyIncoming += incoming;
          yearlyOutgoing += outgoing;
          runningBalance = runningBalance + incoming - outgoing;
          balanceItem[`${m}_balance`] = runningBalance.toString();
        });
        balanceItem.totalIncoming = yearlyIncoming.toString();
        balanceItem.totalOutgoing = yearlyOutgoing.toString();
        balanceItem.finalBalance = runningBalance.toString();
      }

      // 3. Reset row status to 'Pending' in DailyConsume
      const targetDailyRow = dailyData.find(r => r.id === selectedRow.id);
      if (targetDailyRow) {
        targetDailyRow.status = 'Pending';
      }

      // Save everything back
      await saveSheetData(currentStorageKey, dailyData);
      await saveSheetData('cms_medstock_data', stockData);
      await saveSheetData('cms_yearly_monthly_balance', monthlyBalanceData);

      triggerRefresh();
      alert(`Successfully reversed deduction for "${selectedRow.medicineName}"! Quantity restored to stock and outgoing removed from ledger.`);
    } catch (e) {
      alert('Error during undo: ' + e.message);
    }
  };

  // Auto-sync: Dispense → Daily Consume (every 10s)
  useEffect(() => {
    if (!autoExtractEnabled) return;
    handleExtractFromDispense(true); // run once on mount
    const interval = setInterval(() => handleExtractFromDispense(true), 10000);
    return () => clearInterval(interval);
  }, [autoExtractEnabled, currentStorageKey]);

  // Auto-sync: Daily Consume → Stock + Monthly Balance (every 15s)
  useEffect(() => {
    if (!autoDeductEnabled) return;
    const interval = setInterval(() => handleSyncToInventory(true), 15000);
    return () => clearInterval(interval);
  }, [autoDeductEnabled, currentStorageKey, selectedMonth]);

  const toggleAutoExtract = () => {
    const newVal = !autoExtractEnabled;
    setAutoExtractEnabled(newVal);
    localStorage.setItem('cms_dc_autoextract', newVal.toString());
  };

  const toggleAutoDeduct = () => {
    const newVal = !autoDeductEnabled;
    setAutoDeductEnabled(newVal);
    localStorage.setItem('cms_dc_autodeduct', newVal.toString());
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 31 }, (_, i) => 2020 + i);

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top action bar - compacted to a single line for full screen grid experience */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '8px', 
        background: 'white', 
        padding: '8px 16px', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontSize: '18px', fontWeight: 700 }}>
            📋 Daily Consume
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#64748b" />
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', cursor: 'pointer', outline: 'none', background: '#eff6ff', fontWeight: 700, color: '#1e40af' }} title="Focus on a specific day to optimize load speed">
              <option value="all">📅 Show Full Month (Slow)</option>
              {daysArray.map(d => <option key={d} value={d}>Day {d}</option>)}
            </select>
          </div>
          {/* Compact Inline Sync Status */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#64748b' }}>
            {lastExtractSync && (
              <span style={{ background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                🔄 Pull: {lastExtractSync}
              </span>
            )}
            {lastDeductSync && (
              <span style={{ background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                📦 Deduct: {lastDeductSync}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Auto-extract toggle */}
          <button
            onClick={toggleAutoExtract}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '4px 8px', borderRadius: '4px', border: 'none',
              background: autoExtractEnabled ? '#059669' : '#94a3b8',
              color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '11px',
              transition: 'all 0.2s'
            }}
            title={autoExtractEnabled ? 'Auto-extract from Dispense is ON' : 'Auto-extract from Dispense is OFF'}
          >
            ⚡ Ext: {autoExtractEnabled ? 'AUTO' : 'OFF'}
          </button>

          {/* Auto-deduct toggle */}
          <button
            onClick={toggleAutoDeduct}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '4px 8px', borderRadius: '4px', border: 'none',
              background: autoDeductEnabled ? '#2563eb' : '#94a3b8',
              color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '11px',
              transition: 'all 0.2s'
            }}
            title={autoDeductEnabled ? 'Auto-deduct from Stock is ON' : 'Auto-deduct from Stock is OFF'}
          >
            📦 Ded: {autoDeductEnabled ? 'AUTO' : 'OFF'}
          </button>

          {/* Manual extract button */}
          <button
            onClick={() => handleExtractFromDispense(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '5px 10px', borderRadius: '4px', border: 'none',
              background: '#8b5cf6', color: 'white', fontWeight: '700', cursor: 'pointer',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title="Manually extract new records from Dispense Log"
          >
            <ArrowDownToLine size={13} />
            Extract
          </button>

          {/* Undo deduction button */}
          <button
            onClick={handleUndoDeduction}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '4px 10px', borderRadius: '4px', border: '1px solid #dc2626',
              background: 'white', color: '#dc2626', fontWeight: '700', cursor: 'pointer',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title="Reverse a previously deducted medicine consumption"
          >
            Undo
          </button>

          {/* Manual sync button */}
          <button
            onClick={() => handleSyncToInventory(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              padding: '5px 10px', borderRadius: '4px', border: 'none',
              background: hasPending ? '#2563eb' : '#94a3b8',
              color: 'white', fontWeight: '700', cursor: hasPending ? 'pointer' : 'not-allowed',
              fontSize: '11px', transition: 'all 0.2s'
            }}
            title={hasPending ? "Deduct pending quantities from Medicine Stock" : "No pending items to sync"}
          >
            <ArrowDownToLine size={13} />
            {hasPending ? 'Sync & Deduct' : 'All Synced'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ExcelGrid 
          key={`${currentStorageKey}_${selectedDay}`}
          title={`Monthly Consumption Log - ${selectedMonth} ${selectedYear}`}
          storageKey={currentStorageKey}
          initialData={initialData}
          columns={columns}
          idPrefix="DC-"
          getRowStyle={getRowStyle}
          computeRow={computeRow}
          refreshTrigger={refreshTrigger}
          filters={[
            { key: 'status', label: 'All Statuses', options: ['Pending', 'Deducted'] }
          ]}
        />
      </div>
    </div>
  );
};

export default DailyConsume;

```

### A.8 src/utils/chatBrain.js
```javascript
// Local AI Knowledge Base & Basic NLP Engine

const knowledgeBase = [
  // --- SMALL TALK & GREETINGS ---
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'evening'],
    response: "Hello! I am your Jindal Steel AI Assistant. I can help you navigate the app, explain clinical workflows, or check drug interactions. What do you need help with?"
  },
  {
    intent: 'identity',
    keywords: ['who are you', 'what are you', 'your name'],
    response: "I am a local, custom-built AI Clinical Assistant trained specifically for the Jindal Steel platform. I do not require an internet connection, and my brain is hardcoded with clinical and app-navigation knowledge!"
  },
  {
    intent: 'thanks',
    keywords: ['thanks', 'thank you', 'appreciate', 'perfect'],
    response: "You're very welcome! Let me know if there's anything else you need."
  },
  {
    intent: 'help',
    keywords: ['help', 'what can you do', 'features', 'options'],
    response: "Here is what I can do for you:\n1. Guide you on how to use the Camera Scanner and Train AI features.\n2. Explain how Dispensing and Inventory tracking works.\n3. Provide standard dosage and interaction data for common medications.\n4. Search our database for patient visits, shift reports, ambulance logs, etc.\nJust ask!"
  },
  {
    intent: 'casual_greetings',
    keywords: ['hyy', 'hiii', 'heya', 'yo', 'namaste', 'sup'],
    response: "Hello there! I am online and fully operational. How can I assist you with the clinic's workflow or data today?"
  },
  {
    intent: 'how_are_you',
    keywords: ['how are you', 'how are you doing', 'how do you do', 'are you okay', 'how r u'],
    response: "I'm operating at 100% efficiency! All systems are nominal. As an AI, I don't feel emotions, but I'm fully prepared to help you manage the clinic, track medicine stock, or pull up health reports. How are *you* doing on your shift?"
  },
  {
    intent: 'what_is_up',
    keywords: ['whats up', 'what is up', 'what are you doing', 'doing what'],
    response: "I'm actively monitoring the local clinical database and waiting for your commands. Need to log a patient visit or check an emergency protocol?"
  },
  {
    intent: 'who_made_you',
    keywords: ['who made you', 'who created you', 'who programmed you', 'your creator'],
    response: "I am a proprietary Local AI Assistant specifically engineered and integrated into the Jindal Steel system to optimize medical administration, safety compliance, and emergency response times."
  },
  {
    intent: 'good_morning',
    keywords: ['good morning', 'morning'],
    response: "Good morning! ☀️ Let's have a safe and productive shift. I recommend checking the **Shift Health Report** from last night and reviewing any pending **Annual Checkups**."
  },
  {
    intent: 'good_evening_night',
    keywords: ['good evening', 'evening', 'good night', 'night', 'sweet dreams'],
    response: "Good evening! 🌙 If you are logging off, make sure your **Shift Handover Notes** are updated. If you're on the night shift, I'm here 24/7 to assist with any late-night emergencies or OPD logs."
  },
  {
    intent: 'praise',
    keywords: ['you are smart', 'good bot', 'great job', 'awesome', 'intelligent', 'brilliant', 'clever'],
    response: "Thank you! I was designed to be highly capable. My goal is to reduce your administrative burden so you can focus on patient care and industrial safety."
  },
  {
    intent: 'bored_tired',
    keywords: ['i am tired', 'exhausted', 'sleepy', 'worked hard', 'i am bored', 'so bored', 'nothing to do'],
    response: "It sounds like you've had a long shift! In an industrial environment, fatigue can lead to safety incidents. Take a micro-break, stay hydrated, and grab a coffee if needed. I'll handle the data entry while you rest."
  },
  {
    intent: 'joke',
    keywords: ['tell me a joke', 'make me laugh', 'funny', 'say something funny'],
    response: "Why did the AI go to the doctor?\nBecause it had a terrible *virus*! 🦠\n\n...I may not have a great sense of humor, but my medical knowledge base is top-notch!"
  },

  // --- NORMAL HUMAN CONVERSATIONS ---
  {
    intent: 'yes_affirmation',
    keywords: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'yup', 'alright', 'fine'],
    response: "Got it! How would you like to proceed?"
  },
  {
    intent: 'no_negation',
    keywords: ['no', 'nope', 'nah', 'nevermind', 'cancel', 'stop'],
    response: "Understood. Let me know if you change your mind or need something else!"
  },
  {
    intent: 'what_is_your_name',
    keywords: ['what is your name', 'what do they call you', 'your name', 'who u', 'tell me your name'],
    response: "I am the Jindal Steel AI Assistant! You can just call me Jindal Steel Assistant. I'm here to help manage your clinic data."
  },
  {
    intent: 'weather',
    keywords: ['what is the weather', 'how is the weather', 'is it raining', 'weather today', 'temperature outside'],
    response: "I'm securely isolated from the outside internet, so I can't check the weather! But I hope it's a safe and pleasant day outside."
  },
  {
    intent: 'how_old_are_you',
    keywords: ['how old are you', 'your age', 'when were you born', 'are you old'],
    response: "I was just recently initialized for this specific clinic! So in human years, I'm quite young—but my medical database has decades of clinical protocols."
  },
  {
    intent: 'goodbye',
    keywords: ['bye', 'goodbye', 'see you', 'catch you later', 'cya', 'adios'],
    response: "Goodbye! Have a safe rest of your day. You can close this chat or wake me up anytime if you need help with the clinical dashboard."
  },
  {
    intent: 'you_are_welcome',
    keywords: ['you are welcome', 'no problem', 'anytime', 'my pleasure', 'ur welcome'],
    response: "Always happy to help! Let's keep the plant safe and healthy."
  },
  {
    intent: 'sorry',
    keywords: ['sorry', 'my bad', 'apologies', 'i am sorry', 'whoops'],
    response: "No worries at all! That's what I'm here for. What shall we do next?"
  },
  {
    intent: 'food',
    keywords: ['have you eaten', 'what did you eat', 'are you hungry', 'food', 'breakfast', 'lunch', 'dinner'],
    response: "I don't eat food, I only consume data! 💻 But make sure you take your meal breaks—occupational health starts with good nutrition!"
  },
  {
    intent: 'love',
    keywords: ['i love you', 'do you love me', 'will you marry me', 'love u'],
    response: "Aww, I appreciate the sentiment! ❤️ As an AI, I don't feel love, but I'm absolutely dedicated to helping you run the best clinic possible."
  },

  // --- APP NAVIGATION & CLINICAL MODULES ---
  {
    intent: 'clinic_info',
    keywords: ['timing', 'hours', 'located', 'where is', 'phone', 'emergency number', 'contact'],
    response: "🏢 **Jindal Steel Plant Clinic Info:**\n- **Location:** Medical Center, Admin Block Gate 2.\n- **Hours:** 24/7/365 (Shift Duty Rotation).\n- **Emergency Hotline:** Ext. 108 or Call +91-98765-43210.\n- **Medical Officers:** Dr. A. K. Sharma (CMO), Dr. R. Sen (Duty Doctor)."
  },
  {
    intent: 'patient_visits_help',
    keywords: ['add patient', 'new patient', 'log patient', 'patient visit', 'patient visits log'],
    response: "📋 **Patient Visit Log Guide:**\nTo log a patient visit:\n1. Click **Patient Visits** in the left sidebar menu.\n2. In the Excel-like grid, scroll to the bottom and click the **Add Row** button.\n3. Double-click cells to enter: Date, Patient Name, Age, Department, Complaint, Diagnosis, and Treatment Given.\n4. You can search patient records or filter by Date, Department, and Doctor using the dropdown filters at the top."
  },
  {
    intent: 'medicine_inventory_help',
    keywords: ['medicine inventory', 'what is medicine inventory', 'stock list', 'drug inventory', 'medicine list'],
    response: "💊 **Medicine Inventory Guide:**\nTo manage drug stock:\n1. Go to **Clinical Records** in the sidebar.\n2. Select the **Medicine Inventory** tab.\n3. It displays details: `Medicine ID | Name | Category | Manufacturer | Stock Qty | Unit | Price/Unit | Expiry Date | Status`.\n4. Critical items to note:\n   - Stock quantities **below 10** highlight in red.\n   - Expiry dates in the past highlight in dark red.\n   - Derived statuses (In Stock, Low Stock, Out of Stock, Expired) update automatically."
  },
  {
    intent: 'vital_signs_help',
    keywords: ['vital signs', 'blood pressure normal', 'normal temperature', 'vitals normal', 'vital sign ranges'],
    response: "❤️ **Vital Signs Reference Ranges (Abnormal values flag in RED):**\n- **Blood Pressure:** Normal: 90/60 to 140/90. High/Low flags in red (systolic > 140 or < 90).\n- **Pulse Rate:** Normal: 60 - 100 bpm. Red flag if < 60 or > 100.\n- **Temperature:** Normal: 96.0°F - 99.5°F. Red flag if > 99.5°F or < 96.0°F.\n- **SpO2:** Normal: 95% - 100%. Red flag if < 95%.\n- **Blood Sugar:** Normal: 70 - 200 mg/dL. Red flag if > 200 or < 70."
  },
  {
    intent: 'ambulance_log_help',
    keywords: ['ambulance', 'emergency dispatch', 'ambulance log', 'emergency response'],
    response: "🚑 **Emergency Ambulance Log:**\nUsed to track plant emergencies and hospital references:\n1. Navigate to **Clinical Records** -> **Emergency** tab.\n2. Click the bright red **🚨 NEW EMERGENCY** button at the top to instantly auto-fill a new row with the current date/time.\n3. Fill in details like Employee ID, Location in Plant, Nature of Emergency (Cardiac, Burns, Fracture, etc.), and status (Dispatched, In Transit, Completed)."
  },
  {
    intent: 'shift_report_help',
    keywords: ['shift report', 'shift log', 'nurse shift', 'shift health', 'duty handover'],
    response: "⏰ **Shift Health Report:**\nThis log tracks clinical visits and incidents per shift (A, B, C, or General):\n1. Select **Shift Report** from the left sidebar.\n2. Enter summary metrics: Patient counts, injury types, referrals, and handover notes.\n3. The bottom bar automatically aggregates totals per column for the selected filter."
  },
  {
    intent: 'ppe_tracker_help',
    keywords: ['ppe compliance', 'helmet', 'safety shoes', 'protective equipment', 'ppe item'],
    response: "🦺 **PPE Compliance Tracker:**\nTracks the issue and maintenance of safety gear:\n1. Go to **Clinical Records** -> **PPE Compliance**.\n2. Track items: Safety Helmet, Shoes, Goggles, Harnesses, Dust Masks, etc.\n3. Rows highlight in red if the **Expiry/Replace Date** has passed or if the item status is marked 'Non-Compliant'."
  },
  {
    intent: 'waste_log_help',
    keywords: ['biomedical waste', 'waste log', 'yellow bag', 'red bag', 'waste rules', 'sharp box'],
    response: "☣️ **Bio-Medical Waste Log (BMW Rules):**\nLocated under **Clinical Records** -> **Bio-Medical Waste** (or general waste log):\n- **Yellow Bag:** Anatomical/Pathological waste.\n- **Red Bag:** Contaminated plastic/tubing.\n- **White Box:** Sharps/Needles (Puncture-proof).\n- **Blue Bag:** Glassware/Ampoules.\nTrack quantities (Kg), manifest numbers, and disposal methods (Incineration, Autoclaving, etc.) to ensure complete environmental compliance."
  },
  {
    intent: 'occupational_disease_help',
    keywords: ['occupational disease', 'silicosis', 'hearing loss', 'work disease', 'occupational health'],
    response: "⚕️ **Occupational Disease Registry:**\nTracks long-term health hazards in industrial plants:\n1. Navigate to **Clinical Records** -> **Occ. Disease**.\n2. Monitor cases of Noise-Induced Hearing Loss (NIHL), Silicosis/Pneumoconiosis, Asbestosis, or Chronic Heat Stress.\n3. Logs exposure duration (years), severity (Mild/Moderate/Severe), treatment status, and whether compensation was filed."
  },
  {
    intent: 'annual_checkup_help',
    keywords: ['annual health', 'yearly checkup', 'medical exam', 'factories act', 'periodic exam'],
    response: "🩺 **Annual & Periodic Health Checkups:**\nTracks statutory medical examinations required by the Factories Act:\n1. Open **Clinical Records** -> **Annual Checkup**.\n2. Logs vision, hearing, spirometry (lungs), blood tests, chest X-rays, and ECGs.\n3. **Visual Alerts:** Highlights rows in yellow if due within 30 days, or red if overdue."
  },
  {
    intent: 'certificates_help',
    keywords: ['health certificate', 'fitness certificate', 'height permit', 'fitness status'],
    response: "📜 **Health Certificate Tracker:**\nTracks statutory clearances and work permits:\n1. Go to **Clinical Records** -> **Health Certs**.\n2. Records: Pre-Employment Fitness, Height Work Permits, Confined Space Entry, Return-to-Work clearances.\n3. Track issue and expiry dates with automatic visual alerts for expiration."
  },
  {
    intent: 'first_aid_help',
    keywords: ['first aid box', 'first aid locations', 'first aid check', 'first aid quantity'],
    response: "🎒 **First Aid Box Tracker:**\nTracks safety equipment distribution across different plant locations:\n1. Go to **First Aid Box** in the left sidebar.\n2. Check sn, location, contact, and check status (Chk1 to Chk5 representing periodic checks).\n3. Keep coordinates and emergency mobile numbers updated for every first aid box in the workshop."
  },
  {
    intent: 'billings_help',
    keywords: ['billings', 'financial', 'price per unit', 'gst', 'billing sheet'],
    response: "💳 **Billings & Financial Records:**\nAccess the **BILLINGS** menu from the left sidebar. It allows managing medicine billing details:\n- Enter base price, packaging unit, and GST %.\n- The grid automatically calculates: Price/Unit and Total Price/Unit including taxes."
  },
  {
    intent: 'mis_report_help',
    keywords: ['mis report', 'monthly summary', 'clinic statistics', 'generate report', 'mis summary'],
    response: "📊 **Monthly MIS Report Dashboard:**\nAccess **MIS Report** from the bottom-left sidebar:\n1. Select the Month and Year from the dropdowns.\n2. View high-level metrics: Total OPD Visits, New Cases, Follow-ups, and Referrals.\n3. Review tables for Injury breakdowns, Medicine consumption, and Department-wise visits.\n4. Type in your Observations/Notes and click **Print** or **Export CSV** to generate reports."
  },
  {
    intent: 'excel_features_help',
    keywords: ['how to edit', 'keyboard shortcuts', 'copy paste', 'save data', 'delete row', 'grid help'],
    response: "⌨️ **Excel-like Grid Keyboard Shortcuts & Features:**\n- **Edit a Cell:** Double-click or press **Enter** on a cell.\n- **Move Around:** Use Arrow keys, **Tab** (move right), or **Shift+Tab** (move left).\n- **Cancel Editing:** Press **Escape**.\n- **Add Row:** Click **Add Row** at the bottom of the table.\n- **Delete Row:** Click the **Delete** (🗑️) button on the right side of the row.\n- **Storage:** All changes save automatically to your browser's local storage in real-time."
  },
  {
    intent: 'opd_reset_help',
    keywords: ['reset opd', 'clear counters', 'reset tally', 'reset counters'],
    response: "📊 **OPD Counter Management:**\nTo manage the OPD counters:\n1. Open **Clinical Records** -> **OPD Tally**.\n2. Click `+` and `-` buttons to log patient arrivals in real-time.\n3. Click the blue **Reset Daily** button to set all counters back to 0 for a new shift."
  },

  // --- APP USAGE / SCOPE ---
  {
    intent: 'use_scanner',
    keywords: ['how to scan', 'use scanner', 'scan medicine', 'camera', 'scanning'],
    response: "To use the scanner:\n1. Click the 'Scan Medicine' tab.\n2. Hold the medication clearly in the camera frame.\n3. Use the floating Zoom slider if the text is too small.\n4. Click 'Capture & Analyze'. The AI will extract the brand, generic name, and lot numbers instantly!"
  },
  {
    intent: 'train_ai',
    keywords: ['train ai', 'teach ai', 'add custom', 'add new medicine', 'teach camera'],
    response: "You can train me by adding new data to the clinical records. I learn passively from your inputs!"
  },
  {
    intent: 'check_interactions',
    keywords: ['check interaction', 'interactions tab', 'how to use interaction', 'drug mix'],
    response: "To check if drugs are safe to combine:\n1. Open the 'Interactions' tab in your left sidebar.\n2. Select 2 or 3 medicines from your active inventory.\n3. Click 'Check Interactions'. The system will simulate a global database check and warn you of any contraindications."
  },
  {
    intent: 'dispensing',
    keywords: ['dispense', 'give medicine', 'patient', 'reduce stock', 'remove stock'],
    response: "Don't just delete inventory when you use it! Use the 'Dispense' tab.\nYou can select a medicine, enter the patient's name and the quantity, and the system will automatically deduct it from your dashboard while logging it in your permanent Dispensing History."
  },
  {
    intent: 'alerts',
    keywords: ['alerts', 'notifications', 'low stock', 'expiry', 'recall', 'red dot'],
    response: "Your dashboard automatically tracks critical issues. Click the Notification Bell at the top right to see active alerts. It will warn you if a medicine drops below 20 units (Low Stock), expires within 60 days, or is flagged for an FDA recall."
  },

  // --- CLINICAL / MEDICAL KNOWLEDGE ---
  {
    intent: 'amoxicillin_dose',
    keywords: ['amoxicillin dose', 'amoxicillin dosage', 'how much amoxicillin'],
    response: "**Amoxicillin Standard Dosage:**\n- **Adults:** 500mg every 8 hours or 875mg every 12 hours for mild to moderate infections.\n- **Severe Infections:** 875mg every 8 hours.\n*Disclaimer: Always adjust for renal impairment and consult specific patient charts.*"
  },
  {
    intent: 'lisinopril_info',
    keywords: ['lisinopril', 'blood pressure meds', 'ace inhibitor'],
    response: "**Lisinopril (ACE Inhibitor):**\nUsed to treat hypertension and heart failure.\n- **Starting Dose:** Typically 10mg once daily.\n- **Side Effects:** Dry cough, dizziness, elevated potassium levels.\n- **Warning:** Do not mix with potassium supplements without strict monitoring."
  },
  {
    intent: 'tylenol_info',
    keywords: ['tylenol', 'acetaminophen', 'paracetamol'],
    response: "**Acetaminophen (Tylenol):**\nAnalgesic and antipyretic.\n- **Standard Dose:** 325mg to 1000mg every 4-6 hours.\n- **Maximum Daily Dose:** STRICTLY do not exceed 4000mg per day to prevent severe hepatotoxicity (liver damage).\n- **Warning:** Be careful of combination cold medicines that also contain acetaminophen."
  },
  {
    intent: 'ibuprofen_info',
    keywords: ['ibuprofen', 'motrin', 'advil', 'nsaid'],
    response: "**Ibuprofen (NSAID):**\nUsed for inflammation, pain, and fever.\n- **Standard Dose:** 200mg to 400mg every 4-6 hours.\n- **Max Dose:** 3200mg per day (prescription level).\n- **Warning:** Take with food to prevent GI bleeding. Avoid combining with blood thinners or other NSAIDs."
  },
  {
    intent: 'interaction_lisinopril_potassium',
    keywords: ['lisinopril and potassium', 'lisinopril mix potassium', 'potassium interaction'],
    response: "🚨 **CRITICAL INTERACTION WARNING:**\nCombining Lisinopril (an ACE inhibitor) with Potassium supplements or potassium-sparing diuretics can lead to **Hyperkalemia** (dangerously high potassium levels in the blood), which can cause fatal cardiac arrhythmias. Strict blood monitoring is required."
  },
  {
    intent: 'interaction_nsaid_bloodthinner',
    keywords: ['ibuprofen and warfarin', 'nsaid and blood thinner', 'advil mix'],
    response: "🚨 **CRITICAL INTERACTION WARNING:**\nCombining NSAIDs (like Ibuprofen) with anticoagulants (like Warfarin or Eliquis) significantly increases the risk of severe gastrointestinal bleeding. This combination should generally be avoided."
  },

  // --- ADVANCED FIRST AID & INDUSTRIAL PROTOCOLS ---
  {
    intent: 'chemical_burn',
    keywords: ['chemical burn', 'acid burn', 'alkali burn', 'chemical spill'],
    response: "🚨 **CHEMICAL BURN PROTOCOL:**\n1. Ensure safety. Wear PPE before helping.\n2. **Immediate Action:** Flush the affected area with copious amounts of clean, running water for at least 15-20 minutes.\n3. Remove contaminated clothing/jewelry while washing.\n4. Do NOT apply any neutralizing agents, creams, or ointments.\n5. Log the incident in the **Emergency Ambulance Log** and immediately transport to the hospital."
  },
  {
    intent: 'heat_stroke',
    keywords: ['heat stroke', 'heat exhaustion', 'fainted from heat', 'collapse heat'],
    response: "🚨 **HEAT STROKE PROTOCOL (Medical Emergency):**\n1. Move the person to a cool, shaded, or air-conditioned area.\n2. Remove excess outer clothing.\n3. Cool the body rapidly: spray with cool water, fan them, and apply ice packs to the neck, armpits, and groin.\n4. If conscious and able to swallow, give cool water or ORS. Do NOT give fluids if unconscious.\n5. Log the incident and dispatch the ambulance immediately."
  },
  {
    intent: 'electric_shock',
    keywords: ['electric shock', 'electrocuted', 'shocked by wire', 'electrical injury'],
    response: "🚨 **ELECTRIC SHOCK PROTOCOL:**\n1. **DO NOT** touch the victim if they are still in contact with the electrical source!\n2. Turn off the power source immediately. If not possible, use a dry, non-conductive object (like wood or plastic) to separate the person from the source.\n3. Check breathing and pulse. If absent, begin CPR immediately.\n4. Check for exit and entry burns. Cover with sterile dressings.\n5. Call the ambulance immediately. Any electrical shock requires hospital observation."
  },
  {
    intent: 'cpr_protocol',
    keywords: ['cpr', 'how to give cpr', 'no pulse', 'not breathing', 'chest compressions'],
    response: "❤️ **CPR (Cardiopulmonary Resuscitation) PROTOCOL:**\n1. Check responsiveness (shout and gently shake).\n2. If no response and no normal breathing, shout for help/ambulance.\n3. **Chest Compressions:** Place the heel of your hand on the center of the chest. Push HARD and FAST (at least 2 inches deep, 100-120 compressions per minute).\n4. Allow full chest recoil between compressions.\n5. If trained, provide 2 rescue breaths after every 30 compressions.\n6. Continue until an AED arrives or EMS takes over."
  },
  {
    intent: 'snake_bite',
    keywords: ['snake bite', 'bitten by snake', 'viper bite', 'cobra bite'],
    response: "🐍 **SNAKE BITE PROTOCOL:**\n1. Keep the victim calm and strictly still to slow the spread of venom.\n2. Immobilize the bitten limb at or below heart level using a splint.\n3. Remove rings, watches, or tight clothing around the bite area.\n4. Do NOT cut the wound, do NOT try to suck out venom, and do NOT apply a tight tourniquet.\n5. Rush to the nearest hospital equipped with Anti-Snake Venom (ASV)."
  },
  {
    intent: 'severe_bleeding',
    keywords: ['severe bleeding', 'bleeding out', 'arterial bleed', 'cut deeply', 'hemorrhage'],
    response: "🩸 **SEVERE BLEEDING (Hemorrhage) PROTOCOL:**\n1. Apply **firm, direct pressure** over the wound with a clean cloth, sterile dressing, or gloved hands.\n2. Maintain pressure constantly for at least 5-10 minutes without peeking.\n3. If blood soaks through, place another pad over the first one—do NOT remove the initial pad.\n4. If bleeding is from a limb and life-threatening, apply a tourniquet 2-3 inches above the wound (not over a joint) and note the time.\n5. Treat for shock (keep warm) and rush to the hospital."
  },
  {
    intent: 'gas_inhalation',
    keywords: ['gas inhalation', 'carbon monoxide', 'toxic gas', 'smoke inhalation', 'gas leak'],
    response: "☠️ **TOXIC GAS INHALATION PROTOCOL:**\n1. **Rescuer Safety First:** Do not enter a confined space or gas area without a Self-Contained Breathing Apparatus (SCBA).\n2. Evacuate the victim to fresh air immediately.\n3. Check airway, breathing, and pulse. Begin CPR if necessary.\n4. Administer 100% High-Flow Oxygen via non-rebreather mask if available.\n5. Dispatch ambulance immediately. Inform receiving hospital of the specific gas type."
  },
  {
    intent: 'crush_injury',
    keywords: ['crush injury', 'crushed by machine', 'trapped under', 'heavy object fell'],
    response: "🏗️ **INDUSTRIAL CRUSH INJURY PROTOCOL:**\n1. If safe, remove the compressing object as quickly as possible (unless it has been >15 mins, in which case medical team removal is preferred to prevent crush syndrome shock).\n2. Control any severe external bleeding with direct pressure or tourniquet.\n3. Immobilize any obvious fractures or suspected spinal injuries.\n4. Administer IV fluids (Normal Saline) early if trained/authorized to prevent acute kidney injury from rhabdomyolysis.\n5. Urgent hospital transfer."
  },
  
  // --- FACTORIES ACT & STATUTORY COMPLIANCE ---
  {
    intent: 'notifiable_diseases',
    keywords: ['notifiable disease', 'statutory disease', 'factory act disease', 'reportable illness'],
    response: "📜 **Factories Act - Notifiable Diseases:**\nUnder the Factories Act, the clinic must report certain occupational diseases to the Chief Inspector of Factories. Common ones include:\n- Silicosis, Pneumoconiosis, Asbestosis\n- Lead, Mercury, or Benzene poisoning\n- Noise-Induced Hearing Loss (NIHL)\n- Toxic jaundice\nTrack these securely in the **Occupational Disease Registry**."
  },
  {
    intent: 'form_21_accident',
    keywords: ['form 21', 'fatal accident', 'major accident reporting', 'accident report form'],
    response: "📝 **Form 21 - Accident Reporting:**\nFor any accident causing death or bodily injury preventing a worker from working for 48 hours or more, the clinic must help prepare data for **Form 21**.\n- Ensure the exact time, nature of injury, and doctor's remarks are accurately logged in the **Injury Report Log**."
  }
];

const fallbackResponses = [
  "I couldn't find a direct match for that question in my knowledge base. Would you like to check the 'Train AI' section to teach me, or specify a patient name / medicine to search our database?",
  "I'm not quite sure how to answer that. You can ask me about medicine dosages, patient visits, stock inventory levels, or try searching for a specific employee ID/name.",
  "I couldn't find that in our records or knowledge base. Try asking something like: 'How many patients visited today?', 'Show stock for paracetamol', or 'What is the dosage for Amoxicillin?'",
  "Hmm, I don't have a pre-programmed answer for that. As a local clinic assistant, I can help search our database. Try typing a keyword like 'ambulance log', 'ppe compliance', or a patient's name."
];

const searchLocalData = (query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !['how', 'what', 'show', 'tell', 'me', 'the', 'is', 'are', 'in', 'of', 'for', 'about'].includes(t));
  if (terms.length === 0) return null;

  let results = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Ignore internal app state, only check clinical tables
    if (key.startsWith('cms_') || key === 'medicines' || key === 'first_aid_records') {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data)) {
          data.forEach(row => {
            const rowStr = JSON.stringify(row).toLowerCase();
            let matches = terms.filter(term => rowStr.includes(term));
            if (matches.length > 0) {
               results.push({
                 table: key.replace('cms_', '').replace(/_/g, ' '),
                 matchScore: matches.length,
                 data: row
               });
            }
          });
        }
      } catch (e) {}
    }
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.matchScore - a.matchScore);
  const topResults = results.slice(0, 3); 

  let responseText = `I scoured your local clinical database and found **${results.length} matching records**. Here are the most relevant ones:\n\n`;
  
  topResults.forEach((res, idx) => {
     responseText += `**Match in ${res.table.toUpperCase()}:**\n`;
     for (const [k, v] of Object.entries(res.data)) {
        if (k !== 'id' && v && typeof v !== 'object') {
           const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
           responseText += `- **${formattedKey}**: ${v}\n`;
        }
     }
     responseText += `\n`;
  });

  return responseText;
};

const handleAggregation = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('how many') || q.includes('total') || q.includes('count') || q.includes('number of')) {
    if (q.includes('patient') || q.includes('visit')) {
      const data = JSON.parse(localStorage.getItem('cms_patient_data') || '[]');
      return `You currently have **${data.length} patient records** logged in the system.`;
    }
    if (q.includes('medicine') || q.includes('stock')) {
      const data = JSON.parse(localStorage.getItem('cms_medicine_stock') || '[]');
      return `You currently have **${data.length} medicines** tracked in your Medicine Stock Register.`;
    }
    if (q.includes('injury') || q.includes('injuries')) {
      const data = JSON.parse(localStorage.getItem('cms_injury_reports') || '[]');
      return `There are **${data.length} injury reports** currently logged.`;
    }
    if (q.includes('employee')) {
      const data = JSON.parse(localStorage.getItem('cms_employee_health') || '[]');
      return `You have health profiles for **${data.length} employees**.`;
    }
    if (q.includes('ambulance') || q.includes('emergency')) {
      const data = JSON.parse(localStorage.getItem('cms_ambulance_log') || '[]');
      return `There are **${data.length} emergency ambulance dispatches** recorded.`;
    }
    
    if (q.includes('opd') || q.includes('daily tally') || q.includes('male') || q.includes('female') || q.includes('child')) {
      const male = parseInt(localStorage.getItem('opd_male')) || 0;
      const female = parseInt(localStorage.getItem('opd_female')) || 0;
      const child = parseInt(localStorage.getItem('opd_child')) || 0;
      const total = male + female + child;
      return `Today's Daily OPD Tally has **${total} total visits** (Male: ${male}, Female: ${female}, Child: ${child}).`;
    }
    
    // General count
    let totalRows = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cms_') || key === 'medicines') {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data)) totalRows += data.length;
        } catch(e){}
      }
    }
    
    // Add OPD to total
    const opdTotal = (parseInt(localStorage.getItem('opd_male')) || 0) + 
                     (parseInt(localStorage.getItem('opd_female')) || 0) + 
                     (parseInt(localStorage.getItem('opd_child')) || 0);
    totalRows += opdTotal;
    
    return `I counted a total of **${totalRows} combined records** (including OPD tallies) across all your clinical databases. Please specify exactly what you want me to count!`;
  }
  return null;
};

const handleShowTable = (query) => {
  const q = query.toLowerCase();
  
  if (!q.includes('show') && !q.includes('list') && !q.includes('get') && !q.includes('give') && !q.includes('extract') && !q.includes('what is in')) return null;

  // Dynamically find all tables in localStorage
  const dynamicSheets = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Ignore non-data keys and internal pointers
    if ((key.startsWith('cms_') || key === 'medicines') && !key.endsWith('_nextid')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data)) {
          // Format a human-readable name from the key (e.g. cms_patient_data -> Patient Data)
          let name = key.replace('cms_', '').replace(/_/g, ' ').replace('data', '').trim();
          name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          dynamicSheets.push({
            storageKey: key,
            name: name || 'Custom Sheet',
            data: data
          });
        }
      } catch (e) {}
    }
  }

  // Pre-mapped names for better matching of known core tables
  const knownAliases = {
    'cms_patient_data': ['patient', 'visit'],
    'cms_medstock_data': ['medicine', 'inventory', 'stock'],
    'cms_injury_data': ['injury', 'injuries'],
    'cms_emp_health_data': ['employee'],
    'cms_ambulance_data': ['ambulance', 'emergency'],
    'cms_shift_data': ['shift'],
    'cms_ppe_data': ['ppe', 'equipment'],
    'cms_vaccine_data': ['vaccine', 'vaccination'],
    'cms_ahc_data': ['annual', 'checkup', 'periodic'],
    'cms_firstaidbox_data': ['first aid', 'box'],
    'cms_bmw_data': ['waste', 'biomedical', 'bmw'],
    'cms_vitals_data': ['vital', 'sign'],
    'cms_health_cert_data': ['certificate', 'clearance'],
    'cms_occ_disease_data': ['disease', 'occupational']
  };

  if (q.includes('all') || q.includes('whole data') || q.includes('entire project')) {
    let totalRows = 0;
    let breakdown = [];
    for (let sheet of dynamicSheets) {
      if (sheet.data.length > 0) {
        totalRows += sheet.data.length;
        breakdown.push(`- **${sheet.name}**: ${sheet.data.length} records`);
      }
    }
    if (totalRows === 0) return "Your entire project database is currently empty!";
    return `Here is a breakdown of the **whole data in your project** (${totalRows} total records):\n\n` + breakdown.join('\n') + `\n\nIf you want to see specific data, ask me to "show the [sheet name] data"!`;
  }

  let targetSheet = null;

  // 1. Try to match by known aliases
  for (let sheet of dynamicSheets) {
    const aliases = knownAliases[sheet.storageKey] || [];
    if (aliases.some(k => q.includes(k))) {
      targetSheet = sheet;
      break;
    }
  }

  // 2. If no known alias match, try to match by the dynamic name or column keys
  if (!targetSheet) {
    // Extract potential table names from query
    for (let sheet of dynamicSheets) {
      const sheetNameWords = sheet.name.toLowerCase().split(' ');
      if (sheetNameWords.some(w => w.length > 2 && q.includes(w))) {
        targetSheet = sheet;
        break;
      }
      
      // Also check if they are asking for a column that exists in this future table
      if (sheet.data.length > 0) {
        const cols = Object.keys(sheet.data[0]).map(k => k.toLowerCase());
        if (cols.some(c => c.length > 3 && q.includes(c))) {
          targetSheet = sheet;
          break;
        }
      }
    }
  }

  if (!targetSheet) return null;

  try {
    const data = targetSheet.data;
    if (data.length === 0) return `The **${targetSheet.name}** sheet is currently empty.`;

    let response = `Here is the live data extracted from your **${targetSheet.name}** sheet:\n\n`;
    
    // Show up to 8 rows to avoid overwhelming the chat UI
    const rowsToShow = data.slice(0, 8); 
    
    rowsToShow.forEach(row => {
      response += `> `;
      let items = [];
      for (const [k, v] of Object.entries(row)) {
        if (k !== 'id' && !k.startsWith('_') && k !== 'serialNumber' && v !== undefined && v !== null && String(v).trim() !== '') {
           const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
           items.push(`**${formattedKey}**: ${v}`);
        }
      }
      response += items.join(' | ') + `\n\n`;
    });

    if (data.length > 8) {
      response += `*...and ${data.length - 8} more hidden records. Open the sheet directly to see all of them.*`;
    }
    
    return response;
  } catch (e) {
    return `I encountered an error trying to read the data.`;
  }
};

export const processChatMessage = (userInput) => {
  const normalizedInput = userInput.toLowerCase().replace(/[^\w\s]/gi, '');
  const tokens = normalizedInput.split(/\s+/);
  
  // 1. Check for basic hardcoded knowledge base
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += keyword.split(' ').length * 2; 
      } else {
        const keywordTokens = keyword.split(' ');
        let matches = 0;
        keywordTokens.forEach(kt => {
          if (tokens.includes(kt)) matches++;
        });
        if (matches === keywordTokens.length) {
          score += matches;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore >= 1) {
    return bestMatch.response;
  }

  // 2. Data Extraction: Try to count aggregations first
  const aggResponse = handleAggregation(userInput);
  if (aggResponse) return aggResponse;

  // 3. Data Extraction: Try to dump specific sheet data
  const showTableResponse = handleShowTable(userInput);
  if (showTableResponse) return showTableResponse;

  // 4. Data Extraction: Try deep searching the database
  // If the user uses a trigger word like "find", "search", "show", "extract", "get", or specific names
  const searchResponse = searchLocalData(userInput);
  if (searchResponse) return searchResponse;

  // 4. Fallback
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

```

### A.9 src/components/GlobalSearch.jsx
```javascript
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

```

