import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import InjuryReportLog from './InjuryReportLog';
import VitalSignsChart from './VitalSignsChart';
import EmployeeHealthRecords from './EmployeeHealthRecords';
import AnnualHealthCheckup from './AnnualHealthCheckup';
import EmergencyAmbulanceLog from './EmergencyAmbulanceLog';
import OccupationalDiseaseRegistry from './OccupationalDiseaseRegistry';
import FirstAidBoxTracker from './FirstAidBoxTracker';
import PatientVisitLog from './PatientVisitLog';
import HealthCertificateTracker from './HealthCertificateTracker';

const tabs = [
  { id: 'injury', label: 'Injury Reports', icon: '🚨' },
  { id: 'vitals', label: 'Vital Signs', icon: '❤️' },
  { id: 'employee', label: 'Employee Health', icon: '👷' },
  { id: 'checkup', label: 'Annual Checkup', icon: '🩺' },
  { id: 'disease', label: 'Occ. Disease', icon: '⚕️' },
  { id: 'ambulance', label: 'Emergency', icon: '🚑' },
  { id: 'firstaidbox', label: 'First Aid Box', icon: '📦' },
  { id: 'patientvisit', label: 'Patient Visits', icon: '📝' },
  { id: 'certificate', label: 'Fitness Certs', icon: '📜' }
];

const ClinicalRecords = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('cms_active_clinical_tab') || 'injury';
  });

  React.useEffect(() => {
    localStorage.setItem('cms_active_clinical_tab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Cycle Tabs with Alt+Up/Down
      if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        setActiveTab(current => {
          const idx = tabs.findIndex(t => t.id === current);
          if (idx === -1) return tabs[0].id;
          if (e.key === 'ArrowDown') {
            return tabs[(idx + 1) % tabs.length].id;
          } else {
            return tabs[(idx - 1 + tabs.length) % tabs.length].id;
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderSheet = () => {
    switch (activeTab) {
      case 'injury': return <InjuryReportLog />;
      case 'vitals': return <VitalSignsChart />;
      case 'employee': return <EmployeeHealthRecords />;
      case 'checkup': return <AnnualHealthCheckup />;
      case 'disease': return <OccupationalDiseaseRegistry />;
      case 'ambulance': return <EmergencyAmbulanceLog />;
      case 'firstaidbox': return <FirstAidBoxTracker />;
      case 'patientvisit': return <PatientVisitLog />;
      case 'certificate': return <HealthCertificateTracker />;
      default: return <InjuryReportLog />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ClipboardList size={22} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Clinical Records Management</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
            Multi-module Excel-like interface for clinic log registers
          </p>
        </div>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'flex', gap: '12px', flex: 1, overflow: 'hidden' }}>
        {/* Left Side Tab Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '180px',
          flexShrink: 0,
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          overflowY: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 12px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                fontFamily: 'Inter, sans-serif',
                background: activeTab === tab.id ? '#1e40af' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === tab.id ? '0 2px 4px rgba(30,64,175,0.15)' : 'none',
              }}
              onMouseOver={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#1e3a5f';
                }
              }}
              onMouseOut={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Side Sheet Content */}
        <div style={{
          flex: 1,
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {renderSheet()}
        </div>
      </div>
    </div>
  );
};

export default ClinicalRecords;
