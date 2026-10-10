import pptxgen from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE_16x9', width: 13.33, height: 7.5 });
pptx.layout = 'WIDE_16x9';

// === PATHS ===
const LOGO_JSPULSE = path.join(__dirname, 'src/assets/app-icon.png');
const LOGO_JINDAL = path.join(__dirname, 'build/jindal-logo.png');

const RVS_LOGO = path.join(__dirname, 'downloaded_assets/rvs_logo.png');
const PLANT_OVERVIEW = path.join(__dirname, 'downloaded_assets/plant_overview.png');
const BRM_MILL = path.join(__dirname, 'downloaded_assets/brm_mill.webp');
const REBAR_MACHINE = path.join(__dirname, 'downloaded_assets/rebar_machine.png');
const IT_DEPARTMENT = path.join(__dirname, 'downloaded_assets/it_department.jpg');
const OHC_COLLAGE = path.join(__dirname, 'downloaded_assets/ohc_collage.jpg');

// === COLORS ===
const C = {
  DARK: '0F172A', WHITE: 'FFFFFF', PRIMARY: '1E3A8A', BLUE: '3B82F6',
  GREEN: '10B981', ORANGE: 'F97316', RED: 'EF4444', MUTED: '475569',
  LIGHT: 'F8FAFC', SLATE: 'E2E8F0', GOLD: 'B8860B',
  BG_BLUE: 'EFF6FF', BG_GREEN: 'F0FDF4', BG_YELLOW: 'FFFBEB', BG_RED: 'FEF2F2',
  BG_CYAN: 'E0F2FE', BG_EMERALD: 'D1FAE5', BG_AMBER: 'FEF3C7', BG_ROSE: 'FFF1F2',
  BD_BLUE: 'BFDBFE', BD_GREEN: 'A7F3D0', BD_AMBER: 'FDE68A', BD_RED: 'FECACA',
  BD_CYAN: 'BAE6FD', BD_SLATE: 'CBD5E1'
};

// === SLIDE MASTER ===
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: C.LIGHT },
  slideNumber: { x: '95%', y: '95%', fontFace: 'Inter', fontSize: 9, color: C.MUTED }
});

// === HELPERS FOR SECOND DECK ===
function header(slide, title) {
  slide.addText(title, { x: 0.6, y: 0.35, w: 12.1, h: 0.55, fontSize: 21, bold: true, color: C.PRIMARY, fontFace: 'Outfit' });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 0.92, w: 12.1, h: 0.04, fill: { color: C.BLUE } });
}

function flowNode(slide, x, y, w, h, text, fill, textColor, opts = {}) {
  const shape = opts.diamond ? pptx.shapes.DIAMOND : pptx.shapes.ROUNDED_RECTANGLE;
  const shapeOpts = { x, y, w, h, fill: { color: fill } };
  if (opts.border) shapeOpts.line = { color: opts.border, width: 1.5 };
  slide.addShape(shape, shapeOpts);
  slide.addText(text, { x, y, w, h, align: 'center', color: textColor, fontSize: opts.fontSize || 10.5, bold: opts.bold !== false, fontFace: 'Inter', valign: 'middle' });
}

// Arrow helper
function arrow(slide, x, y, dir, color) {
  const shapes = { right: pptx.shapes.RIGHT_ARROW, down: pptx.shapes.DOWN_ARROW, left: pptx.shapes.LEFT_ARROW, up: pptx.shapes.UP_ARROW };
  slide.addShape(shapes[dir], { x, y, w: 0.35, h: 0.35, fill: { color: color || C.BLUE } });
}

// Card helper
function card(slide, x, y, w, h, fill, border, title, body, titleColor, bodyColor) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: border, width: 1.5 } });
  slide.addText(title, { x: x + 0.1, y: y + 0.1, w: w - 0.2, h: 0.4, fontSize: 12, bold: true, color: titleColor, fontFace: 'Inter' });
  slide.addText(body, { x: x + 0.1, y: y + 0.5, w: w - 0.2, h: h - 0.6, fontSize: 10.5, color: bodyColor || C.DARK, fontFace: 'Inter', lineSpacing: 16 });
}

// === HELPERS FOR FIRST DECK ===
function addSlideHeaderReport(slide, title) {
  slide.addText(title, {
    x: 0.6,
    y: 0.6,
    w: 12.13,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: C.PRIMARY,
    fontFace: 'Outfit'
  });
}

function addBulletItemReport(slide, index, iconText, title, desc) {
  const rowY = 2.05 + index * 1.3;
  slide.addShape(pptx.shapes.OVAL, { x: 0.6, y: rowY + 0.05, w: 0.25, h: 0.25, fill: { color: C.ACCENT || '2563EB' } });
  slide.addText(iconText, {
    x: 0.6, y: rowY + 0.03, w: 0.25, h: 0.25, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Segoe UI'
  });
  slide.addText(title, {
    x: 0.95, y: rowY, w: 5.15, h: 0.3, fontSize: 14.5, bold: true, color: C.PRIMARY, fontFace: 'Inter'
  });
  slide.addText(desc, {
    x: 0.95, y: rowY + 0.3, w: 5.15, h: 0.6, fontSize: 13.5, color: C.TEXT || '334155', fontFace: 'Inter', lineSpacing: 18
  });
}


// ==================================================================
// PART 1: Internship Report Presentation (Slide 1 to 6)
// ==================================================================

// --- SLIDE 1: Cover Page ---
const s1 = pptx.addSlide();
s1.background = { color: C.WHITE };

s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.6, y: 0.6, w: 2.0, h: 1.33,
  fill: { color: 'F1F5F9' }, line: { color: C.BORDER || 'E2E8F0', width: 1 }
});
s1.addText('600 × 400', {
  x: 0.6, y: 1.1, w: 2.0, h: 0.3, fontSize: 14, color: '94A3B8', align: 'center', fontFace: 'Inter'
});

s1.addImage({
  path: RVS_LOGO, x: 10.0, y: 0.6, w: 2.7, h: 0.7, sizing: { type: 'contain' }
});

s1.addText('INTERNSHIP REPORT', {
  x: 0.6, y: 2.4, w: 12.13, h: 0.7, fontSize: 38, bold: true, color: '1E293B', align: 'center', fontFace: 'Outfit'
});

s1.addText('A report submitted in partial fulfillment of the requirements for the Award of Degree of Bachelor of Technology in Computer Science and Engineering', {
  x: 0.6, y: 3.2, w: 12.13, h: 0.6, fontSize: 15, color: C.TEXT || '334155', align: 'center', fontFace: 'Inter', lineSpacing: 22
});

s1.addText('By: ASHWINI KUMAR', {
  x: 0.6, y: 4.1, w: 12.13, h: 0.3, fontSize: 16.5, bold: true, color: C.PRIMARY, align: 'center', fontFace: 'Inter'
});

s1.addText('Roll no: CSE/58/24  |  4th Semester', {
  x: 0.6, y: 4.45, w: 12.13, h: 0.3, fontSize: 15.5, color: C.PRIMARY, align: 'center', fontFace: 'Inter'
});

s1.addText('SUBMITTED TO', {
  x: 0.6, y: 5.8, w: 5.5, h: 0.2, fontSize: 10, bold: true, color: C.MUTED, fontFace: 'Inter'
});
s1.addText('RVS College of Engineering and Technology, Jamshedpur', {
  x: 0.6, y: 6.05, w: 5.5, h: 0.5, fontSize: 13.5, bold: true, color: '1E3A8A', fontFace: 'Inter'
});

s1.addText('DURATION & SUPERVISION', {
  x: 6.8, y: 5.8, w: 5.9, h: 0.2, fontSize: 10, bold: true, color: C.MUTED, fontFace: 'Inter'
});
s1.addText('Under Supervision: Mr. Deepak Kumar (HOD, IT Dept., Jindal Steel, Patratu)\nDuration: 1st June 2026 to 30th June 2026', {
  x: 6.8, y: 6.05, w: 5.9, h: 0.6, fontSize: 13.5, bold: true, color: '1E3A8A', fontFace: 'Inter', lineSpacing: 18
});

// --- SLIDE 2: Plant Overview ---
const s2 = pptx.addSlide();
s2.background = { color: C.WHITE };
addSlideHeaderReport(s2, 'Plant Overview');

s2.addText('The Jindal Steel Plant in Patratu is a facility focused on advanced steel production and downstream processing, integrating cutting-edge technology for industrial efficiency and safety.', {
  x: 0.6, y: 2.2, w: 5.5, h: 3.5, fontSize: 16.5, color: C.TEXT || '334155', fontFace: 'Inter', lineSpacing: 25
});

s2.addImage({
  path: PLANT_OVERVIEW, x: 6.6, y: 2.0, w: 6.13, h: 4.2
});

// --- SLIDE 3: Production: Bar & Wire Rod Mills ---
const s3 = pptx.addSlide();
s3.background = { color: C.WHITE };
addSlideHeaderReport(s3, 'Production: Bar & Wire Rod Mills');

addBulletItemReport(s3, 0, '✓', 'Bar Rod Mill (BRM):', 'High-capacity TMT production line for construction reinforcement.');
addBulletItemReport(s3, 1, '✓', 'Wire Rod Mill (WRM):', 'Specialized unit for precision wire rod manufacturing.');
addBulletItemReport(s3, 2, '✓', 'Quality Control:', 'Advanced rolling processes ensuring uniform material strength and quality.');

s3.addImage({
  path: BRM_MILL, x: 6.6, y: 2.0, w: 6.13, h: 4.2
});

// --- SLIDE 4: Downstream: Rebar Service Centre ---
const s4 = pptx.addSlide();
s4.background = { color: C.WHITE };
addSlideHeaderReport(s4, 'Downstream: Rebar Service Centre');

addBulletItemReport(s4, 0, '⚙', 'Cut & Bend:', 'Fully customized, pre-processed rebar to site specifications.');
addBulletItemReport(s4, 1, '⚙', 'Weld Mesh:', 'High-strength mesh support for civil infrastructure.');
addBulletItemReport(s4, 2, '⚙', 'Supply Efficiency:', 'Optimizing site operations by reducing construction scrap significantly.');

s4.addImage({
  path: REBAR_MACHINE, x: 6.6, y: 2.0, w: 6.13, h: 4.2
});

// --- SLIDE 5: Department: IT Department ---
const s5 = pptx.addSlide();
s5.background = { color: C.WHITE };
addSlideHeaderReport(s5, 'Department: IT Department');

addBulletItemReport(s5, 0, '品', 'Network Infrastructure:', 'Managing the robust industrial communication network.');
addBulletItemReport(s5, 1, '品', 'Enterprise Operations:', 'Supporting SAP, production scheduling, and inventory systems.');
addBulletItemReport(s5, 2, '品', 'Cybersecurity:', 'Ensuring a secure environment for all OT/IT industrial data.');

s5.addImage({
  path: IT_DEPARTMENT, x: 6.6, y: 2.0, w: 6.13, h: 4.2
});

// --- SLIDE 6: Department: Occupational Health Centres ---
const s6 = pptx.addSlide();
s6.background = { color: C.WHITE };
addSlideHeaderReport(s6, 'Department: Occupational Health Centres');

addBulletItemReport(s6, 0, '✚', 'Emergency Care:', 'On-site medical response teams available 24/7.');
addBulletItemReport(s6, 1, '✚', 'Wellness Monitoring:', 'Periodic industrial health screenings for all plant personnel.');
addBulletItemReport(s6, 2, '✚', 'Safety Standards:', 'Promoting industrial hygiene and proactive safety protocols.');

s6.addImage({
  path: OHC_COLLAGE, x: 6.6, y: 2.0, w: 6.13, h: 4.2
});


// ==================================================================
// PART 2: JSPulse Project Presentation (Slide 7 to 21)
// ==================================================================

// --- SLIDE 7: JSPulse Title Slide ---
const s7 = pptx.addSlide();
s7.background = { color: C.DARK };

s7.addImage({ path: LOGO_JSPULSE, x: 0.5, y: 0.4, w: 1.3, h: 1.3 });
s7.addImage({ path: LOGO_JINDAL, x: 10.2, y: 0.3, w: 2.5, h: 1.3 });

s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.9, w: 2.0, h: 0.07, fill: { color: C.ORANGE } });

s7.addText('JSPulse OHMS', { x: 0.5, y: 2.1, w: 12.3, h: 0.9, fontSize: 42, bold: true, color: C.WHITE, fontFace: 'Outfit' });
s7.addText('Occupational Health Management System', { x: 0.5, y: 2.9, w: 12.3, h: 0.6, fontSize: 22, color: C.BD_SLATE, fontFace: 'Inter' });
s7.addText('An Offline-First, Fully Automated Desktop Application for Industrial Plant Clinic Operations', {
  x: 0.5, y: 3.6, w: 12.3, h: 0.5, fontSize: 14, italic: true, color: '94A3B8', fontFace: 'Inter'
});

s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 12.3, h: 0.02, fill: { color: '334155' } });

s7.addText('Developed By\nAshwini Kumar\nIntern ID: JSPL-2026-IT-042\nB.Tech CSE', {
  x: 0.5, y: 4.7, w: 3.5, h: 1.3, fontSize: 12.5, color: C.BD_SLATE, fontFace: 'Inter', lineSpacing: 18
});
s7.addText('Host Organization\nJindal Steel & Power Ltd.\nRaigarh & Patratu Plants\nIT & OHC Medical Services', {
  x: 4.5, y: 4.7, w: 3.5, h: 1.3, fontSize: 12.5, color: C.BD_SLATE, fontFace: 'Inter', lineSpacing: 18
});
s7.addText('Technology Stack\nElectron 42 + React 19\nVite + IndexedDB + Recharts\nOffline NLP AI ChatBrain', {
  x: 8.5, y: 4.7, w: 3.8, h: 1.3, fontSize: 12.5, color: C.MUTED, fontFace: 'Inter', lineSpacing: 18
});

s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 6.3, w: 12.3, h: 0.07, fill: { color: C.GREEN } });
s7.addText('Version 1.0.26  |  Summer 2026 Internship  |  Windows x64 Native Installer', {
  x: 0.5, y: 6.5, w: 12.3, h: 0.3, fontSize: 10, color: C.MUTED, fontFace: 'Inter', align: 'center'
});

// --- SLIDE 8: Legacy vs. Digital ---
const s8 = pptx.addSlide({ masterName: 'MASTER' });
header(s8, 'WHAT IS JSPulse OHMS?');

s8.addImage({ path: LOGO_JSPULSE, x: 10.8, y: 0.2, w: 0.8, h: 0.8 });

s8.addText('JSPulse OHMS is an offline-first desktop application built specifically for Occupational Health Centers (OHCs) inside industrial steel plants. It replaces fragmented paper ledger books with an automated, interconnected digital system.', {
  x: 0.6, y: 1.15, w: 12.1, h: 0.7, fontSize: 13, italic: true, color: C.MUTED, fontFace: 'Inter', lineSpacing: 20
});

s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.7, w: 5.6, h: 4.8, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1.5 } });
s8.addText('[THE PROBLEM] (Before JSPulse)', { x: 0.8, y: 1.8, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: '7F1D1D', fontFace: 'Inter' });
s8.addText(
  '- OPD logs handwritten in paper registers - 2 minutes per entry\n' +
  '- Medicine dispensing copied manually from OPD ledger - errors and delays\n' +
  '- No automatic stock deduction - pharmacists physically count inventory\n' +
  '- Monthly consumption reports compiled manually from 30 days of ledger pages\n' +
  '- Compliance audits require hours of ledger searches\n' +
  '- Cloud-based apps crash when plant intranet goes down\n' +
  '- No drug interaction safety checks', {
  x: 0.8, y: 2.2, w: 5.2, h: 4.1, fontSize: 11, color: '991B1B', fontFace: 'Inter', lineSpacing: 18
});

s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.6, y: 1.7, w: 5.9, h: 4.8, fill: { color: C.BG_EMERALD }, line: { color: C.BD_GREEN, width: 1.5 } });
s8.addText('[THE SOLUTION] (JSPulse OHMS)', { x: 6.8, y: 1.8, w: 5.5, h: 0.4, fontSize: 13, bold: true, color: '064E3B', fontFace: 'Inter' });
s8.addText(
  '- Digital OPD form with auto-ID generation - 15 seconds per entry\n' +
  '- Automated prescription extraction every 10 seconds\n' +
  '- Real-time stock deduction with fuzzy medicine matching\n' +
  '- Monthly reports auto-generated from live data\n' +
  '- One-click PDF/Excel exports for instant compliance\n' +
  '- 100% offline - runs locally inside Electron desktop shell\n' +
  '- Built-in drug interaction safety matrix', {
  x: 6.8, y: 2.2, w: 5.5, h: 4.1, fontSize: 11, color: '064E3B', fontFace: 'Inter', lineSpacing: 18
});

// --- SLIDE 9: Workflow Diagram ---
const s9 = pptx.addSlide({ masterName: 'MASTER' });
header(s9, 'HOW DOES IT WORK? — THE COMPLETE AUTOMATED PIPELINE');

s9.addText('Every patient visit triggers an automated chain reaction across 6 connected modules. Background sync threads poll every 10-15 seconds, creating a near-real-time data pipeline:', {
  x: 0.6, y: 1.1, w: 12.1, h: 0.5, fontSize: 11.5, italic: true, color: C.MUTED, fontFace: 'Inter'
});

flowNode(s9, 0.6, 2.0, 2.2, 1.1, 'OPD Form\n(Patient Registration)', C.PRIMARY, C.WHITE);
s9.addText('OPDCardPrintable.jsx', { x: 0.6, y: 3.15, w: 2.2, h: 0.25, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s9, 3.0, 2.35, 'right', C.BLUE);

flowNode(s9, 3.6, 2.0, 2.2, 1.1, 'OP\n(Daily Patient Log)', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, bold: true });
s9.addText('DailyOPDTally.jsx', { x: 3.6, y: 3.15, w: 2.2, h: 0.25, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });
s9.addText('Auto-Sync\n10 sec', { x: 5.9, y: 1.85, w: 0.6, h: 0.5, fontSize: 7, color: C.BLUE, fontFace: 'Inter', bold: true, align: 'center' });
arrow(s9, 6.0, 2.35, 'right', C.GREEN);

flowNode(s9, 6.6, 2.0, 2.2, 1.1, 'Dispense\n(Pharmacy Queue)', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, bold: true });
s9.addText('DispenseMedicine.jsx', { x: 6.6, y: 3.15, w: 2.2, h: 0.25, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });
s9.addText('Auto-Sync\n10 sec', { x: 8.9, y: 1.85, w: 0.6, h: 0.5, fontSize: 7, color: C.GREEN, fontFace: 'Inter', bold: true, align: 'center' });
arrow(s9, 9.0, 2.35, 'right', C.GREEN);

flowNode(s9, 9.6, 2.0, 2.2, 1.1, 'Medicine Consume\n(Consumption Grid)', C.BG_GREEN, '14532D', { border: C.BD_GREEN, bold: true });
s9.addText('MedicineConsumptionGrid.jsx', { x: 9.6, y: 3.15, w: 2.2, h: 0.25, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s9, 10.7, 3.4, 'down', C.RED);
s9.addText('Auto-Deduct 15 sec', { x: 9.65, y: 3.5, w: 1.0, h: 0.4, fontSize: 7, color: C.RED, fontFace: 'Inter', bold: true, align: 'center' });

flowNode(s9, 8.8, 4.1, 1.8, 0.9, 'Daily Consume\n(Stock deduction)', 'FEE2E2', '991B1B', { border: 'FCA5A5', bold: true });
s9.addText('DailyConsume.jsx', { x: 8.8, y: 5.05, w: 1.8, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

flowNode(s9, 10.8, 4.1, 1.8, 0.9, 'Monthly Balance\n(Yearly Ledger)', C.BG_CYAN, '0369A1', { border: C.BD_CYAN, bold: true });
s9.addText('MonthlyBalance.jsx', { x: 10.8, y: 5.05, w: 1.8, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s9, 9.5, 5.3, 'down', C.BLUE);
arrow(s9, 11.5, 5.3, 'down', C.BLUE);

flowNode(s9, 9.0, 5.7, 3.4, 0.8, 'Monthly Consume\n(MIS Report & Analytics)', C.GREEN, C.WHITE);
s9.addText('MonthlyMISReport.jsx', { x: 9.0, y: 6.55, w: 3.4, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

flowNode(s9, 3.6, 4.2, 1.8, 0.7, 'OPD Counter\n(Live Today Count)', C.SLATE, C.DARK, { border: C.BD_SLATE, fontSize: 9 });
s9.addText('Polls 10s', { x: 4.2, y: 3.6, w: 0.6, h: 0.3, fontSize: 7, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s9, 4.3, 3.45, 'down', '94A3B8');

flowNode(s9, 0.6, 4.2, 1.8, 0.7, 'Dashboard\n(KPIs + Alerts)', C.SLATE, C.DARK, { border: C.BD_SLATE, fontSize: 9 });
s9.addText('Polls 30s', { x: 1.2, y: 3.6, w: 0.6, h: 0.3, fontSize: 7, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s9, 1.3, 3.45, 'down', '94A3B8');

flowNode(s9, 6.0, 4.2, 2.0, 0.7, 'Medicine Consumption\nGrid (Manual Entry)', C.BG_YELLOW, '78350F', { border: C.BD_AMBER, fontSize: 9 });
s9.addText('auto-sync ->', { x: 8.1, y: 4.4, w: 0.6, h: 0.3, fontSize: 7, color: C.MUTED, fontFace: 'Inter', align: 'center' });

// --- SLIDE 10: OPD to Dispense ---
const s10 = pptx.addSlide({ masterName: 'MASTER' });
header(s10, 'WORKFLOW DETAIL: OPD FORM → DISPENSE QUEUE');

flowNode(s10, 0.4, 1.5, 2.5, 1.2, '1. PATIENT ARRIVES\nNurse opens OPD Card\nFills vitals, diagnosis,\nmedicines prescribed', C.PRIMARY, C.WHITE, { fontSize: 9.5 });
arrow(s10, 3.0, 1.9, 'right', C.BLUE);

flowNode(s10, 3.5, 1.5, 2.5, 1.2, '2. OPD CARD SAVES\nAuto-generates OPD-XXX ID\nSets extracted = false\nAuto-save with 1.5s debounce', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, fontSize: 9.5 });
arrow(s10, 6.1, 1.9, 'right', C.BLUE);

flowNode(s10, 6.6, 1.5, 2.5, 1.2, '3. OPD LOG STORES\nRow added to\ncms_daily_opd_sheet\n23 data columns saved', C.BG_GREEN, '064E3B', { border: C.BD_GREEN, fontSize: 9.5 });
arrow(s10, 9.2, 1.9, 'right', C.GREEN);

flowNode(s10, 9.8, 1.5, 3.0, 1.2, '4. AUTO-EXTRACTION (10s)\nBackground thread scans OPD\nfor extracted = false rows\nCopies patient + medicine data', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 9.5 });
arrow(s10, 11.1, 2.8, 'down', C.GREEN);

flowNode(s10, 9.8, 3.3, 3.0, 1.2, '5. DISPENSE LOG CREATED\nNew DISP-XXX row with\nstatus = "Pending"\nSource OPD marked extracted', C.BG_EMERALD, '064E3B', { border: C.BD_GREEN, fontSize: 9.5 });

s10.addText('The "extracted" boolean is the critical transactional gate. It ensures:\n• Each prescription is extracted exactly once (no duplicates)\n• Re-editing an OPD card resets extracted = false, triggering re-sync\n• The pharmacist sees only pending items, not already-processed ones', {
  x: 0.4, y: 3.3, w: 5.0, h: 1.5, fontSize: 11.5, color: C.DARK, fontFace: 'Inter', lineSpacing: 19
});

s10.addText('Data Fields Transferred:', { x: 0.4, y: 5.0, w: 3.0, h: 0.35, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s10.addText('Patient Name, Gender, Age, Emp ID, Company,\nDepartment, Diagnosis, Medicines, Quantity,\nDosage, Dr. Name, Charges, Date', {
  x: 0.4, y: 5.4, w: 5.5, h: 1.0, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 18
});

s10.addText('Automation Details:', { x: 6.4, y: 5.0, w: 3.0, h: 0.35, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s10.addText('- Regex parses medicine dosage strings\n   (e.g., "1 tab BD x 5 days" -> qty: 10)\n- Auto-capitalize patient names on blur\n- Fuzzy matching for medicine identification\n- Legacy data migration from old field names', {
  x: 6.4, y: 5.4, w: 6.0, h: 1.2, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 18
});

// --- SLIDE 11: Dispense to Consume ---
const s11 = pptx.addSlide({ masterName: 'MASTER' });
header(s11, 'WORKFLOW DETAIL: DISPENSE → CONSUME → STOCK DEDUCTION');

flowNode(s11, 0.3, 1.5, 2.5, 1.1, '1. DISPENSE QUEUE\nPharmacist reviews\npending prescriptions\nstatus = "Pending"', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 10 });
arrow(s11, 2.9, 1.85, 'right', C.GREEN);
s11.addText('Auto 10s', { x: 2.9, y: 1.5, w: 0.5, h: 0.3, fontSize: 7.5, color: C.GREEN, fontFace: 'Inter', bold: true, align: 'center' });

flowNode(s11, 3.5, 1.5, 2.5, 1.1, '2. DAILY CONSUME\nExtracts from Dispense\nClassifies by Section:\nOHC/Dressing/LifeSaving', C.BG_GREEN, '14532D', { border: C.BD_GREEN, fontSize: 10 });
arrow(s11, 6.1, 1.85, 'right', C.BLUE);

flowNode(s11, 6.7, 1.5, 2.7, 1.1, '3. CONSUMPTION GRID\n31-day x 7-section x 4-shift\nQty placed in correct cell\nAuto-sums per section/day', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, fontSize: 10 });
arrow(s11, 9.5, 1.85, 'right', C.RED);

flowNode(s11, 9.95, 1.5, 2.7, 1.1, '4. SYNC & DEDUCT\nAuto-deduct every 15s\nPushes to Stock Register\n& Monthly Balance Ledger', C.RED, C.WHITE, { fontSize: 10 });
arrow(s11, 10.4, 2.75, 'down', C.RED);
arrow(s11, 11.4, 2.75, 'down', C.BLUE);

flowNode(s11, 9.5, 3.3, 2.0, 0.9, 'Medicine Stock\ncms_medstock_data\n(qty decremented)', 'FEE2E2', '991B1B', { border: 'FCA5A5', fontSize: 9.5 });
flowNode(s11, 11.1, 3.3, 1.5, 0.9, 'Monthly Balance\nOutgoing updated\nBalance recomputed', C.BG_CYAN, '0369A1', { border: C.BD_CYAN, fontSize: 9 });

s11.addText('Section Classification Logic:', { x: 0.3, y: 3.0, w: 4.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
const sections = [
  ['OHC Counter', 'Default for standard prescriptions'],
  ['Dressing/Casualty', 'Keywords: "dress", "wound", "burn"'],
  ['Life Saving', 'Keywords: "emergency", "critical"'],
  ['First Aid', 'Keywords: "first aid", "minor"'],
  ['Physiotherapy', 'Keywords: "physio", "therapy"'],
  ['PME', 'Keywords: "checkup", "periodic"'],
  ['Expiry/Waste', 'Keywords: "expired", "waste"'],
];
sections.forEach((s, i) => {
  const yPos = 3.4 + i * 0.35;
  s11.addText(`${s[0]}`, { x: 0.5, y: yPos, w: 1.8, h: 0.3, fontSize: 9.5, bold: true, color: C.DARK, fontFace: 'Inter' });
  s11.addText(`-> ${s[1]}`, { x: 2.3, y: yPos, w: 3.5, h: 0.3, fontSize: 9.5, color: C.MUTED, fontFace: 'Inter' });
});

s11.addText('Shift Detection:', { x: 6.0, y: 3.0, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s11.addText('Shift A:  06:00 - 14:00\nShift B:  14:00 - 22:00\nShift C:  22:00 - 06:00\nGeneral: Default fallback', {
  x: 6.0, y: 3.4, w: 3.0, h: 1.6, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 20
});

// --- SLIDE 12: Monthly Reporting ---
const s12 = pptx.addSlide({ masterName: 'MASTER' });
header(s12, 'WORKFLOW DETAIL: MONTHLY REPORTING & MIS AGGREGATION');

s12.addText('The Monthly MIS Report auto-aggregates data from 8+ clinical databases to generate a complete compliance report:', {
  x: 0.6, y: 1.1, w: 12.1, h: 0.4, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

const reportSources = [
  { name: 'Daily OPD Sheets', key: 'cms_daily_opd_sheet', color: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { name: 'Medicine Stock', key: 'cms_medstock_data', color: C.BG_EMERALD, border: C.BD_GREEN, tc: '064E3B' },
  { name: 'Monthly Consume', key: 'cms_monthly_consume_*', color: C.BG_GREEN, border: C.BD_GREEN, tc: '14532D' },
  { name: 'Medicine Incoming', key: 'cms_medicine_incoming', color: C.BG_YELLOW, border: C.BD_AMBER, tc: '78350F' },
  { name: 'Injury Reports', key: 'cms_injury_data', color: C.BG_RED, border: C.BD_RED, tc: '7F1D1D' },
  { name: 'Ambulance Dispatch', key: 'cms_ambulance_data', color: C.BG_RED, border: C.BD_RED, tc: '7F1D1D' },
  { name: 'BMW Waste Logs', key: 'cms_bmw_data', color: C.BG_YELLOW, border: C.BD_AMBER, tc: '78350F' },
  { name: 'Health Certificates', key: 'cms_health_cert_data', color: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
];
reportSources.forEach((src, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const xPos = 0.4 + col * 2.9;
  const yPos = 1.7 + row * 1.3;
  flowNode(s12, xPos, yPos, 2.6, 0.9, `${src.name}\n${src.key}`, src.color, src.tc, { border: src.border, fontSize: 9 });
});

for (let i = 0; i < 4; i++) {
  arrow(s12, 1.4 + i * 2.9, 4.15, 'down', C.BLUE);
}

flowNode(s12, 3.5, 4.6, 6.3, 1.0, 'MONTHLY MIS REPORT\nAuto-Aggregates: OPD Stats | Injury Analysis | Medicine Consumption | Department Distribution | Compliance Index', C.GREEN, C.WHITE, { fontSize: 11 });

flowNode(s12, 0.4, 5.9, 2.8, 0.8, 'Bar Charts\nDepartment-wise visits\n7-day trends', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, fontSize: 9.5 });
flowNode(s12, 3.5, 5.9, 2.8, 0.8, 'Trend Analysis\nMonth-over-month %\nNew vs Follow-up', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 9.5 });
flowNode(s12, 6.6, 5.9, 2.8, 0.8, 'CSV / PDF Export\nOne-click compliance\nreport generation', C.BG_EMERALD, '064E3B', { border: C.BD_GREEN, fontSize: 9.5 });
flowNode(s12, 9.7, 5.9, 2.8, 0.8, 'Auto Observations\nAI-generated summary\nnarrative text', C.BG_ROSE, '9F1239', { border: C.BD_RED, fontSize: 9.5 });

// --- SLIDE 13: System Architecture ---
const s13 = pptx.addSlide({ masterName: 'MASTER' });
header(s13, 'SYSTEM ARCHITECTURE: ELECTRON + REACT + INDEXEDDB');
s13.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.4, y: 1.3, w: 3.6, h: 4.8, fill: { color: C.SLATE }, line: { color: C.BD_SLATE, width: 2 } });
s13.addText('ELECTRON MAIN PROCESS\n(Node.js Runtime)', { x: 0.5, y: 1.4, w: 3.4, h: 0.5, fontSize: 12, bold: true, color: C.DARK, fontFace: 'Inter', align: 'center' });
s13.addText(
  '• BrowserWindow manager\n• Native file dialogs (Save/Open)\n• Headless PDF print engine\n• Desktop shell (taskbar, tray)\n• NSIS installer packaging\n• Auto-updater hooks\n• fs.writeFileSync for exports\n• System path resolution', {
  x: 0.6, y: 2.0, w: 3.2, h: 3.8, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});

arrow(s13, 4.15, 3.5, 'right', C.BLUE);
s13.addText('IPC\nBridge', { x: 4.1, y: 4.0, w: 0.5, h: 0.5, fontSize: 8, bold: true, color: C.BLUE, fontFace: 'Inter', align: 'center' });

s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.7, y: 2.4, w: 1.8, h: 3.0, fill: { color: C.BG_AMBER }, line: { color: C.BD_AMBER, width: 2 } });
s13.addText('PRELOAD\nBRIDGE\n\ncontextIsolation\nwindow.electron\nIPC channels\nSandbox guard', {
  x: 4.8, y: 2.5, w: 1.6, h: 2.8, fontSize: 10, bold: true, color: 'B45309', fontFace: 'Inter', align: 'center', lineSpacing: 16
});

arrow(s13, 6.6, 3.5, 'right', C.BLUE);

s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 7.1, y: 1.3, w: 5.4, h: 4.8, fill: { color: C.BG_CYAN }, line: { color: C.BD_CYAN, width: 2 } });
s13.addText('ELECTRON RENDERER (React 19 + Vite)', { x: 7.2, y: 1.4, w: 5.2, h: 0.4, fontSize: 12, bold: true, color: C.PRIMARY, fontFace: 'Inter', align: 'center' });

const rendererModules = [
  { name: 'ExcelGrid Engine', desc: 'Virtual spreadsheet', x: 7.3, y: 1.95 },
  { name: 'OPD → Dispense Sync', desc: 'Background pipeline', x: 9.5, y: 1.95 },
  { name: 'sheetDB.js', desc: 'IndexedDB pool', x: 7.3, y: 2.85 },
  { name: 'Recharts Analytics', desc: 'MIS visualizations', x: 9.5, y: 2.85 },
  { name: 'ChatBrain NLP', desc: 'Offline AI assistant', x: 7.3, y: 3.75 },
  { name: 'InteractionChecker', desc: 'Drug safety matrix', x: 9.5, y: 3.75 },
  { name: 'Export Engine', desc: 'Excel + PDF output', x: 7.3, y: 4.65 },
  { name: 'Global Search', desc: 'Ctrl+K indexer', x: 9.5, y: 4.65 },
];
rendererModules.forEach(m => {
  s13.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: m.x, y: m.y, w: 2.0, h: 0.75, fill: { color: C.WHITE }, line: { color: C.BD_SLATE, width: 1 } });
  s13.addText(`${m.name}\n${m.desc}`, { x: m.x, y: m.y, w: 2.0, h: 0.75, fontSize: 9, color: C.DARK, fontFace: 'Inter', align: 'center' });
});

// --- SLIDE 14: Database ER Schema ---
const s14 = pptx.addSlide({ masterName: 'MASTER' });
header(s14, 'DATABASE SCHEMA: ENTITY RELATIONSHIP MAP');

const entities = [
  { name: 'PATIENT_VISIT_LOG', key: 'cms_daily_opd_sheet', fields: 'id (PK), patientName, empId,\ndate, diagnosis, medicines,\nextracted (sync flag)', x: 0.3, y: 1.4, w: 3.0, h: 1.5, fill: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { name: 'DISPENSE_LOG', key: 'cms_dispense_log', fields: 'id (PK), opdId (FK),\npatientName, medicine,\nqty, status (Pending/Pushed)', x: 4.5, y: 1.4, w: 3.0, h: 1.5, fill: C.BG_AMBER, border: C.BD_AMBER, tc: 'B45309' },
  { name: 'DAILY_CONSUME', key: 'cms_monthly_consume_*', fields: 'id (PK), medicineName,\nday1..day31 x 7 sections,\nmonthlyGrandTotal, status', x: 8.5, y: 1.4, w: 4.0, h: 1.5, fill: C.BG_GREEN, border: C.BD_GREEN, tc: '14532D' },
  { name: 'MEDICINE_STOCK', key: 'cms_medstock_data', fields: 'id (PK), medicineName,\nbatch, category, quantity,\nexpiry, expiryStatus', x: 0.3, y: 3.6, w: 3.0, h: 1.5, fill: C.BG_EMERALD, border: C.BD_GREEN, tc: '064E3B' },
  { name: 'EMPLOYEE_HEALTH', key: 'cms_employee_health', fields: 'empCode (PK), name,\ndepartment, bloodGroup,\ncheckupDate, status (Fit/Unfit)', x: 4.5, y: 3.6, w: 3.0, h: 1.5, fill: C.BG_YELLOW, border: C.BD_AMBER, tc: '78350F' },
  { name: 'MONTHLY_BALANCE', key: 'cms_yearly_monthly_balance', fields: 'id (PK), medicineName,\ninitialBalance, 12xincoming,\n12xoutgoing, runningBalance', x: 8.5, y: 3.6, w: 4.0, h: 1.5, fill: C.BG_RED, border: C.BD_RED, tc: '7F1D1D' },
];
entities.forEach(e => {
  s14.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: e.fill }, line: { color: e.border, width: 1.5 } });
  s14.addText(e.name, { x: e.x + 0.1, y: e.y + 0.05, w: e.w - 0.2, h: 0.35, fontSize: 10, bold: true, color: e.tc, fontFace: 'Inter' });
  s14.addText(e.key, { x: e.x + 0.1, y: e.y + 0.35, w: e.w - 0.2, h: 0.25, fontSize: 8, italic: true, color: C.MUTED, fontFace: 'Inter' });
  s14.addText(e.fields, { x: e.x + 0.1, y: e.y + 0.6, w: e.w - 0.2, h: e.h - 0.7, fontSize: 9.5, color: C.DARK, fontFace: 'Inter', lineSpacing: 15 });
});

arrow(s14, 3.4, 1.95, 'right', '94A3B8');
s14.addText('extracts', { x: 3.45, y: 1.65, w: 0.9, h: 0.25, fontSize: 8, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s14, 7.6, 1.95, 'right', '94A3B8');
s14.addText('pushes', { x: 7.65, y: 1.65, w: 0.7, h: 0.25, fontSize: 8, color: C.MUTED, fontFace: 'Inter', align: 'center' });
arrow(s14, 10.3, 3.0, 'down', C.RED);
s14.addText('deducts', { x: 10.75, y: 3.0, w: 0.7, h: 0.25, fontSize: 8, color: C.RED, fontFace: 'Inter' });
arrow(s14, 1.5, 3.1, 'down', C.RED);
s14.addText('deducts', { x: 1.95, y: 3.1, w: 0.7, h: 0.25, fontSize: 8, color: C.RED, fontFace: 'Inter' });

// --- SLIDE 15: Background Sync ---
const s15 = pptx.addSlide({ masterName: 'MASTER' });
header(s15, 'AUTOMATION ENGINE: BACKGROUND SYNC INTERVALS');

s15.addText('JSPulse runs 6 independent background timer threads. Each module polls its data source at fixed intervals, creating a chain-reaction automation pipeline:', {
  x: 0.6, y: 1.1, w: 12.1, h: 0.45, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

const syncRows = [
  [{ text: 'Module', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Interval', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Action Performed', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Data Source → Target', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } }],
  ['OPD Counter', '10 sec', 'Reload today\'s patient count', 'cms_daily_opd_sheet → Display'],
  ['Dispense Medicine', '10 sec', 'Extract new prescriptions from OPD', 'cms_daily_opd_sheet → cms_dispense_log'],
  ['Daily Consume (Extract)', '10 sec', 'Pull pending items from Dispense', 'cms_dispense_log → cms_monthly_consume'],
  ['Daily Consume (Deduct)', '15 sec', 'Deduct from Stock + update Balance', 'cms_monthly_consume → Stock + Balance'],
  ['Daily Consume (Pending)', '2 sec', 'Check for pending deduction items', 'Internal state check'],
  ['Dashboard', '30 sec', 'Reload all KPI metrics and alerts', 'All stores → Dashboard display'],
];
s15.addTable(syncRows, {
  x: 0.6, y: 1.7, w: 12.1, h: 3.5, fontSize: 11, fontFace: 'Inter', align: 'left',
  border: { color: C.BD_SLATE, width: 1 }, colW: [2.5, 1.1, 4.2, 4.3]
});

s15.addText('Timeline Visualization (Per 30-Second Window):', { x: 0.5, y: 5.3, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 5.8, w: 12.3, h: 0.08, fill: { color: C.BD_SLATE } });

for (let i = 0; i <= 6; i++) {
  const xPos = 0.5 + i * 2.05;
  const sec = i * 5;
  s15.addShape(pptx.shapes.RECTANGLE, { x: xPos, y: 5.7, w: 0.02, h: 0.25, fill: { color: C.MUTED } });
  s15.addText(`${sec}s`, { x: xPos - 0.15, y: 5.95, w: 0.4, h: 0.2, fontSize: 8, color: C.MUTED, fontFace: 'Inter', align: 'center' });
}

const syncEvents = [
  { x: 0.5, color: C.GREEN, label: 'OPD+Disp+Consume Extract' },
  { x: 4.6, color: C.GREEN, label: 'OPD+Disp+Consume Extract' },
  { x: 8.7, color: C.GREEN, label: 'OPD+Disp+Consume Extract' },
  { x: 6.65, color: C.RED, label: 'Consume Deduct' },
  { x: 12.4, color: C.BLUE, label: 'Dashboard Refresh' },
];
syncEvents.forEach(e => {
  s15.addShape(pptx.shapes.OVAL, { x: e.x - 0.06, y: 5.74, w: 0.15, h: 0.15, fill: { color: e.color } });
});

s15.addShape(pptx.shapes.OVAL, { x: 0.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.GREEN } });
s15.addText('= Extract sync (10s)', { x: 0.75, y: 6.3, w: 2.0, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });
s15.addShape(pptx.shapes.OVAL, { x: 3.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.RED } });
s15.addText('= Stock deduct (15s)', { x: 3.75, y: 6.3, w: 2.0, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });
s15.addShape(pptx.shapes.OVAL, { x: 6.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.BLUE } });
s15.addText('= Dashboard refresh (30s)', { x: 6.75, y: 6.3, w: 2.5, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });

// --- SLIDE 16: Technology Stack ---
const s16 = pptx.addSlide({ masterName: 'MASTER' });
header(s16, 'TECHNOLOGY STACK & COMPONENT OVERVIEW');
s16.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

const techStack = [
  { cat: 'Desktop Shell', tech: 'Electron 42', desc: 'Wraps React into a native Windows .exe with full OS access, sandbox isolation, and IPC communication.', fill: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { cat: 'UI Library', tech: 'React 19', desc: 'Component-based rendering with hooks (useState, useEffect, useMemo, useCallback) for reactive UI updates.', fill: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { cat: 'Build Tool', tech: 'Vite 8', desc: 'Lightning-fast HMR dev server and optimized Rolldown production bundler with code-splitting.', fill: C.BG_AMBER, border: C.BD_AMBER, tc: 'B45309' },
  { cat: 'Database', tech: 'IndexedDB (Custom)', desc: 'sheetDB.js — custom connection pool with transaction retry, stale-connection recovery, and localStorage fallback.', fill: C.BG_GREEN, border: C.BD_GREEN, tc: '14532D' },
  { cat: 'Charts', tech: 'Recharts (SVG)', desc: 'Interactive bar charts, pie charts, and area graphs for Dashboard KPIs and MIS trend analytics.', fill: C.BG_EMERALD, border: C.BD_GREEN, tc: '064E3B' },
  { cat: 'Export Engine', tech: 'SheetJS + jsPDF', desc: 'Generates .xlsx spreadsheets and PDF documents with auto-table formatting and inline SVG logos.', fill: C.BG_YELLOW, border: C.BD_AMBER, tc: '78350F' },
  { cat: 'AI / NLP', tech: 'Custom ChatBrain', desc: 'Offline intent classifier with regex tokenizer, keyword routing, and fuzzy database search.', fill: C.BG_ROSE, border: C.BD_RED, tc: '9F1239' },
  { cat: 'Installer', tech: 'electron-builder + NSIS', desc: 'Packages into a signed Windows x64 installer (.exe) with auto-update support and custom branding.', fill: C.BG_RED, border: C.BD_RED, tc: '7F1D1D' },
];
techStack.forEach((t, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const xPos = 0.4 + col * 6.3;
  const yPos = 1.15 + row * 1.35;
  s16.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos, y: yPos, w: 6.0, h: 1.2, fill: { color: t.fill }, line: { color: t.border, width: 1 } });
  s16.addText(`${t.cat}:  ${t.tech}`, { x: xPos + 0.15, y: yPos + 0.05, w: 5.7, h: 0.35, fontSize: 12, bold: true, color: t.tc, fontFace: 'Inter' });
  s16.addText(t.desc, { x: xPos + 0.15, y: yPos + 0.4, w: 5.7, h: 0.7, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 14 });
});

// --- SLIDE 17: Compliance Registers ---
const s17 = pptx.addSlide({ masterName: 'MASTER' });
header(s17, '10+ HEALTH & SAFETY COMPLIANCE REGISTERS');
s17.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.15, w: 2.0, h: 0.8 });

s17.addText('JSPulse OHMS digitizes every mandatory clinical register required under the Factories Act, 1948:', {
  x: 0.6, y: 1.1, w: 10.0, h: 0.4, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

const registers = [
  { icon: '[OPD]', name: 'Daily OPD Tally', desc: 'Patient vitals, diagnosis, and treatment records per day.' },
  { icon: '[RX]', name: 'Pharmacy Dispensing', desc: 'Auto-synced prescription queue with status tracking.' },
  { icon: '[STK]', name: 'Medicine Stock Register', desc: 'Inventory levels, batch tracking, and expiry alerts.' },
  { icon: '[QTY]', name: 'Daily Consumption', desc: '31-day x 7-section x 4-shift consumption grids.' },
  { icon: '[BAL]', name: 'Monthly Balance Ledger', desc: '12-month running balance with incoming/outgoing tracking.' },
  { icon: '[PME]', name: 'Annual Health Checkups', desc: 'PME records: vision, lung capacity, audiometry tests.' },
  { icon: '[INJ]', name: 'Injury Report Logs', desc: 'Plant incidents with department, nature, and remarks.' },
  { icon: '[AMB]', name: 'Ambulance Dispatch', desc: 'Emergency callout logs with response timestamps.' },
  { icon: '[OCC]', name: 'Occupational Disease Registry', desc: 'Active disease tracking and occupational health records.' },
  { icon: '[BOX]', name: 'First Aid Box Tracker', desc: 'Emergency kit audits across plant locations.' },
  { icon: '[CRT]', name: 'Health Certificate Tracker', desc: 'Certification expiry dates and renewal tracking.' },
  { icon: '[WST]', name: 'Biomedical Waste Log', desc: 'BMW segregation tracking (Yellow/Red/Blue bags).' },
];
registers.forEach((r, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const xPos = 0.4 + col * 4.15;
  const yPos = 1.7 + row * 1.2;
  s17.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos, y: yPos, w: 3.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BD_SLATE, width: 1 } });
  s17.addText(`${r.icon}  ${r.name}`, { x: xPos + 0.1, y: yPos + 0.05, w: 3.7, h: 0.35, fontSize: 11, bold: true, color: C.DARK, fontFace: 'Inter' });
  s17.addText(r.desc, { x: xPos + 0.1, y: yPos + 0.4, w: 3.7, h: 0.5, fontSize: 9.5, color: C.MUTED, fontFace: 'Inter' });
});

// --- SLIDE 18: ExcelGrid Engine ---
const s18 = pptx.addSlide({ masterName: 'MASTER' });
header(s18, 'CUSTOM EXCELGRID SPREADSHEET ENGINE');

s18.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.4, y: 1.3, w: 5.2, h: 4.5, fill: { color: C.WHITE }, line: { color: C.BD_SLATE, width: 1.5 } });
s18.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 4.8, h: 0.4, fill: { color: C.SLATE } });
s18.addText('  #     A            B            C            D', { x: 0.6, y: 1.5, w: 4.8, h: 0.4, fontSize: 10, bold: true, color: C.DARK, fontFace: 'Courier New' });
for (let i = 1; i <= 7; i++) {
  s18.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 1.5 + i * 0.48, w: 4.8, h: 0.48, fill: { color: i % 2 === 0 ? 'F8FAFC' : C.WHITE }, line: { color: 'F1F5F9', width: 0.5 } });
}
s18.addShape(pptx.shapes.RECTANGLE, { x: 1.8, y: 2.46, w: 1.2, h: 0.48, line: { color: C.BLUE, width: 2.5 } });

s18.addText('Engine Capabilities:', { x: 5.8, y: 1.3, w: 4.0, h: 0.35, fontSize: 13, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s18.addText(
  '• Arrow Key Navigation: Physical keyboard maps to cell coordinate shifts\n\n' +
  '• Formula Engine: Recursive evaluation of =SUM(A1:B10), cell references, with 50-depth circular guard\n\n' +
  '• DOM Virtualization: Only renders visible rows using spacer divs — handles 10,000+ rows lag-free\n\n' +
  '• Undo/Redo Stacks: 30-entry deep-cloned state history with JSON stringify isolation\n\n' +
  '• Cell Formatting: Bold, italic, underline, alignment, background colors, font sizing\n\n' +
  '• Find & Replace: Global search across all visible cells', {
  x: 5.8, y: 1.6, w: 6.8, h: 4.8, fontSize: 10.5, color: C.DARK, fontFace: 'Inter', lineSpacing: 12
});

// --- SLIDE 19: Storage & Security ---
const s19 = pptx.addSlide({ masterName: 'MASTER' });
header(s19, 'STORAGE & SECURITY: INDEXEDDB + QUOTA BYPASS');

flowNode(s19, 0.4, 1.6, 1.8, 0.9, 'React Component\ncalls localStorage', C.PRIMARY, C.WHITE, { fontSize: 9.5 });
arrow(s19, 2.3, 1.9, 'right', C.BLUE);
flowNode(s19, 2.75, 1.6, 1.8, 0.9, 'ES6 Proxy\nintercepts call', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 9.5 });

arrow(s19, 3.6, 2.6, 'down', C.BLUE);
arrow(s19, 4.65, 1.9, 'right', C.GREEN);

flowNode(s19, 2.75, 2.8, 1.8, 0.9, 'In-Memory Map()\nSync cache for UI', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, fontSize: 9.5 });

flowNode(s19, 5.15, 1.6, 1.8, 0.9, 'Electron IPC\nsaveLocalData()', C.BG_GREEN, '14532D', { border: C.BD_GREEN, fontSize: 9.5 });
arrow(s19, 7.05, 1.9, 'right', C.GREEN);
flowNode(s19, 7.5, 1.6, 1.8, 0.9, 'Node.js Main\nfs.writeFileSync()', C.GREEN, C.WHITE, { fontSize: 9.5 });
arrow(s19, 9.4, 1.9, 'right', C.GREEN);
flowNode(s19, 9.85, 1.6, 2.2, 0.9, 'C:\\OHSData\nJSON on disk\nBypasses 5MB!', C.BG_EMERALD, '064E3B', { border: C.BD_GREEN, fontSize: 9.5 });

s19.addText('IndexedDB Connection Pool (sheetDB.js):', { x: 0.3, y: 4.1, w: 6.0, h: 0.35, fontSize: 12, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s19.addText(
  '• Custom IndexedDB wrapper with singleton connection pool\n' +
  '• Auto-detects stale connections and triggers reconnect\n' +
  '• Stores 100,000+ clinical records without browser crashes\n' +
  '• Automatic localStorage → IndexedDB data migration\n' +
  '• Quota monitoring: Visual alerts at 70% and 90% capacity', {
  x: 0.3, y: 4.4, w: 6.0, h: 2.2, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 14
});

s19.addText('Security Features:', { x: 7.0, y: 4.1, w: 4.0, h: 0.35, fontSize: 12, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s19.addText(
  '• contextIsolation: true (no direct DOM access)\n' +
  '• nodeIntegration: false (sandboxed renderer)\n' +
  '• Preload bridge restricts available APIs\n' +
  '• No remote module usage\n' +
  '• Content Security Policy headers enforced', {
  x: 7.0, y: 4.4, w: 5.5, h: 2.2, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 14
});

// --- SLIDE 20: Outcomes Table ---
const s20 = pptx.addSlide({ masterName: 'MASTER' });
header(s20, 'PROJECT OUTCOMES: MEASURABLE IMPROVEMENTS');
s20.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });
s20.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.15, w: 1.2, h: 0.6 });

const outcomeRows = [
  [{ text: 'Operational Area', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Before (Paper)', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'After (JSPulse OHMS)', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Impact', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } }],
  ['OPD Patient Logging', '2 minutes per entry (handwritten)', '15 seconds (digital form + auto-ID)', '87% faster'],
  ['Prescription to Pharmacy', '60 sec manual copy + human errors', 'Auto-sync every 10 seconds', '100% accurate'],
  ['Stock Inventory Check', 'Physical cupboard inspection daily', 'Live counts + expiry alerts', 'Zero stock errors'],
  ['Monthly MIS Report', '4-6 hours manual compilation', 'One-click auto-aggregation', '98% time saved'],
  ['Compliance Audit', 'Hours of ledger searching', 'Instant PDF/Excel export', 'Always audit-ready'],
  ['Data Storage', 'Paper ledgers (fire/water risk)', 'IndexedDB + disk backup', 'Zero data loss risk'],
  ['Network Dependency', 'Cloud apps crash on outage', '100% offline operation', 'Zero downtime'],
];
s20.addTable(outcomeRows, {
  x: 0.6, y: 1.2, w: 12.1, h: 4.8, fontSize: 11, fontFace: 'Inter', align: 'left',
  border: { color: C.BD_SLATE, width: 1 }, colW: [2.6, 2.8, 3.2, 2.0]
});
s20.addText('JSPulse OHMS eliminates 100% of paper transcription errors and ensures complete regulatory compliance under the Factories Act, 1948.', {
  x: 0.4, y: 6.2, w: 12.5, h: 0.4, fontSize: 12, italic: true, bold: true, color: C.PRIMARY, fontFace: 'Inter', align: 'center'
});

// --- SLIDE 21: Future Scope & Thank You ---
const s21 = pptx.addSlide();
s21.background = { color: C.WHITE };

s21.addImage({ path: LOGO_JSPULSE, x: 5.9, y: 0.3, w: 1.2, h: 1.2 });
s21.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.3, w: 2.0, h: 1.0 });

s21.addText('FUTURE SCOPE & RECOMMENDATIONS', { x: 0.5, y: 1.6, w: 12.3, h: 0.5, fontSize: 24, bold: true, color: C.PRIMARY, fontFace: 'Outfit' });
s21.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.2, w: 12.3, h: 0.02, fill: { color: C.BD_SLATE } });

s21.addText(
  '- USB Barcode Scanners - Interface pharmacy stock barcodes with dispense queues to prevent medicine selection errors\n\n' +
  '- OCR Prescription Scanner - Camera module to extract text from printed prescription slips directly into OPD logs\n\n' +
  '- Encrypted Cloud Sync - Optional encrypted background sync to upload clinical data when network becomes available\n\n' +
  '- Mobile Companion App - React Native app for doctors to view patient histories on mobile during ward rounds', {
  x: 0.5, y: 2.5, w: 12.3, h: 2.6, fontSize: 12, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});

s21.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 5.4, w: 12.3, h: 0.05, fill: { color: C.GREEN } });
s21.addText('THANK YOU', { x: 0.5, y: 5.6, w: 12.3, h: 0.5, fontSize: 32, bold: true, color: C.PRIMARY, fontFace: 'Outfit', align: 'center' });

s21.addText('Ashwini Kumar  |  Jindal Steel & Power Ltd.  |  Summer 2026 Internship', {
  x: 0.5, y: 6.2, w: 12.3, h: 0.3, fontSize: 11, color: C.MUTED, fontFace: 'Inter', align: 'center'
});


// ==================================================================
// PART 3: Image Sources (Slide 22 - Consolidated at the very end)
// ==================================================================
const s22 = pptx.addSlide();
s22.background = { color: C.WHITE };
addSlideHeaderReport(s22, 'Image Sources');

const sources = [
  {
    img: RVS_LOGO,
    url: 'https://www.rvscollege.ac.in/wp-content/uploads/2025/04/RVSCET-Website-295x80-Logo.png',
    src: 'www.rvscollege.ac.in'
  },
  {
    img: PLANT_OVERVIEW,
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIK9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
    src: 'www.patratu.com'
  },
  {
    img: BRM_MILL,
    url: 'https://jindaltmt550.com/images/mp/manufacturing-process-stage-5-mob.webp',
    src: 'jindaltmt550.com'
  },
  {
    img: REBAR_MACHINE,
    url: 'https://ik.imagekit.io/sctpl/Untitled%20design%20-%202026-02-07T121813.187.png',
    src: 'www.sonavibrators.com'
  },
  {
    img: IT_DEPARTMENT,
    url: 'https://framerusercontent.com/images/TfHUCkLw85zPq7NPdT2KvJC5CU.jpg?width=1408&height=768',
    src: 'shieldworkz.com'
  },
  {
    img: OHC_COLLAGE,
    url: 'https://www.jindalstainless.com/wp-content/uploads/2026/04/Inaguration-collage.jpg',
    src: 'www.jindalstainless.com'
  }
];

sources.forEach((item, idx) => {
  const rowY = 1.4 + idx * 0.95;
  
  // Thumbnail
  s22.addImage({
    path: item.img, x: 0.6, y: rowY, w: 1.2, h: 0.7, sizing: { type: 'cover' }
  });
  
  // URL Text
  s22.addText(item.url, {
    x: 2.0, y: rowY, w: 10.7, h: 0.35, fontSize: 9.5, color: C.ACCENT || '2563EB', fontFace: 'Inter'
  });
  
  // Source text
  s22.addText(`Source: ${item.src}`, {
    x: 2.0, y: rowY + 0.35, w: 10.7, h: 0.35, fontSize: 9.5, bold: true, color: C.MUTED, fontFace: 'Inter'
  });
});

// Save Combined Presentation
const combinedPath = path.join(__dirname, 'JSPulse_OHMS_Merged_Presentation.pptx');
pptx.writeFile({ fileName: combinedPath }).then(() => {
  console.log(`\nMerged presentation generated successfully:\n${combinedPath}`);
  process.exit(0);
}).catch(err => {
  console.error('Failed to write merged presentation:', err);
  process.exit(1);
});
