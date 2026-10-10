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
import { runGlobalBackgroundSync } from './utils/backgroundSync';
import './index.css'; // Make sure global CSS is imported

const viewsList = [
  'dashboard', 'inventory', 'monthlybalance', 'injury', 'clinical', 'opdcounter', 'opd', 'opdcard', 'dispense', 
  'medconsume', 'patient', 'shift', 'firstaidbox', 'firstaid', 'mis', 'shortcuts', 'backup'
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

  // Global background sync for extraction and stock deduction when not on the Daily Consume view
  React.useEffect(() => {
    if (currentView === 'shift' || currentView === 'medconsume') return;
    
    runGlobalBackgroundSync();

    const interval = setInterval(() => {
      runGlobalBackgroundSync();
    }, 20000); // run every 20 seconds

    return () => clearInterval(interval);
  }, [currentView]);

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
          {currentView === 'shift' && <DailyConsume title="Daily Consume" />}
          {currentView === 'medconsume' && <DailyConsume title="Medicine Consume" />}
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
