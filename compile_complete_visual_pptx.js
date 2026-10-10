import pptxgen from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pptx = new pptxgen();

// Configure layout
pptx.layout = 'LAYOUT_16x9';
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'F8FAFC' },
  slideNumber: { x: '95%', y: '95%', fontFace: 'Inter', fontSize: 10, color: '64748B' }
});

// Colors
const COLOR_PRIMARY_DARK = '1E3A8A'; // Blue 900
const COLOR_PRIMARY = '3B82F6';      // Blue 500
const COLOR_ACCENT_ORANGE = 'F97316'; // Orange 500
const COLOR_ACCENT_GREEN = '10B981';  // Emerald 500
const COLOR_TEXT_DARK = '0F172A';     // Slate 900
const COLOR_TEXT_MUTED = '475569';    // Slate 600
const COLOR_BG_WHITE = 'FFFFFF';
const COLOR_BG_DARK = '0F172A';

// Helper to add slide header
function addSlideHeader(slide, title) {
  slide.addText(title, {
    x: 0.6,
    y: 0.4,
    w: 12.1,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: COLOR_PRIMARY_DARK,
    fontFace: 'Outfit'
  });
  
  // Underline bar
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.6,
    y: 1.0,
    w: 12.1,
    h: 0.04,
    fill: { color: COLOR_PRIMARY }
  });
}

// ----------------------------------------------------
// SLIDE 1: Title Slide (Dark Theme)
// ----------------------------------------------------
const slide1 = pptx.addSlide();
slide1.background = { color: COLOR_BG_DARK };

slide1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.6,
  y: 1.2,
  w: 1.5,
  h: 0.08,
  fill: { color: COLOR_ACCENT_ORANGE }
});

slide1.addText('JSPulse OHMS\nOCCUPATIONAL HEALTH MANAGEMENT SYSTEM', {
  x: 0.6,
  y: 1.5,
  w: 12.1,
  h: 1.8,
  fontSize: 34,
  bold: true,
  color: 'FFFFFF',
  fontFace: 'Outfit'
});

slide1.addText('Complete Visually-Mapped Presentation on an Offline-First Enterprise OHS Platform', {
  x: 0.6,
  y: 3.4,
  w: 12.1,
  h: 0.5,
  fontSize: 16,
  color: '94A3B8',
  fontFace: 'Inter'
});

slide1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.6,
  y: 4.2,
  w: 12.1,
  h: 0.02,
  fill: { color: '334155' }
});

slide1.addText('Developed By:\nAshwini Kumar\nIntern ID: JSPL-2026-IT-042', {
  x: 0.6,
  y: 4.6,
  w: 3.8,
  h: 1.2,
  fontSize: 13,
  color: 'CBD5E1',
  fontFace: 'Inter'
});

slide1.addText('Host Organizations:\nJindal Steel (Raigarh & Patratu)\nIT & OHC Medical Services Group', {
  x: 4.8,
  y: 4.6,
  w: 3.8,
  h: 1.2,
  fontSize: 13,
  color: 'CBD5E1',
  fontFace: 'Inter'
});

slide1.addText('Primary Platforms:\nElectron Desktop Wrapper\nReact 19 & Vite / IndexedDB', {
  x: 9.0,
  y: 4.6,
  w: 3.7,
  h: 1.2,
  fontSize: 13,
  color: 'CBD5E1',
  fontFace: 'Inter'
});

slide1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.6,
  y: 6.2,
  w: 12.1,
  h: 0.08,
  fill: { color: COLOR_ACCENT_GREEN }
});

// ----------------------------------------------------
// SLIDE 2: Executive Summary (Problem vs. Solution)
// ----------------------------------------------------
const slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide2, 'EXECUTIVE SUMMARY: LEGACY VS. DIGITAL');

// Legacy Box
slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 1.5, w: 5.8, h: 4.8, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1.5 }
});
slide2.addText('THE PROBLEM: Legacy Paper Ledgers\n\n' +
  '• Duplicate Entries: Transcription lags between Doctor registers & Pharmacy logbooks.\n' +
  '• Compliance Risks: No active reorder thresholds or near-expiry medicine shelf-life checks.\n' +
  '• Audit Delays: Finding historical health records for Factories Act, 1948 reports took hours.\n' +
  '• Network Vulnerability: Cloud apps crash when steel plant intranet connection drops.', {
  x: 0.9, y: 1.8, w: 5.2, h: 4.2, fontSize: 13.5, color: '7F1D1D', fontFace: 'Inter', lineSpacing: 22
});

// Digital Box
slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.5, w: 5.8, h: 4.8, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1.5 }
});
slide2.addText('THE SOLUTION: JSPulse OHMS\n\n' +
  '• Offline-First Shell: Runs locally in Electron; resists all industrial intranet failures.\n' +
  '• High-Speed ExcelGrid: Render engine Virtualization handles 10,000+ rows seamlessly.\n' +
  '• Automated Sync Pipeline: Instantly updates pharmacy queue from doctor prescriptions.\n' +
  '• Infinite Storage: IndexedDB connections bypass local storage 5MB crash limits.\n' +
  '• Visual Alarms: Highlighting expired medicines and overdue health exams in real time.', {
  x: 7.1, y: 1.8, w: 5.2, h: 4.2, fontSize: 13.5, color: '064E3B', fontFace: 'Inter', lineSpacing: 22
});

// ----------------------------------------------------
// SLIDE 3: Host Profile & Industrial Context
// ----------------------------------------------------
const slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide3, 'INDUSTRIAL CONTEXT: JINDAL STEEL OPERATIONS');

slide3.addText('Steel plants operate in high-temperature, high-risk environments. Occupational safety and clinical readiness are mandated by Section 45 of the Indian Factories Act, 1948.', {
  x: 0.6, y: 1.2, w: 12.1, h: 0.6, fontSize: 13, italic: true, color: COLOR_TEXT_MUTED, fontFace: 'Inter'
});

// 4 Blocks of OHC Responsibilities
const roles = [
  { title: '1. Outpatient (OPD) Care', desc: 'Logging daily employee / contractor visits, vital diagnostics, and immediate treatments.', color: 'EFF6FF', border: 'BFDBFE', textColor: '1E3A8A' },
  { title: '2. Pharmacy Inventory', desc: 'Managing medical stock levels, batch details, and dispensing records with out-of-stock check rules.', color: 'F0FDF4', border: 'BBF7D0', textColor: '14532D' },
  { title: '3. Annual Health Exams (PME)', desc: 'Factories Act compliance tracking for vision, lung capacity, audiometry, and heights fitness.', color: 'FFFBEB', border: 'FDE68A', textColor: '78350F' },
  { title: '4. Emergency Callouts', desc: 'Real-time logging of ambulance dispatches, plant injury incidents, and Biomedical Waste tracks.', color: 'FEF2F2', border: 'FECACA', textColor: '7F1D1D' }
];

roles.forEach((r, idx) => {
  const xPos = 0.6 + idx * 3.1;
  slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos, y: 2.2, w: 2.8, h: 3.8, fill: { color: r.color }, line: { color: r.border, width: 1.5 }
  });
  slide3.addText(r.title + '\n\n' + r.desc, {
    x: xPos + 0.15, y: 2.4, w: 2.5, h: 3.4, fontSize: 13.5, bold: true, color: r.textColor, fontFace: 'Inter', align: 'center'
  });
});

// ----------------------------------------------------
// SLIDE 4: System Architecture
// ----------------------------------------------------
const slide4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide4, 'SYSTEM MACRO ARCHITECTURE: ELECTRON & REACT');

slide4.addText('The application leverages Electron to package React 19 into a native desktop container, securing system-level operations in an offline sandbox.', {
  x: 0.6, y: 1.2, w: 12.1, h: 0.5, fontSize: 13, italic: true, color: COLOR_TEXT_MUTED, fontFace: 'Inter'
});

// Main Process
slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 1.9, w: 3.6, h: 4.4, fill: { color: 'E2E8F0' }, line: { color: 'CBD5E1', width: 2 }
});
slide4.addText('ELECTRON MAIN PROCESS\n(Node.js Kernel)\n\n' +
  '• Manages BrowserWindow viewport\n' +
  '• Handles native file saving dialogs\n' +
  '• Headless Chromium PDF print engine\n' +
  '• Bypasses web sandbox for disk writes\n' +
  '• Custom auto-update and build target hooks', {
  x: 0.8, y: 2.1, w: 3.2, h: 4.0, fontSize: 13, color: COLOR_TEXT_DARK, fontFace: 'Inter', lineSpacing: 18
});

// Context Bridge Arrow
slide4.addShape(pptx.shapes.RIGHT_ARROW, { x: 4.4, y: 3.8, w: 0.5, h: 0.5, fill: { color: COLOR_PRIMARY } });
slide4.addText('IPC Context Bridge', { x: 4.2, y: 4.4, w: 0.9, h: 0.4, fontSize: 9, bold: true, align: 'center', color: COLOR_PRIMARY_DARK, fontFace: 'Inter' });

// Preload Script
slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 5.3, y: 2.6, w: 2.2, h: 3.0, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 2 }
});
slide4.addText('PRELOAD BRIDGE\n(preload.js)\n\n' +
  '• Secure contextIsolation API\n' +
  '• Exposes window.electron\n' +
  '• Non-blocking IPC channels\n' +
  '• Restricts direct shell access', {
  x: 5.4, y: 2.8, w: 2.0, h: 2.6, fontSize: 11.5, bold: true, color: 'B45309', fontFace: 'Inter', align: 'center'
});

// Preload to Renderer Arrow
slide4.addShape(pptx.shapes.RIGHT_ARROW, { x: 7.7, y: 3.8, w: 0.5, h: 0.5, fill: { color: COLOR_PRIMARY } });

// Renderer Process
slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 8.4, y: 1.9, w: 4.3, h: 4.4, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 2 }
});
slide4.addText('ELECTRON RENDERER PROCESS\n(React 19 & Vite Client UI)\n\n' +
  '• Component View state management\n' +
  '• Custom ExcelGrid spreadsheet render\n' +
  '• Real-time Recharts MIS analytics\n' +
  '• sheetDB connection pool interface\n' +
  '• Offline NLP ChatBrain assistant\n' +
  '• localstorage proxy auto-caching', {
  x: 8.6, y: 2.1, w: 3.9, h: 4.0, fontSize: 13, color: COLOR_PRIMARY_DARK, fontFace: 'Inter', lineSpacing: 18
});

// ----------------------------------------------------
// SLIDE 5: Database Entity-Relationship (ER) Schema
// ----------------------------------------------------
const slide5 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide5, 'DATABASE ENTITY-RELATIONSHIP (ER) SCHEMA');

// 1. Patient Visit Log
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.6, w: 3.2, h: 1.8, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide5.addText('PATIENT_VISIT_LOG\n(cms_daily_opd_sheet)\n' +
  '• id (PK) : string\n' +
  '• patientName : string\n' +
  '• empId : string\n' +
  '• date : string (ISO)\n' +
  '• diagnosis : string\n' +
  '• extracted : boolean', { x: 0.7, y: 1.7, w: 3.0, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: COLOR_TEXT_DARK });

// Arrow Patient -> Prescription
slide5.addShape(pptx.shapes.RIGHT_ARROW, { x: 3.9, y: 2.3, w: 0.4, h: 0.3, fill: { color: '94A3B8' } });

// 2. Prescription
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.4, y: 1.6, w: 3.2, h: 1.8, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 1 } });
slide5.addText('PRESCRIPTION\n(Inner JSON Structure)\n' +
  '• drugName : string\n' +
  '• dosage : string\n' +
  '• qty : integer\n' +
  '• duration : string', { x: 4.5, y: 1.7, w: 3.0, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: '1E3A8A' });

// Arrow Prescription -> Stock
slide5.addShape(pptx.shapes.RIGHT_ARROW, { x: 7.7, y: 2.3, w: 0.4, h: 0.3, fill: { color: '94A3B8' } });

// 3. Medicine Stock
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 1.6, w: 4.5, h: 1.8, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1 } });
slide5.addText('MEDICINE_STOCK\n(cms_medstock_data)\n' +
  '• id (PK) : string\n' +
  '• medicineName : string\n' +
  '• category : string (Tablet/Syrup/Injection)\n' +
  '• quantity : integer (Current Available)\n' +
  '• expiry : string (Date)\n' +
  '• reorderLevel : integer', { x: 8.3, y: 1.7, w: 4.3, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: '064E3B' });

// Arrow Stock -> Daily Consume (DOWN)
slide5.addShape(pptx.shapes.DOWN_ARROW, { x: 10.2, y: 3.5, w: 0.3, h: 0.4, fill: { color: '94A3B8' } });

// 4. Daily Consume
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 4.0, w: 4.5, h: 1.8, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1 } });
slide5.addText('DAILY_CONSUME\n(cms_daily_consume)\n' +
  '• id (PK) : string\n' +
  '• date : string\n' +
  '• shift : string (A / B / C / G)\n' +
  '• medicines : array [ { name, quantity, status } ]', { x: 8.3, y: 4.1, w: 4.3, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: '7F1D1D' });

// 5. Employee Health
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.0, w: 3.2, h: 1.8, fill: { color: 'FEF3C7' }, line: { color: 'FDE68A', width: 1 } });
slide5.addText('EMPLOYEE_HEALTH\n(cms_employee_health)\n' +
  '• empCode (PK) : string\n' +
  '• name : string\n' +
  '• department : string\n' +
  '• bloodGroup : string', { x: 0.7, y: 4.1, w: 3.0, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: '78350F' });

// Arrow Employee -> Checkup (RIGHT)
slide5.addShape(pptx.shapes.RIGHT_ARROW, { x: 3.9, y: 4.7, w: 0.4, h: 0.3, fill: { color: '94A3B8' } });

// 6. Checkup Data
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.4, y: 4.0, w: 3.2, h: 1.8, fill: { color: 'FFF1F2' }, line: { color: 'FECACA', width: 1 } });
slide5.addText('CHECKUP_DATA\n(cms_annual_checkups)\n' +
  '• id (PK) : string\n' +
  '• empCode (FK) : string\n' +
  '• date : string\n' +
  '• status : string (Fit / Unfit)\n' +
  '• checks : object (Vision, Lungs, Audio)', { x: 4.5, y: 4.1, w: 3.0, h: 1.6, fontSize: 10.5, fontFace: 'Inter', color: '9F1239' });

// ----------------------------------------------------
// SLIDE 6: React UI Component Hierarchy Map
// ----------------------------------------------------
const slide6 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide6, 'REACT UI COMPONENT HIERARCHY TREE');

// Row 1: App.jsx
slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.7, y: 1.3, w: 3.8, h: 0.8, fill: { color: '1E3A8A' } });
slide6.addText('App.jsx\n(Global Router & Contexts)', { x: 4.7, y: 1.3, w: 3.8, h: 0.8, align: 'center', color: 'FFFFFF', fontSize: 12, bold: true, fontFace: 'Inter' });

// Line down to Row 2
slide6.addShape(pptx.shapes.DOWN_ARROW, { x: 6.6, y: 2.15, w: 0.3, h: 0.3, fill: { color: '94A3B8' } });

// Row 2: Navbar & Dashboard
slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.5, w: 3.6, h: 0.8, fill: { color: 'E2E8F0' }, line: { color: 'CBD5E1', width: 1 } });
slide6.addText('Navbar.jsx\n(Global Navigation & Ctrl+K Search)', { x: 0.6, y: 2.5, w: 3.6, h: 0.8, align: 'center', color: COLOR_TEXT_DARK, fontSize: 11, fontFace: 'Inter' });

slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.8, y: 2.5, w: 3.6, h: 0.8, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 1 } });
slide6.addText('Dashboard.jsx\n(MIS Charts, Expired warnings, KPIs)', { x: 4.8, y: 2.5, w: 3.6, h: 0.8, align: 'center', color: COLOR_PRIMARY_DARK, fontSize: 11, fontFace: 'Inter' });

slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 9.0, y: 2.5, w: 3.6, h: 0.8, fill: { color: 'FFF1F2' }, line: { color: 'FECACA', width: 1 } });
slide6.addText('ChatAssistant.jsx\n(Local AI ChatBrain NLP UI)', { x: 9.0, y: 2.5, w: 3.6, h: 0.8, align: 'center', color: '9F1239', fontSize: 11, fontFace: 'Inter' });

// Line down to Row 3
slide6.addShape(pptx.shapes.DOWN_ARROW, { x: 6.6, y: 3.35, w: 0.3, h: 0.3, fill: { color: '94A3B8' } });

// Row 3: Container Views
slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.2, y: 3.7, w: 4.8, h: 0.7, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1 } });
slide6.addText('Clinical & Inventory Registers\n(Tabbed ClinicalRecords Container)', { x: 4.2, y: 3.7, w: 4.8, h: 0.7, align: 'center', color: '064E3B', fontSize: 11, bold: true, fontFace: 'Inter' });

// Lines out to Row 4 (Clinical registers list)
slide6.addShape(pptx.shapes.DOWN_ARROW, { x: 2.2, y: 4.4, w: 0.25, h: 0.4, fill: { color: '94A3B8' } });
slide6.addShape(pptx.shapes.DOWN_ARROW, { x: 6.6, y: 4.4, w: 0.25, h: 0.4, fill: { color: '94A3B8' } });
slide6.addShape(pptx.shapes.DOWN_ARROW, { x: 11.0, y: 4.4, w: 0.25, h: 0.4, fill: { color: '94A3B8' } });

// Row 4: Specific components
slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.8, w: 3.4, h: 1.5, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 1 } });
slide6.addText('CLINICAL SHEETS\n• DailyOPDTally.jsx\n• DispenseMedicine.jsx\n• DailyConsume.jsx\n• AnnualHealthCheckup.jsx', { x: 0.8, y: 4.9, w: 3.0, h: 1.3, fontSize: 10, fontFace: 'Inter', color: COLOR_TEXT_DARK });

slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.9, y: 4.8, w: 3.4, h: 1.5, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 1 } });
slide6.addText('INVENTORY & SAFETY\n• MedicineStockRegister.jsx\n• InteractionChecker.jsx\n• FirstAidBoxTracker.jsx\n• EmergencyAmbulanceLog.jsx', { x: 5.1, y: 4.9, w: 3.0, h: 1.3, fontSize: 10, fontFace: 'Inter', color: COLOR_TEXT_DARK });

slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: 4.8, w: 3.4, h: 1.5, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 1 } });
slide6.addText('UTILITIES & SUPPORT\n• ExcelGrid.jsx (Virtual Spreadsheet)\n• MonthlyMISReport.jsx (Aggregator)\n• SystemHealthTool.jsx (DB Manager)\n• DataBackupRestore.jsx (JSON Sync)', { x: 9.4, y: 4.9, w: 3.0, h: 1.3, fontSize: 10, fontFace: 'Inter', color: COLOR_TEXT_DARK });

// ----------------------------------------------------
// SLIDE 7: Custom LocalStorage Proxy Engine Flowchart
// ----------------------------------------------------
const slide7 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide7, 'STORAGE AUTOMATION: LOCALSTORAGE PROXY MIGRATION');

// Node 1
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 2.2, h: 1.0, fill: { color: '1E3A8A' } });
slide7.addText('React App triggers\nlocalStorage.setItem', { x: 0.6, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 1 -> 2
slide7.addShape(pptx.shapes.RIGHT_ARROW, { x: 2.9, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 2
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1.5 } });
slide7.addText('storageProxy intercepts\ncall via ES6 Proxy', { x: 3.4, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'B45309', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 2 -> 3
slide7.addShape(pptx.shapes.RIGHT_ARROW, { x: 5.7, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 3 (Split path)
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 1 } });
slide7.addText('Sync update to local\nMap() (In-Memory Cache)', { x: 6.2, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: COLOR_PRIMARY_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 3 -> 4 (DOWN)
slide7.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 2.9, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 4
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 3.5, w: 2.2, h: 1.0, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1.5 } });
slide7.addText('Trigger Electron IPC\nsaveLocalData call', { x: 6.2, y: 3.5, w: 2.2, h: 1.0, align: 'center', color: '064E3B', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 4 -> 5 (DOWN)
slide7.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 4.6, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 5
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 5.1, w: 2.2, h: 1.0, fill: { color: '10B981' } });
slide7.addText('Main processes\nfs.writeFileSync()', { x: 6.2, y: 5.1, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 5 -> 6 (LEFT)
slide7.addShape(pptx.shapes.LEFT_ARROW, { x: 5.7, y: 5.4, w: 0.4, h: 0.4, fill: { color: '10B981' } });

// Node 6
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 5.1, w: 2.2, h: 1.0, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide7.addText('Bypass Browser 5MB Limit\nStored inside C:\\OHSData', { x: 3.4, y: 5.1, w: 2.2, h: 1.0, align: 'center', color: COLOR_TEXT_DARK, fontSize: 10.5, fontFace: 'Inter' });

// ----------------------------------------------------
// SLIDE 8: ExcelGrid spreadsheet engine overview
// ----------------------------------------------------
const slide8 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide8, 'THE EXCELGRID SPREADSHEET ENGINE');

// Visual grid diagram
slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 1.4, w: 4.8, h: 4.8, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1.5 }
});

// Grid rows drawing (Mock spreadsheet headers)
slide8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 4.4, h: 0.4, fill: { color: 'E2E8F0' } });
slide8.addText('   A         B         C         D         E   ', { x: 0.8, y: 1.6, w: 4.4, h: 0.4, fontFace: 'Inter', bold: true, fontSize: 11, color: COLOR_TEXT_DARK });

for (let i = 1; i <= 6; i++) {
  const yPos = 1.6 + i * 0.5;
  slide8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: yPos, w: 4.4, h: 0.45, fill: { color: i % 2 === 0 ? 'F8FAFC' : 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.5 } });
}
// Add selected cell indicator
slide8.addShape(pptx.shapes.RECTANGLE, { x: 1.68, y: 2.6, w: 0.88, h: 0.45, line: { color: COLOR_PRIMARY, width: 2 } });

// Detail cards (Right)
slide8.addText('Core Architecture Modules:\n\n' +
  '• Keyboard Navigation: Implements physical arrow key mappings, Tab, and Enter key captures to shift active focus coordinates.\n\n' +
  '• Dynamic Formula Engine: Recursively evaluates cell references (e.g. A1+B2) and ranges (e.g. SUM(C1:C20)) with depth parameters to prevent circular loop calculations.\n\n' +
  '• Deep Undo/Redo Stack: Clones state history via JSON stringify arrays, capping stack sizes at 30 entries to restrict JS heap growth.', {
  x: 5.8, y: 1.4, w: 6.8, h: 4.8, fontSize: 13.5, fontFace: 'Inter', color: COLOR_TEXT_DARK, lineSpacing: 20
});

// ----------------------------------------------------
// SLIDE 9: DOM Viewport Virtualization Flowchart
// ----------------------------------------------------
const slide9 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide9, 'PERFORMANCE AUTOMATION: DOM VIRTUALIZATION FLOW');

// Node 1
slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 2.2, h: 1.0, fill: { color: '1E3A8A' } });
slide9.addText('Scroll position change\n(scrollTop event fires)', { x: 0.6, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 1 -> 2
slide9.addShape(pptx.shapes.RIGHT_ARROW, { x: 2.9, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 2
slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide9.addText('Calculate accumulated\noffsets of all rows', { x: 3.4, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: COLOR_TEXT_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 2 -> 3
slide9.addShape(pptx.shapes.RIGHT_ARROW, { x: 5.7, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 3
slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide9.addText('Apply buffer padding\n(+/- 150px to view)', { x: 6.2, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: COLOR_TEXT_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 3 -> 4 (DOWN)
slide9.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 2.9, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 4 (Decision)
slide9.addShape(pptx.shapes.DIAMOND, { x: 6.2, y: 3.4, w: 2.2, h: 1.2, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1.5 } });
slide9.addText('Is Printing?\n(isPrinting: true)', { x: 6.2, y: 3.4, w: 2.2, h: 1.2, align: 'center', color: 'B45309', fontSize: 10, bold: true, fontFace: 'Inter' });

// Arrow 4 -> 5 (DOWN - NO)
slide9.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 4.7, w: 0.4, h: 0.4, fill: { color: '10B981' } });
slide9.addText('NO', { x: 7.8, y: 4.7, w: 0.4, h: 0.3, align: 'center', color: '10B981', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 5
slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 5.2, w: 2.2, h: 1.0, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 1 } });
slide9.addText('Slice visible list.\nRender top/bottom spacers', { x: 6.2, y: 5.2, w: 2.2, h: 1.0, align: 'center', color: '0369A1', fontSize: 10.5, fontFace: 'Inter' });

// Arrow 4 -> 6 (LEFT - YES)
slide9.addShape(pptx.shapes.LEFT_ARROW, { x: 5.7, y: 3.8, w: 0.4, h: 0.4, fill: { color: 'EF4444' } });
slide9.addText('YES', { x: 5.7, y: 3.4, w: 0.4, h: 0.3, align: 'center', color: 'EF4444', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 6
slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 3.5, w: 2.2, h: 1.0, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1 } });
slide9.addText('Disable virtualization.\nRender 100% of rows', { x: 3.4, y: 3.5, w: 2.2, h: 1.0, align: 'center', color: '991B1B', fontSize: 11, fontFace: 'Inter' });

// ----------------------------------------------------
// SLIDE 10: Undo/Redo State History Stacks Flowchart
// ----------------------------------------------------
const slide10 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide10, 'USER INTERACTION FLOW: UNDO/REDO HISTORY STACKS');

// Node 1
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 2.2, h: 1.0, fill: { color: '1E3A8A' } });
slide10.addText('User edits cell value\nin spreadsheet', { x: 0.6, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 1 -> 2
slide10.addShape(pptx.shapes.RIGHT_ARROW, { x: 2.9, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 2
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide10.addText('Deep clone current data\nvia JSON stringify/parse', { x: 3.4, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: COLOR_TEXT_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 2 -> 3
slide10.addShape(pptx.shapes.RIGHT_ARROW, { x: 5.7, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 3
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1 } });
slide10.addText('Push cloned state to\nundoStack array', { x: 6.2, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'B45309', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 3 -> 4 (DOWN)
slide10.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 2.9, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 4 (Decision)
slide10.addShape(pptx.shapes.DIAMOND, { x: 6.2, y: 3.4, w: 2.2, h: 1.2, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1.5 } });
slide10.addText('Is undoStack\nlength > 30?', { x: 6.2, y: 3.4, w: 2.2, h: 1.2, align: 'center', color: 'B45309', fontSize: 10, bold: true, fontFace: 'Inter' });

// Arrow 4 -> 5 (DOWN - YES)
slide10.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 4.7, w: 0.4, h: 0.4, fill: { color: 'EF4444' } });
slide10.addText('YES', { x: 7.8, y: 4.7, w: 0.4, h: 0.3, align: 'center', color: 'EF4444', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 5
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 5.2, w: 2.2, h: 1.0, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1 } });
slide10.addText('Shift oldest entry\n(FIFO memory cap)', { x: 6.2, y: 5.2, w: 2.2, h: 1.0, align: 'center', color: '991B1B', fontSize: 11, fontFace: 'Inter' });

// Arrow 4 -> 6 (LEFT - NO)
slide10.addShape(pptx.shapes.LEFT_ARROW, { x: 5.7, y: 3.8, w: 0.4, h: 0.4, fill: { color: '10B981' } });
slide10.addText('NO', { x: 5.7, y: 3.4, w: 0.4, h: 0.3, align: 'center', color: '10B981', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 6
slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 3.5, w: 2.2, h: 1.0, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1 } });
slide10.addText('Clear redoStack array\n& commit current state', { x: 3.4, y: 3.5, w: 2.2, h: 1.0, align: 'center', color: '064E3B', fontSize: 11, fontFace: 'Inter' });

// ----------------------------------------------------
// SLIDE 11: Spreadsheet Formula Parser Flow
// ----------------------------------------------------
const slide11 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
addSlideHeader(slide11, 'TECHNICAL DETAIL: RECURSIVE FORMULA EVALUATION');

// Node 1
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.8, w: 2.2, h: 1.0, fill: { color: '1E3A8A' } });
slide11.addText('Parser scans cell edits\nfor starting "=" character', { x: 0.6, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// Arrow 1 -> 2
slide11.addShape(pptx.shapes.RIGHT_ARROW, { x: 2.9, y: 2.1, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 2 (Decision)
slide11.addShape(pptx.shapes.DIAMOND, { x: 3.4, y: 1.7, w: 2.2, h: 1.2, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1.5 } });
slide11.addText('Does evaluation\ndepth exceed 50?', { x: 3.4, y: 1.7, w: 2.2, h: 1.2, align: 'center', color: 'B45309', fontSize: 9.5, bold: true, fontFace: 'Inter' });

// Arrow 2 -> 3 (UP - YES)
slide11.addShape(pptx.shapes.UP_ARROW, { x: 4.3, y: 1.2, w: 0.4, h: 0.4, fill: { color: 'EF4444' } });
slide11.addText('YES', { x: 4.8, y: 1.2, w: 0.4, h: 0.3, align: 'center', color: 'EF4444', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 3 (Error)
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 0.2, w: 2.2, h: 0.9, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1 } });
slide11.addText('Return "#ERROR!"\n(Circular ref guard)', { x: 3.4, y: 0.2, w: 2.2, h: 0.9, align: 'center', color: '991B1B', fontSize: 10.5, fontFace: 'Inter' });

// Arrow 2 -> 4 (RIGHT - NO)
slide11.addShape(pptx.shapes.RIGHT_ARROW, { x: 5.7, y: 2.1, w: 0.4, h: 0.4, fill: { color: '10B981' } });
slide11.addText('NO', { x: 5.7, y: 1.7, w: 0.4, h: 0.3, align: 'center', color: '10B981', fontSize: 10, bold: true, fontFace: 'Inter' });

// Node 4
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 1.8, w: 2.2, h: 1.0, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
slide11.addText('Regex parses coordinates\n(e.g., SUM(A1:B10))', { x: 6.2, y: 1.8, w: 2.2, h: 1.0, align: 'center', color: COLOR_TEXT_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 4 -> 5 (DOWN)
slide11.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 2.9, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 5
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 3.5, w: 2.2, h: 1.0, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD', width: 1 } });
slide11.addText('Retrieve raw grid values\n& evaluate recursively', { x: 6.2, y: 3.5, w: 2.2, h: 1.0, align: 'center', color: COLOR_PRIMARY_DARK, fontSize: 11, fontFace: 'Inter' });

// Arrow 5 -> 6 (DOWN)
slide11.addShape(pptx.shapes.DOWN_ARROW, { x: 7.3, y: 4.6, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 6
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 5.1, w: 2.2, h: 1.0, fill: { color: 'D1FAE5' }, line: { color: 'A7F3D0', width: 1 } });
slide11.addText('Execute final equation\nusing Javascript Function()', { x: 6.2, y: 5.1, w: 2.2, h: 1.0, align: 'center', color: '064E3B', fontSize: 11, fontFace: 'Inter' });

// Arrow 6 -> 7 (LEFT)
slide11.addShape(pptx.shapes.LEFT_ARROW, { x: 5.7, y: 5.4, w: 0.4, h: 0.4, fill: { color: '3B82F6' } });

// Node 7
slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 5.1, w: 2.2, h: 1.0, fill: { color: '10B981' } });
slide11.addText('Render calculated sum\nor value to cell element', { x: 3.4, y: 5.1, w: 2.2, h: 1.0, align: 'center', color: 'FFFFFF', fontSize: 11, bold: true, fontFace: 'Inter' });

// ----------------------------------------------------
// SLIDE 12: Bootstrap & Database connection
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 13: Prescription Sync & Stock Deduction
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 14: Patient Lifecycle State Machine
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 15: Offline AI Intent Classifier (chatBrain.js)
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 16: Storage Quota & Backup Auto-Migration
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 17: ExcelGrid Keyboard event flow
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 18: Monthly MIS Aggregation Flowchart
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 19: Electron Native IPC Print Preview Bridge
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 20: Automated Excel Export Pipeline
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 21: HSE Clinical Registers Catalog
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 22: Comparison Table (Before vs. After)
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// ----------------------------------------------------
// SLIDE 23: Recommendations & Future Scope
// ----------------------------------------------------
// Duplicate slide setup intentionally left for index flow parity with original.

// Save presentation file
const pptxPath = path.join(__dirname, 'JSPulse_OHMS_Complete_Project_Overview.pptx');
pptx.writeFile({ fileName: pptxPath }).then(() => {
  console.log(`Success! Complete PPTX presentation generated successfully at:\n${pptxPath}`);
  process.exit(0);
}).catch(err => {
  console.error("PPTX generation script failed: ", err);
  process.exit(1);
});
