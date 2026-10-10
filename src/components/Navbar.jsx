import React, { useState } from 'react';
import { LayoutDashboard, Stethoscope, ShieldAlert, FileSpreadsheet, ClipboardList, BriefcaseMedical, Clock, Users, TrendingUp, Package, ChevronLeft, ChevronRight, Activity, Calculator, Keyboard, Shield, Search, Maximize, Minimize, FileBarChart2, FilePlus2, X, Wrench, FileText } from 'lucide-react';
const JindalLogo = ({ collapsed }) => (
  <svg 
    width={collapsed ? "48px" : "112px"} 
    height={collapsed ? "25px" : "60px"} 
    viewBox="0 0 594 316" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', margin: 'auto', transition: 'all 0.3s ease' }}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M383.5 125.1C372.8 152.9 389.6 139.4 443.9 107.8C493.4 79.1 524.7 57.6 540.1 28.4C542.3 76 517.2 102.7 427.9 157.6C374.1 190.7 355.1 197.7 360.7 177.2C363.9 165.5 366.6 157.5 369.1 150.3C369.3 149.9 369 150.7 369.1 150.3C376.5 137.1 379.2 133.1 383.5 125.1Z" fill="#58AB40"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M341.8 88.7C350.8 85.8 362.9 83 374.8 80.3C408 72.9 396.6 98.5 383.3 125.6C379.2 134 376.5 137.1 369.2 150.3C374.4 134.1 380.5 125 368.5 127C356.1 129 342.6 132.9 331.8 136.3L341.8 88.7Z" fill="#F58220"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M293.9 228.5C290.4 227.1 286.7 226.3 283 226.3C275.5 226.3 268 231 268 239.3C268 251.9 283.5 250.3 283.5 259.6C283.5 263.4 280.6 267.7 273.7 267.7C270.5 267.7 266.8 266.5 264.1 264.8L262 270.8C265.7 272.2 269.4 273.4 274.7 273.4C285.6 273.4 290.4 265.6 290.4 258.8C290.4 246.9 274.9 246.8 274.9 239.2C274.9 233.8 279.6 232.1 283.9 232.1C287.4 232.1 290 233 292.2 234.3L293.9 228.5Z" fill="var(--text-main, #0f172a)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M334.1 227.1H299.3L298.1 232.9H312.2L303.7 272.6H310.2L318.8 232.9H332.9L334.1 227.1Z" fill="var(--text-main, #0f172a)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M330.7 272.6H356.4L357.6 266.9H338.6L341.9 251.9H358.9L360.1 246.1H343.2L346.1 232.9H364.1L365.4 227.1H340.7L330.7 272.6Z" fill="var(--text-main, #0f172a)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M366.7 272.6H392.3L393.6 266.9H374.5L377.8 251.9H394.9L396 246.1H379.1L382 232.9H400L401.3 227.1H376.6L366.7 272.6Z" fill="var(--text-main, #0f172a)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M402.3 272.6H427.9L429 266.9H410.2L418.8 227.1H412.2L402.3 272.6Z" fill="var(--text-main, #0f172a)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M114 210L125.8 153.6H141.1L164.6 184.1H165L171.4 153.6H188.3L176.4 210H160.5L137.3 180.3H137.1L130.8 210H114Z" fill="var(--text-muted, #64748b)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M186.8 210L198.6 153.6H228.4C246.9 153.6 256.4 165.1 252.6 183.3C248.3 203.9 233.3 210 212.8 210H186.8ZM215.3 166.2L208.7 197.3H211.8C224.8 197.3 230.4 193.5 232.8 182C235.3 170 230 166.2 218.3 166.2H215.3Z" fill="var(--text-muted, #64748b)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M244 210L281.8 153.6H302.6L312.8 210H291.4L286.5 175.6L286.3 175.5L264.9 210H244Z" fill="var(--text-muted, #64748b)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M316 210L327.9 153.6H347.3L338 197.3H360.7L358.1 210H316Z" fill="var(--text-muted, #64748b)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M84.2998 210L96.1998 153.6H115.5L103.6 210H84.2998Z" fill="var(--text-muted, #64748b)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24.5998 205.4C52.5998 211.4 54.6998 196 56.4998 188.5C58.2998 181 66.9998 139.6 66.9998 139.6H88.7998C88.7998 139.6 82.9998 167 77.7998 191.8C73.9998 209.1 60.7998 222.1 37.3998 220.5C30.4998 220 24.7998 217.7 22.0998 215.6C22.0998 215.6 20.4998 214.5 20.2998 214.3L22.9998 205C23.1998 205.1 24.1998 205.3 24.5998 205.4Z" fill="var(--text-muted, #64748b)"/>
  </svg>
);

const Navbar = ({ currentView, setCurrentView, onOpenSearch, sidebarState, setSidebarState }) => {
  const collapsed = sidebarState === 'collapsed';
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'opdcard', icon: FileText, label: 'OPD Card Form' },
    { id: 'opd', icon: Activity, label: 'OPD' },
    { id: 'dispense', icon: Stethoscope, label: 'Dispense' },
    { id: 'medconsume', icon: Clock, label: 'Medicine Consume' },
    { id: 'injury', icon: ShieldAlert, label: 'Injury Reports' },
    { id: 'firstaid', icon: FileSpreadsheet, label: 'BILLINGS' },
    { id: 'clinical', icon: ClipboardList, label: 'Clinical Records' },

    { divider: true },
    { id: 'customsheets', icon: FilePlus2, label: '+ New Sheet' },
    { id: 'patient', icon: Users, label: 'Medicine Incoming' },
    { id: 'inventory', icon: Package, label: 'Medicine Inventory' },
    { id: 'shift', icon: Clock, label: 'Daily Consume' },
    { id: 'monthlybalance', icon: FileBarChart2, label: 'Monthly Balance' },
    { id: 'mis', icon: TrendingUp, label: 'MIS Report' },
    
    { divider: true },
    { id: 'shortcuts', icon: Keyboard, label: 'Excel Shortcuts' },
    { id: 'backup', icon: Shield, label: 'Backup & Restore' },
    { id: 'systemhealth', icon: Wrench, label: 'System Health' }
  ];

  return (
    <nav className={`navbar-container ${sidebarState}`}>
      <div className="nav-brand" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '1rem 0.5rem' : '0.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
          <JindalLogo collapsed={collapsed} />
        </div>
      </div>
      
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <button 
          onClick={onOpenSearch}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 12px', borderRadius: '8px', color: '#cbd5e1', cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          title="Global Search (Ctrl+K)"
        >
          <Search size={18} />
          {!collapsed && <span style={{ fontSize: '14px', flex: 1, textAlign: 'left' }}>Search...</span>}
          {!collapsed && <kbd style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+K</kbd>}
        </button>
      </div>

      <div className="nav-links">
        {navItems.map((item, idx) => {
          if (item.divider) {
            return <div key={`div-${idx}`} style={{ height: '1px', width: '100%', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }}></div>;
          }
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button 
              key={item.id}
              className={`btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarState(sidebarState === 'expanded' ? 'collapsed' : 'expanded')} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }} 
          title="Toggle Sidebar Collapse"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarState('hidden')} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }} 
          title="Hide Sidebar Completely"
        >
          <X size={20} />
        </button>
        <button 
          className="sidebar-toggle" 
          onClick={toggleFullscreen} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }} 
          title="Toggle Global Full Screen"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
