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

// Real App Screenshots
const SS = {
  dashboard: path.join(__dirname, 'screenshots/dashboard.png'),
  opdcard: path.join(__dirname, 'screenshots/opdcard.png'),
  opd: path.join(__dirname, 'screenshots/opd.png'),
  dispense: path.join(__dirname, 'screenshots/dispense.png'),
  medconsume: path.join(__dirname, 'screenshots/medconsume.png'),
  inventory: path.join(__dirname, 'screenshots/inventory.png'),
  shift: path.join(__dirname, 'screenshots/shift.png'),
  monthlybalance: path.join(__dirname, 'screenshots/monthlybalance.png'),
  mis: path.join(__dirname, 'screenshots/mis.png'),
  clinical: path.join(__dirname, 'screenshots/clinical.png'),
  systemhealth: path.join(__dirname, 'screenshots/systemhealth.png'),
  backup: path.join(__dirname, 'screenshots/backup.png'),
  shortcuts: path.join(__dirname, 'screenshots/shortcuts.png'),
};

// === COLORS ===
const C = {
  DARK: '0F172A', WHITE: 'FFFFFF', PRIMARY: '1E3A8A', BLUE: '3B82F6',
  GREEN: '10B981', ORANGE: 'F97316', RED: 'EF4444', MUTED: '475569',
  LIGHT: 'F8FAFC', SLATE: 'E2E8F0', GOLD: 'B8860B', TEXT: '334155',
  BG_BLUE: 'EFF6FF', BG_GREEN: 'F0FDF4', BG_YELLOW: 'FFFBEB', BG_RED: 'FEF2F2',
  BG_CYAN: 'E0F2FE', BG_EMERALD: 'D1FAE5', BG_AMBER: 'FEF3C7', BG_ROSE: 'FFF1F2',
  BD_BLUE: 'BFDBFE', BD_GREEN: 'A7F3D0', BD_AMBER: 'FDE68A', BD_RED: 'FECACA',
  BD_CYAN: 'BAE6FD', BD_SLATE: 'CBD5E1', ACCENT: '2563EB'
};

// === SLIDE MASTER ===
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: C.LIGHT },
  slideNumber: { x: '95%', y: '95%', fontFace: 'Inter', fontSize: 9, color: C.MUTED }
});

// === HELPERS ===
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

function arrow(slide, x, y, dir, color) {
  const shapes = { right: pptx.shapes.RIGHT_ARROW, down: pptx.shapes.DOWN_ARROW, left: pptx.shapes.LEFT_ARROW, up: pptx.shapes.UP_ARROW };
  slide.addShape(shapes[dir], { x, y, w: 0.35, h: 0.35, fill: { color: color || C.BLUE } });
}

function card(slide, x, y, w, h, fill, border, title, body, titleColor, bodyColor) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: border, width: 1.5 } });
  slide.addText(title, { x: x + 0.1, y: y + 0.1, w: w - 0.2, h: 0.4, fontSize: 12, bold: true, color: titleColor, fontFace: 'Inter' });
  slide.addText(body, { x: x + 0.1, y: y + 0.5, w: w - 0.2, h: h - 0.6, fontSize: 10.5, color: bodyColor || C.DARK, fontFace: 'Inter', lineSpacing: 16 });
}

function addSlideHeaderReport(slide, title) {
  slide.addText(title, { x: 0.6, y: 0.6, w: 12.13, h: 0.6, fontSize: 28, bold: true, color: C.PRIMARY, fontFace: 'Outfit' });
}

function addBulletItemReport(slide, index, iconText, title, desc) {
  const rowY = 2.05 + index * 1.3;
  slide.addShape(pptx.shapes.OVAL, { x: 0.6, y: rowY + 0.05, w: 0.25, h: 0.25, fill: { color: C.ACCENT } });
  slide.addText(iconText, { x: 0.6, y: rowY + 0.03, w: 0.25, h: 0.25, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Segoe UI' });
  slide.addText(title, { x: 0.95, y: rowY, w: 5.15, h: 0.3, fontSize: 14.5, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
  slide.addText(desc, { x: 0.95, y: rowY + 0.3, w: 5.15, h: 0.6, fontSize: 13.5, color: C.TEXT, fontFace: 'Inter', lineSpacing: 18 });
}

// Helper to add a screenshot with a shadow frame
function addScreenshot(slide, imgPath, x, y, w, h, caption) {
  // Shadow border behind image
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x - 0.03, y: y - 0.03, w: w + 0.06, h: h + 0.06,
    fill: { color: 'FFFFFF' },
    line: { color: C.BD_SLATE, width: 1.5 },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, opacity: 0.15 }
  });
  slide.addImage({ path: imgPath, x, y, w, h });
  if (caption) {
    slide.addText(caption, {
      x, y: y + h + 0.08, w, h: 0.25,
      fontSize: 9, italic: true, color: C.MUTED, fontFace: 'Inter', align: 'center'
    });
  }
}


// ==================================================================
// PART 1: INTERNSHIP REPORT SLIDES (1-6) - UNTOUCHED
// ==================================================================

// --- SLIDE 1: Cover Page ---
const s1 = pptx.addSlide();
s1.background = { color: C.WHITE };
s1.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 0.6, w: 2.0, h: 1.33, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 1 } });
s1.addText('600 x 400', { x: 0.6, y: 1.1, w: 2.0, h: 0.3, fontSize: 14, color: '94A3B8', align: 'center', fontFace: 'Inter' });
s1.addImage({ path: RVS_LOGO, x: 10.0, y: 0.6, w: 2.7, h: 0.7, sizing: { type: 'contain' } });
s1.addText('INTERNSHIP REPORT', { x: 0.6, y: 2.4, w: 12.13, h: 0.7, fontSize: 38, bold: true, color: '1E293B', align: 'center', fontFace: 'Outfit' });
s1.addText('A report submitted in partial fulfillment of the requirements for the Award of Degree of Bachelor of Technology in Computer Science and Engineering', { x: 0.6, y: 3.2, w: 12.13, h: 0.6, fontSize: 15, color: C.TEXT, align: 'center', fontFace: 'Inter', lineSpacing: 22 });
s1.addText('By: ASHWINI KUMAR', { x: 0.6, y: 4.1, w: 12.13, h: 0.3, fontSize: 16.5, bold: true, color: C.PRIMARY, align: 'center', fontFace: 'Inter' });
s1.addText('Roll no: CSE/58/24  |  4th Semester', { x: 0.6, y: 4.45, w: 12.13, h: 0.3, fontSize: 15.5, color: C.PRIMARY, align: 'center', fontFace: 'Inter' });
s1.addText('SUBMITTED TO', { x: 0.6, y: 5.8, w: 5.5, h: 0.2, fontSize: 10, bold: true, color: C.MUTED, fontFace: 'Inter' });
s1.addText('RVS College of Engineering and Technology, Jamshedpur', { x: 0.6, y: 6.05, w: 5.5, h: 0.5, fontSize: 13.5, bold: true, color: '1E3A8A', fontFace: 'Inter' });
s1.addText('DURATION & SUPERVISION', { x: 6.8, y: 5.8, w: 5.9, h: 0.2, fontSize: 10, bold: true, color: C.MUTED, fontFace: 'Inter' });
s1.addText('Under Supervision: Mr. Deepak Kumar (HOD, IT Dept., Jindal Steel, Patratu)\nDuration: 1st June 2026 to 30th June 2026', { x: 6.8, y: 6.05, w: 5.9, h: 0.6, fontSize: 13.5, bold: true, color: '1E3A8A', fontFace: 'Inter', lineSpacing: 18 });

// --- SLIDE 2: Plant Overview ---
const s2 = pptx.addSlide();
s2.background = { color: C.WHITE };
addSlideHeaderReport(s2, 'Plant Overview');
s2.addText('The Jindal Steel Plant in Patratu is a facility focused on advanced steel production and downstream processing, integrating cutting-edge technology for industrial efficiency and safety.', { x: 0.6, y: 2.2, w: 5.5, h: 3.5, fontSize: 16.5, color: C.TEXT, fontFace: 'Inter', lineSpacing: 25 });
s2.addImage({ path: PLANT_OVERVIEW, x: 6.6, y: 2.0, w: 6.13, h: 4.2 });

// --- SLIDE 3: Production ---
const s3 = pptx.addSlide();
s3.background = { color: C.WHITE };
addSlideHeaderReport(s3, 'Production: Bar & Wire Rod Mills');
addBulletItemReport(s3, 0, 'v', 'Bar Rod Mill (BRM):', 'High-capacity TMT production line for construction reinforcement.');
addBulletItemReport(s3, 1, 'v', 'Wire Rod Mill (WRM):', 'Specialized unit for precision wire rod manufacturing.');
addBulletItemReport(s3, 2, 'v', 'Quality Control:', 'Advanced rolling processes ensuring uniform material strength and quality.');
s3.addImage({ path: BRM_MILL, x: 6.6, y: 2.0, w: 6.13, h: 4.2 });

// --- SLIDE 4: Downstream ---
const s4 = pptx.addSlide();
s4.background = { color: C.WHITE };
addSlideHeaderReport(s4, 'Downstream: Rebar Service Centre');
addBulletItemReport(s4, 0, '*', 'Cut & Bend:', 'Fully customized, pre-processed rebar to site specifications.');
addBulletItemReport(s4, 1, '*', 'Weld Mesh:', 'High-strength mesh support for civil infrastructure.');
addBulletItemReport(s4, 2, '*', 'Supply Efficiency:', 'Optimizing site operations by reducing construction scrap significantly.');
s4.addImage({ path: REBAR_MACHINE, x: 6.6, y: 2.0, w: 6.13, h: 4.2 });

// --- SLIDE 5: IT Department ---
const s5 = pptx.addSlide();
s5.background = { color: C.WHITE };
addSlideHeaderReport(s5, 'Department: IT Department');
addBulletItemReport(s5, 0, 'N', 'Network Infrastructure:', 'Managing the robust industrial communication network.');
addBulletItemReport(s5, 1, 'N', 'Enterprise Operations:', 'Supporting SAP, production scheduling, and inventory systems.');
addBulletItemReport(s5, 2, 'N', 'Cybersecurity:', 'Ensuring a secure environment for all OT/IT industrial data.');
s5.addImage({ path: IT_DEPARTMENT, x: 6.6, y: 2.0, w: 6.13, h: 4.2 });

// --- SLIDE 6: OHC ---
const s6 = pptx.addSlide();
s6.background = { color: C.WHITE };
addSlideHeaderReport(s6, 'Department: Occupational Health Centres');
addBulletItemReport(s6, 0, '+', 'Emergency Care:', 'On-site medical response teams available 24/7.');
addBulletItemReport(s6, 1, '+', 'Wellness Monitoring:', 'Periodic industrial health screenings for all plant personnel.');
addBulletItemReport(s6, 2, '+', 'Safety Standards:', 'Promoting industrial hygiene and proactive safety protocols.');
s6.addImage({ path: OHC_COLLAGE, x: 6.6, y: 2.0, w: 6.13, h: 4.2 });


// --- NEW SLIDE: Challenges (Before JSPulse) ---
const s6_problems = pptx.addSlide();
s6_problems.background = { color: C.WHITE };
addSlideHeaderReport(s6_problems, 'Challenges of Manual OHC Operations (Before JSPulse)');

function addChallengeBullet(slide, idx, title, desc) {
  const rowY = 2.05 + idx * 1.35;
  // Red circle for challenge
  slide.addShape(pptx.shapes.OVAL, { x: 0.6, y: rowY + 0.05, w: 0.25, h: 0.25, fill: { color: C.RED || 'EF4444' } });
  slide.addText('!', { x: 0.6, y: rowY + 0.03, w: 0.25, h: 0.25, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Segoe UI' });
  slide.addText(title, { x: 0.95, y: rowY, w: 5.15, h: 0.3, fontSize: 14.5, bold: true, color: '991B1B', fontFace: 'Inter' });
  slide.addText(desc, { x: 0.95, y: rowY + 0.3, w: 5.15, h: 0.6, fontSize: 13.5, color: C.TEXT, fontFace: 'Inter', lineSpacing: 18 });
}

addChallengeBullet(s6_problems, 0, 'Slow Patient Registration:', 'Manual entry of employee details increases patient waiting times, leading to workflow inefficiency and delays.');
addChallengeBullet(s6_problems, 1, 'Prescription Human Errors:', 'Mistakes in manually transcribing patient information, dosages, and diagnoses affect treatment quality and safety.');
addChallengeBullet(s6_problems, 2, 'Inventory Management Issues:', 'Manual monitoring of medicines can lead to critical stock shortages, overstocking, and unnoticed drug expiries.');

function addChallengeBulletRight(slide, idx, title, desc) {
  const rowY = 2.05 + idx * 1.35;
  // Red circle for challenge
  slide.addShape(pptx.shapes.OVAL, { x: 6.8, y: rowY + 0.05, w: 0.25, h: 0.25, fill: { color: C.RED || 'EF4444' } });
  slide.addText('!', { x: 6.8, y: rowY + 0.03, w: 0.25, h: 0.25, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Segoe UI' });
  slide.addText(title, { x: 7.15, y: rowY, w: 5.5, h: 0.3, fontSize: 14.5, bold: true, color: '991B1B', fontFace: 'Inter' });
  slide.addText(desc, { x: 7.15, y: rowY + 0.3, w: 5.5, h: 0.6, fontSize: 13.5, color: C.TEXT, fontFace: 'Inter', lineSpacing: 18 });
}

addChallengeBulletRight(s6_problems, 0, 'Delayed Health Surveillance:', 'Tracking mandatory periodic medical examinations (PME) manually is slow, causing employees to miss required check-ups.');
addChallengeBulletRight(s6_problems, 1, 'Difficulty in Report Generation:', 'Compiling monthly, quarterly, and annual statutory reports manually consumes significant manpower and clinical time.');
addChallengeBulletRight(s6_problems, 2, 'Compliance Challenges:', 'Maintaining compliance with occupational health regulations is difficult without digital tracking and instant audit logs.');


// ==================================================================
// PART 2: JSPulse PROJECT SLIDES (7 onward) - WITH REAL SCREENSHOTS
// ==================================================================


// --- SLIDE 7: JSPulse Title ---
const s7 = pptx.addSlide();
s7.background = { color: C.DARK };
s7.addImage({ path: LOGO_JSPULSE, x: 0.5, y: 0.4, w: 1.3, h: 1.3 });
s7.addImage({ path: LOGO_JINDAL, x: 10.2, y: 0.3, w: 2.5, h: 1.3 });
s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.9, w: 2.0, h: 0.07, fill: { color: C.ORANGE } });
s7.addText('JSPulse OHMS', { x: 0.5, y: 2.1, w: 12.3, h: 0.9, fontSize: 42, bold: true, color: C.WHITE, fontFace: 'Outfit' });
s7.addText('Occupational Health Management System', { x: 0.5, y: 2.9, w: 12.3, h: 0.6, fontSize: 22, color: C.BD_SLATE, fontFace: 'Inter' });
s7.addText('An Offline-First, Fully Automated Desktop Application for Industrial Plant Clinic Operations', { x: 0.5, y: 3.6, w: 12.3, h: 0.5, fontSize: 14, italic: true, color: '94A3B8', fontFace: 'Inter' });
s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 12.3, h: 0.02, fill: { color: '334155' } });
s7.addText('Developed By\nAshwini Kumar\nIntern ID: JSPL-2026-IT-042\nB.Tech CSE', { x: 0.5, y: 4.7, w: 3.5, h: 1.3, fontSize: 12.5, color: C.BD_SLATE, fontFace: 'Inter', lineSpacing: 18 });
s7.addText('Host Organization\nJindal Steel & Power Ltd.\nRaigarh & Patratu Plants\nIT & OHC Medical Services', { x: 4.5, y: 4.7, w: 3.5, h: 1.3, fontSize: 12.5, color: C.BD_SLATE, fontFace: 'Inter', lineSpacing: 18 });
s7.addText('Technology Stack\nElectron 42 + React 19\nVite + IndexedDB + Recharts\nOffline NLP AI ChatBrain', { x: 8.5, y: 4.7, w: 3.8, h: 1.3, fontSize: 12.5, color: C.MUTED, fontFace: 'Inter', lineSpacing: 18 });
s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 6.3, w: 12.3, h: 0.07, fill: { color: C.GREEN } });
s7.addText('Version 1.0.26  |  Summer 2026 Internship  |  Windows x64 Native Installer', { x: 0.5, y: 6.5, w: 12.3, h: 0.3, fontSize: 10, color: C.MUTED, fontFace: 'Inter', align: 'center' });


// --- SLIDE 8: What is JSPulse + Dashboard Screenshot ---
const s8 = pptx.addSlide({ masterName: 'MASTER' });
header(s8, 'WHAT IS JSPulse OHMS? - THE DASHBOARD');
s8.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

s8.addText('JSPulse OHMS is an offline-first desktop application for Occupational Health Centers inside industrial steel plants. It replaces paper ledger books with an automated, interconnected digital system.', {
  x: 0.6, y: 1.15, w: 5.0, h: 0.9, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter', lineSpacing: 18
});

// Key features bullet list
s8.addText(
  '- Digital OPD form with auto-ID - 15 sec per entry\n' +
  '- Automated prescription sync every 10 seconds\n' +
  '- Real-time stock deduction with fuzzy matching\n' +
  '- Monthly reports auto-generated from live data\n' +
  '- One-click PDF/Excel compliance exports\n' +
  '- 100% offline - runs inside Electron shell\n' +
  '- Built-in drug interaction safety matrix', {
  x: 0.6, y: 2.15, w: 5.0, h: 3.2, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 17
});

// Dashboard screenshot
addScreenshot(s8, SS.dashboard, 6.0, 1.1, 6.7, 3.76, 'JSPulse OHMS Dashboard - Live KPIs, Charts & Alerts');

// Problem highlight at bottom
s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.6, w: 5.5, h: 1.3, fill: { color: 'FEE2E2' }, line: { color: 'FCA5A5', width: 1 } });
s8.addText('BEFORE: Paper ledgers, 2 min/entry,\nmanual monthly reports (4-6 hours)', { x: 0.75, y: 5.7, w: 5.2, h: 0.5, fontSize: 11, bold: true, color: '991B1B', fontFace: 'Inter', lineSpacing: 16 });
s8.addText('Manual stock counts, no safety checks,\ncloud apps crash on plant intranet outage', { x: 0.75, y: 6.2, w: 5.2, h: 0.5, fontSize: 10, color: '991B1B', fontFace: 'Inter', lineSpacing: 16 });

s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.6, y: 5.6, w: 6.1, h: 1.3, fill: { color: C.BG_EMERALD }, line: { color: C.BD_GREEN, width: 1 } });
s8.addText('AFTER: 15 sec/entry, auto-sync pipeline,\none-click MIS reports, zero data loss', { x: 6.75, y: 5.7, w: 5.8, h: 0.5, fontSize: 11, bold: true, color: '064E3B', fontFace: 'Inter', lineSpacing: 16 });
s8.addText('100% offline, real-time stock deduction,\ndrug interaction safety, audit-ready exports', { x: 6.75, y: 6.2, w: 5.8, h: 0.5, fontSize: 10, color: '064E3B', fontFace: 'Inter', lineSpacing: 16 });


// --- SLIDE 9: VISUAL WORKFLOW with Mini Screenshots ---
const s9 = pptx.addSlide({ masterName: 'MASTER' });
header(s9, 'HOW DOES IT WORK? - COMPLETE DATA PIPELINE');

s9.addText('Every patient visit triggers an automated chain reaction. Background sync threads poll every 10-15 seconds:', {
  x: 0.6, y: 1.1, w: 12.1, h: 0.35, fontSize: 11, italic: true, color: C.MUTED, fontFace: 'Inter'
});

// Stage 1: OPD Card
flowNode(s9, 0.3, 1.7, 2.0, 0.7, 'Step 1\nOPD Card Form', C.PRIMARY, C.WHITE, { fontSize: 10 });
s9.addImage({ path: SS.opdcard, x: 0.3, y: 2.5, w: 2.0, h: 1.12 });
s9.addText('Patient Registration', { x: 0.3, y: 3.65, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

arrow(s9, 2.5, 2.85, 'right', C.BLUE);
s9.addText('Auto-Sync\n10 sec', { x: 2.45, y: 2.45, w: 0.5, h: 0.4, fontSize: 7, color: C.BLUE, fontFace: 'Inter', bold: true, align: 'center' });

// Stage 2: OPD Tally
flowNode(s9, 3.1, 1.7, 2.0, 0.7, 'Step 2\nOPD Daily Tally', C.BG_CYAN, C.PRIMARY, { border: C.BD_CYAN, fontSize: 10 });
s9.addImage({ path: SS.opd, x: 3.1, y: 2.5, w: 2.0, h: 1.12 });
s9.addText('Patient Log Sheet', { x: 3.1, y: 3.65, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

arrow(s9, 5.3, 2.85, 'right', C.GREEN);
s9.addText('Auto-Sync\n10 sec', { x: 5.25, y: 2.45, w: 0.5, h: 0.4, fontSize: 7, color: C.GREEN, fontFace: 'Inter', bold: true, align: 'center' });

// Stage 3: Dispense
flowNode(s9, 5.9, 1.7, 2.0, 0.7, 'Step 3\nDispense Queue', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 10 });
s9.addImage({ path: SS.dispense, x: 5.9, y: 2.5, w: 2.0, h: 1.12 });
s9.addText('Pharmacy Queue', { x: 5.9, y: 3.65, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

arrow(s9, 8.1, 2.85, 'right', C.GREEN);

// Stage 4: Medicine Consume
flowNode(s9, 8.6, 1.7, 2.0, 0.7, 'Step 4\nMedicine Consume', C.BG_GREEN, '14532D', { border: C.BD_GREEN, fontSize: 10 });
s9.addImage({ path: SS.medconsume, x: 8.6, y: 2.5, w: 2.0, h: 1.12 });
s9.addText('Consumption Grid', { x: 8.6, y: 3.65, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

arrow(s9, 10.8, 2.85, 'right', C.RED);

// Stage 5: Daily Consume
flowNode(s9, 11.1, 1.7, 2.0, 0.7, 'Step 5\nDaily Consume', 'FEE2E2', '991B1B', { border: 'FCA5A5', fontSize: 10 });
s9.addImage({ path: SS.shift, x: 11.1, y: 2.5, w: 2.0, h: 1.12 });
s9.addText('Stock Deduction', { x: 11.1, y: 3.65, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

// Second row: Downstream outputs
arrow(s9, 2.7, 4.1, 'down', C.BLUE);
arrow(s9, 7.5, 4.1, 'down', C.BLUE);
arrow(s9, 12.0, 4.1, 'down', C.RED);

// Stage 6: Monthly Balance
flowNode(s9, 0.3, 4.6, 2.0, 0.7, 'Step 6\nMonthly Balance', C.BG_CYAN, '0369A1', { border: C.BD_CYAN, fontSize: 10 });
s9.addImage({ path: SS.monthlybalance, x: 0.3, y: 5.4, w: 2.0, h: 1.12 });
s9.addText('Yearly Ledger', { x: 0.3, y: 6.55, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

// Stock Register
flowNode(s9, 5.5, 4.6, 2.0, 0.7, 'Medicine Stock\nRegister', C.BG_EMERALD, '064E3B', { border: C.BD_GREEN, fontSize: 10 });
s9.addImage({ path: SS.inventory, x: 5.5, y: 5.4, w: 2.0, h: 1.12 });
s9.addText('Inventory Tracking', { x: 5.5, y: 6.55, w: 2.0, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

// MIS Report
flowNode(s9, 10.5, 4.6, 2.5, 0.7, 'Step 7\nMonthly MIS Report', C.GREEN, C.WHITE, { fontSize: 10 });
s9.addImage({ path: SS.mis, x: 10.5, y: 5.4, w: 2.5, h: 1.12 });
s9.addText('Analytics & Compliance', { x: 10.5, y: 6.55, w: 2.5, h: 0.2, fontSize: 7.5, color: C.MUTED, fontFace: 'Inter', align: 'center' });

// Connecting arrows between bottom row items
arrow(s9, 2.5, 5.7, 'right', '94A3B8');
arrow(s9, 4.0, 5.7, 'right', '94A3B8');
arrow(s9, 7.7, 5.7, 'right', '94A3B8');
arrow(s9, 9.2, 5.7, 'right', '94A3B8');


// --- SLIDE 10: OPD Card Form (Full Screenshot) ---
const s10 = pptx.addSlide({ masterName: 'MASTER' });
header(s10, 'SCREEN: OPD CARD - PATIENT REGISTRATION FORM');
s10.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

addScreenshot(s10, SS.opdcard, 0.4, 1.2, 7.5, 4.22, 'OPD Card Form - Patient vitals, diagnosis, medicines, and doctor assignment');

s10.addText('Key Features:', { x: 8.2, y: 1.2, w: 4.5, h: 0.35, fontSize: 13, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s10.addText(
  '- Auto-generates unique OPD-XXX IDs\n' +
  '- Captures 23 data fields per visit\n' +
  '- Vitals: Temp, SPO2, PR, BP, Weight\n' +
  '- Medicines with dosage parsing\n' +
  '- Auto-save with 1.5s debounce\n' +
  '- Printable card with Jindal logo\n' +
  '- Multi-card tabbed interface\n' +
  '- Regex quantity extraction\n' +
  '- Background sync to OPD Tally\n' +
  '- Sets extracted=false flag for\n  pharmacy auto-extraction', {
  x: 8.2, y: 1.6, w: 4.5, h: 4.5, fontSize: 10.5, color: C.DARK, fontFace: 'Inter', lineSpacing: 16
});

// Flow indicator at bottom
flowNode(s10, 0.4, 5.8, 3.5, 0.8, 'OPD Card saves patient data\n-> extracted = false', C.PRIMARY, C.WHITE, { fontSize: 10 });
arrow(s10, 4.1, 6.0, 'right', C.GREEN);
flowNode(s10, 4.6, 5.8, 3.8, 0.8, 'Auto-Sync extracts (10s)\n-> Dispense Queue populated', C.BG_AMBER, 'B45309', { border: C.BD_AMBER, fontSize: 10 });
arrow(s10, 8.6, 6.0, 'right', C.GREEN);
flowNode(s10, 9.0, 5.8, 3.8, 0.8, 'Pharmacist sees pending items\n-> Status: Pending/Pushed', C.BG_EMERALD, '064E3B', { border: C.BD_GREEN, fontSize: 10 });


// --- SLIDE 11: OPD Tally + Dispense Side by Side ---
const s11 = pptx.addSlide({ masterName: 'MASTER' });
header(s11, 'SCREEN: OPD DAILY TALLY & DISPENSE QUEUE');

addScreenshot(s11, SS.opd, 0.4, 1.2, 6.0, 3.38, 'Daily OPD Tally - 30+ column patient register (ExcelGrid)');
addScreenshot(s11, SS.dispense, 6.8, 1.2, 6.0, 3.38, 'Dispense Medicine Queue - Auto-extracted prescriptions');

// Connecting arrow
s11.addShape(pptx.shapes.RIGHT_ARROW, { x: 6.3, y: 2.5, w: 0.6, h: 0.6, fill: { color: C.GREEN } });
s11.addText('Auto-Sync\n10 sec', { x: 6.25, y: 3.2, w: 0.7, h: 0.4, fontSize: 8, bold: true, color: C.GREEN, fontFace: 'Inter', align: 'center' });

// Description at bottom
s11.addText('The OPD Tally records every patient visit with 30+ columns (demographics, vitals, diagnosis, treatment). The Dispense Queue auto-extracts pending prescriptions every 10 seconds using the "extracted" boolean flag. Each prescription is extracted exactly once - re-editing an OPD card resets the flag for re-sync.', {
  x: 0.4, y: 5.0, w: 12.5, h: 1.0, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 18
});

s11.addText('Data Fields Transferred:', { x: 0.4, y: 6.1, w: 3.0, h: 0.3, fontSize: 10, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s11.addText('Patient Name, Gender, Age, Emp ID, Company, Department, Diagnosis, Medicines, Qty, Dosage, Dr. Name, Charges, Date', {
  x: 3.2, y: 6.1, w: 9.5, h: 0.3, fontSize: 10, color: C.DARK, fontFace: 'Inter'
});


// --- SLIDE 12: Medicine Consume + Daily Consume ---
const s12 = pptx.addSlide({ masterName: 'MASTER' });
header(s12, 'SCREEN: CONSUMPTION GRID & DAILY STOCK DEDUCTION');

addScreenshot(s12, SS.medconsume, 0.4, 1.2, 6.0, 3.38, 'Medicine Consumption Grid - 31-day x 7-section x 4-shift matrix');
addScreenshot(s12, SS.shift, 6.8, 1.2, 6.0, 3.38, 'Daily Consume - Auto stock deduction & balance update');

s12.addShape(pptx.shapes.RIGHT_ARROW, { x: 6.3, y: 2.5, w: 0.6, h: 0.6, fill: { color: C.RED } });
s12.addText('Deduct\n15 sec', { x: 6.25, y: 3.2, w: 0.7, h: 0.4, fontSize: 8, bold: true, color: C.RED, fontFace: 'Inter', align: 'center' });

// Section Classification
s12.addText('Section Classification:', { x: 0.4, y: 5.0, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
const sections = [
  ['OHC Counter', 'Default prescriptions'],
  ['Dressing/Casualty', '"dress", "wound", "burn"'],
  ['Life Saving', '"emergency", "critical"'],
  ['First Aid', '"first aid", "minor"'],
  ['Physiotherapy', '"physio", "therapy"'],
  ['PME', '"checkup", "periodic"'],
  ['Expiry/Waste', '"expired", "waste"'],
];
sections.forEach((s, i) => {
  const col = Math.floor(i / 4);
  const row = i % 4;
  const xPos = 0.4 + col * 4.5;
  const yPos = 5.4 + row * 0.35;
  s12.addText(`${s[0]}:`, { x: xPos, y: yPos, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: C.DARK, fontFace: 'Inter' });
  s12.addText(s[1], { x: xPos + 1.5, y: yPos, w: 2.8, h: 0.3, fontSize: 9, color: C.MUTED, fontFace: 'Inter' });
});

// Shift info
s12.addText('Shift Detection:', { x: 9.0, y: 5.0, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s12.addText('A: 06:00-14:00  |  B: 14:00-22:00\nC: 22:00-06:00  |  General: Default', {
  x: 9.0, y: 5.4, w: 4.0, h: 0.7, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 18
});


// --- SLIDE 13: Monthly Balance + Stock Register ---
const s13 = pptx.addSlide({ masterName: 'MASTER' });
header(s13, 'SCREEN: MONTHLY BALANCE LEDGER & STOCK REGISTER');

addScreenshot(s13, SS.monthlybalance, 0.4, 1.2, 6.0, 3.38, 'Monthly Balance - 12-month incoming/outgoing/balance per medicine');
addScreenshot(s13, SS.inventory, 6.8, 1.2, 6.0, 3.38, 'Medicine Stock Register - Inventory, batch, expiry tracking');

s13.addText('The Monthly Balance Ledger tracks every medicine across 12 months with:\n- Initial Balance + Monthly Incoming + Monthly Outgoing = Running Balance\n- Auto-calculated from Daily Consume deductions\n- Yearly grand totals computed automatically', {
  x: 0.4, y: 5.0, w: 6.0, h: 1.5, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 17
});

s13.addText('The Stock Register provides real-time inventory with:\n- Medicine Name, Batch No, Manufacturer, Category\n- Quantity, Unit, Purchase Price, MRP\n- Expiry Date + Auto-Status (Active/Near-Expiry/Expired)\n- Color-coded expiry alerts (Green/Yellow/Red)', {
  x: 6.8, y: 5.0, w: 6.0, h: 1.5, fontSize: 11, color: C.DARK, fontFace: 'Inter', lineSpacing: 17
});


// --- SLIDE 14: MIS Report (Full Screenshot) ---
const s14 = pptx.addSlide({ masterName: 'MASTER' });
header(s14, 'SCREEN: MONTHLY MIS REPORT & ANALYTICS');
s14.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

addScreenshot(s14, SS.mis, 0.4, 1.2, 8.0, 4.5, 'MIS Report - Auto-aggregated statistics, charts, and compliance data');

s14.addText('Auto-Aggregates from 8+ Sources:', { x: 8.8, y: 1.2, w: 4.0, h: 0.35, fontSize: 12, bold: true, color: C.PRIMARY, fontFace: 'Inter' });

const misSources = [
  { name: 'Daily OPD Sheets', color: C.BG_CYAN, tc: C.PRIMARY },
  { name: 'Medicine Stock', color: C.BG_EMERALD, tc: '064E3B' },
  { name: 'Monthly Consume', color: C.BG_GREEN, tc: '14532D' },
  { name: 'Medicine Incoming', color: C.BG_YELLOW, tc: '78350F' },
  { name: 'Injury Reports', color: C.BG_RED, tc: '7F1D1D' },
  { name: 'Ambulance Dispatch', color: C.BG_RED, tc: '7F1D1D' },
  { name: 'BMW Waste Logs', color: C.BG_AMBER, tc: 'B45309' },
  { name: 'Health Certificates', color: C.BG_CYAN, tc: C.PRIMARY },
];
misSources.forEach((src, i) => {
  const yPos = 1.7 + i * 0.45;
  s14.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.8, y: yPos, w: 3.8, h: 0.38, fill: { color: src.color }, line: { color: C.BD_SLATE, width: 0.5 } });
  s14.addText(src.name, { x: 8.9, y: yPos, w: 3.6, h: 0.38, fontSize: 9.5, bold: true, color: src.tc, fontFace: 'Inter', valign: 'middle' });
});

s14.addText('Outputs:', { x: 8.8, y: 5.4, w: 4.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s14.addText('- Bar Charts (Dept visits, 7-day trends)\n- Trend Analysis (Month-over-month %)\n- CSV / PDF Export (One-click compliance)\n- Auto Observations (AI-generated text)', {
  x: 8.8, y: 5.7, w: 4.0, h: 1.5, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 16
});


// --- SLIDE 15: Clinical Records + System Health ---
const s15 = pptx.addSlide({ masterName: 'MASTER' });
header(s15, 'SCREEN: CLINICAL RECORDS & SYSTEM HEALTH');

addScreenshot(s15, SS.clinical, 0.4, 1.2, 6.0, 3.38, 'Clinical Records - 9 tabbed sub-modules for compliance registers');
addScreenshot(s15, SS.systemhealth, 6.8, 1.2, 6.0, 3.38, 'System Health Tool - Storage diagnostics & data flow visualization');

s15.addText('Clinical Records hosts 9 compliance registers:', { x: 0.4, y: 5.0, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15.addText('Injury Reports | Vital Signs | Employee Health | Annual Checkup\nOcc. Disease | Emergency Ambulance | First Aid Box | Patient Visits | Health Certificates', {
  x: 0.4, y: 5.35, w: 6.0, h: 0.7, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 16
});

s15.addText('System Health provides:', { x: 6.8, y: 5.0, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15.addText('- Storage quota monitoring (70%/90% alerts)\n- Data flow visualization diagrams\n- IDB to localStorage migration tools\n- Cleanup & optimization utilities', {
  x: 6.8, y: 5.35, w: 6.0, h: 0.9, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 16
});


// --- NEW SLIDE: Spreadsheet calculations ---
const s15_formulas = pptx.addSlide({ masterName: 'MASTER' });
header(s15_formulas, 'SPREADSHEET ENGINE: FORMULAS & DYNAMIC TOTALS');
s15_formulas.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

addScreenshot(s15_formulas, SS.opd, 0.4, 1.2, 7.5, 4.22, 'OPD Register - ExcelGrid spreadsheet featuring formula totals and cell resizing');

s15_formulas.addText('Virtual Grid Features:', { x: 8.2, y: 1.2, w: 4.5, h: 0.35, fontSize: 13, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15_formulas.addText(
  '• Custom Formula Engine:\n  Evaluates cell formulas dynamically on change (e.g., =SUM(A1:B20), =A1+B2) with circular reference protection.\n\n' +
  '• Real-time Calculations:\n  Auto-computes sums, average values, counts, and other metrics instantly across columns/ranges.\n\n' +
  '• Smooth Virtual Scroll:\n  Renders only cells within the viewport, maintaining 60fps interaction speeds with 10,000+ data rows.\n\n' +
  '• Complete Formatting Tools:\n  Supports inline cell edit, undo/redo, text style (bold, italic, underline), alignments, and column resize.', {
  x: 8.2, y: 1.6, w: 4.5, h: 4.5, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});


// --- NEW SLIDE: Exporting and Printing ---
const s15_exports = pptx.addSlide({ masterName: 'MASTER' });
header(s15_exports, 'COMPLIANCE EXPORTS: EXCEL (.XLSX) & PDF PRINTING');
s15_exports.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

addScreenshot(s15_exports, SS.mis, 0.4, 1.2, 7.5, 4.22, 'MIS Report - Instant export actions to generate Excel and PDF formats');

s15_exports.addText('Export & Printing Capabilities:', { x: 8.2, y: 1.2, w: 4.5, h: 0.35, fontSize: 13, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15_exports.addText(
  '• Binary Excel Export:\n  Compiles grid matrices directly into standard Excel binary streams utilizing the SheetJS (xlsx) library.\n\n' +
  '• Headless PDF Print Bridge:\n  Intercepts print actions and routes them to Electron native printToPDF engine to save clean, margin-adjusted local PDFs.\n\n' +
  '• Audit-Ready Compliance formats:\n  Standardizes all exports to match mandatory Factories Act, 1948 schedules for inspectors.\n\n' +
  '• Print-Optimized Slips:\n  Renders specialized printable sheets (like OPD prescription slips) with embedded corporate logos.', {
  x: 8.2, y: 1.6, w: 4.5, h: 4.5, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});


// --- NEW SLIDE: Backup & Restore ---
const s15_backup = pptx.addSlide({ masterName: 'MASTER' });
header(s15_backup, 'DATA SECURITY: OFFLINE BACKUP & RESTORE');
s15_backup.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

addScreenshot(s15_backup, SS.backup, 0.4, 1.2, 7.5, 4.22, 'Backup & Restore View - Single-file import and export operations');

s15_backup.addText('Database Protection:', { x: 8.2, y: 1.2, w: 4.5, h: 0.35, fontSize: 13, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s15_backup.addText(
  '• Complete Database Dump:\n  Compresses and exports all 20+ IndexedDB and localStorage sheets into a single structured JSON file.\n\n' +
  '• Safe Import Validator:\n  Checks column headers, metadata, and auto-increment keys before restoring data to prevent corruption.\n\n' +
  '• Auto-Backup Safeguards:\n  Automatically saves DB snapshots in browser-isolated IndexedDB pools to safeguard against administrative errors.\n\n' +
  '• Seamless Database Migration:\n  Allows easy backup transfers of entire inventories and clinical history between clinical PCs offline.', {
  x: 8.2, y: 1.6, w: 4.5, h: 4.5, fontSize: 10, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});


// --- SLIDE 16: System Architecture ---
const s16 = pptx.addSlide({ masterName: 'MASTER' });
header(s16, 'SYSTEM ARCHITECTURE: ELECTRON + REACT + INDEXEDDB');
s16.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

// Sub-header explanation
s16.addText('How user data flows securely from the clinical screen to the local database offline:', {
  x: 0.6, y: 1.0, w: 12.1, h: 0.35, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

// Step 1: User Interface
card(
  s16,
  0.5, 1.6, 2.5, 5.0,
  C.BG_BLUE, C.BD_BLUE,
  '1. USER INTERFACE\nReact 19 & Vite 8',
  '• OPD Form & Grid: Captures vitals entry, patient details, and printer commands.\n\n• Keystroke Engine: Binds keyboard shortcuts for quick cell navigation.\n\n• Live Analytics: Local state updates the Dashboard & KPI counters instantly.',
  C.PRIMARY, C.TEXT
);

arrow(s16, 3.15, 3.85, 'right', C.BLUE);

// Step 2: Preload Bridge
card(
  s16,
  3.65, 1.6, 2.5, 5.0,
  C.BG_AMBER, C.BD_AMBER,
  '2. SECURITY BRIDGE\nPreload IPC Bridge',
  '• Context Isolation: Blocks direct renderer access to Node.js for security.\n\n• API Gatekeeper: Sanitizes and translates front-end UI data requests.\n\n• IPC Channels: Safely routes messages between UI and Native desktop processes.',
  'B45309', C.TEXT
);

arrow(s16, 6.3, 3.85, 'right', C.BLUE);

// Step 3: Desktop Main
card(
  s16,
  6.8, 1.6, 2.5, 5.0,
  C.SLATE, C.BD_SLATE,
  '3. DESKTOP MAIN\nElectron Process',
  '• Window Controller: Manages desktop windows, menus, and taskbar icons.\n\n• Native Integrations: Triggers OS file dialogs (Save/Open) and print-to-PDF.\n\n• Update Engine: Check auto-update flags and NSIS installer configs.',
  C.PRIMARY, C.TEXT
);

arrow(s16, 9.45, 3.85, 'right', C.BLUE);

// Step 4: Storage & Files
card(
  s16,
  9.95, 1.6, 2.8, 5.0,
  C.BG_GREEN, C.BD_GREEN,
  '4. OFFLINE STORAGE\nIndexedDB & Disk',
  '• sheetDB.js: Saves logs locally in browser-native IndexedDB database.\n\n• Native fs System: Auto-saves data backup JSON files directly onto disk.\n\n• Quota Bypass: Easily bypasses 5MB limits to store 100,000+ clinical logs.',
  '14532D', C.TEXT
);



// --- SLIDE 17: Languages Used ---
const s17 = pptx.addSlide({ masterName: 'MASTER' });
header(s17, 'PROGRAMMING LANGUAGES & DATA FORMATS USED');
s17.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });

const techStack = [
  { cat: 'JavaScript (ES6+)', tech: 'Primary Programming Language', desc: 'Used for Electron main process backend, preload script bridges, IndexedDB wrapper connection pools, automatic date parsing, and CSV/PDF export engines.', fill: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { cat: 'JSX (React Syntax Extension)', tech: 'Component UI Declarative Language', desc: 'Defines the UI structure, reactive states, and DOM lifecycle operations across all 35 custom components, including the ExcelGrid spreadsheet and Dashboard panels.', fill: C.BG_CYAN, border: C.BD_CYAN, tc: C.PRIMARY },
  { cat: 'HTML5', tech: 'Web Document Markup', desc: 'Provides the application index document skeleton, links script assets, and handles native SVG vector graphics rendering (such as vector clinic logos).', fill: C.BG_AMBER, border: C.BD_AMBER, tc: 'B45309' },
  { cat: 'CSS3 (Vanilla CSS)', tech: 'Component Cascading Styles', desc: 'Powers the complete layout design system, color themes, responsive layouts, active cell borders, sidebar hover effects, and printer output CSS rules.', fill: C.BG_GREEN, border: C.BD_GREEN, tc: '14532D' },
  { cat: 'JSON', tech: 'Configuration & Data Structures', desc: 'Used for application dependencies, build scripts, packaging configurations (package.json), local settings data caches, and backup exports.', fill: C.BG_YELLOW, border: C.BD_AMBER, tc: '78350F' },
  { cat: 'IndexedDB API / NoSQL queries', tech: 'Local Database Manipulation', desc: 'Custom sheetDB.js connection pool schemas used for client-side logging, updating medicine stock registers, and aggregating MIS tables offline.', fill: C.BG_ROSE, border: C.BD_RED, tc: '9F1239' },
];
techStack.forEach((t, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const xPos = 0.4 + col * 6.3;
  const yPos = 1.4 + row * 1.7;
  s17.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos, y: yPos, w: 6.0, h: 1.4, fill: { color: t.fill }, line: { color: t.border, width: 1 } });
  s17.addText(`${t.cat}  |  ${t.tech}`, { x: xPos + 0.15, y: yPos + 0.05, w: 5.7, h: 0.4, fontSize: 11, bold: true, color: t.tc, fontFace: 'Inter' });
  s17.addText(t.desc, { x: xPos + 0.15, y: yPos + 0.45, w: 5.7, h: 0.85, fontSize: 9.5, color: C.DARK, fontFace: 'Inter', lineSpacing: 14 });
});


// --- SLIDE 18: Compliance Registers ---
const s18 = pptx.addSlide({ masterName: 'MASTER' });
header(s18, '12 HEALTH & SAFETY COMPLIANCE REGISTERS');
s18.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.15, w: 2.0, h: 0.8 });

s18.addText('JSPulse OHMS digitizes every mandatory clinical register required under the Factories Act, 1948:', {
  x: 0.6, y: 1.1, w: 10.0, h: 0.4, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

const registers = [
  { icon: '[OPD]', name: 'Daily OPD Tally', desc: 'Patient vitals, diagnosis, treatment per day.' },
  { icon: '[RX]', name: 'Pharmacy Dispensing', desc: 'Auto-synced prescription queue.' },
  { icon: '[STK]', name: 'Medicine Stock Register', desc: 'Inventory, batch, expiry alerts.' },
  { icon: '[QTY]', name: 'Daily Consumption', desc: '31-day x 7-section x 4-shift grids.' },
  { icon: '[BAL]', name: 'Monthly Balance Ledger', desc: '12-month running balance tracking.' },
  { icon: '[PME]', name: 'Annual Health Checkups', desc: 'PME records: vision, lung, audio.' },
  { icon: '[INJ]', name: 'Injury Report Logs', desc: 'Incidents with department & nature.' },
  { icon: '[AMB]', name: 'Ambulance Dispatch', desc: 'Emergency callout timestamps.' },
  { icon: '[OCC]', name: 'Occupational Disease', desc: 'Disease tracking & health records.' },
  { icon: '[BOX]', name: 'First Aid Box Tracker', desc: 'Emergency kit audits.' },
  { icon: '[CRT]', name: 'Health Certificates', desc: 'Certification expiry & renewal.' },
  { icon: '[WST]', name: 'Biomedical Waste Log', desc: 'BMW segregation (Y/R/B bags).' },
];
registers.forEach((r, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const xPos = 0.4 + col * 4.15;
  const yPos = 1.7 + row * 1.2;
  s18.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos, y: yPos, w: 3.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BD_SLATE, width: 1 } });
  s18.addText(`${r.icon}  ${r.name}`, { x: xPos + 0.1, y: yPos + 0.05, w: 3.7, h: 0.35, fontSize: 11, bold: true, color: C.DARK, fontFace: 'Inter' });
  s18.addText(r.desc, { x: xPos + 0.1, y: yPos + 0.4, w: 3.7, h: 0.5, fontSize: 9.5, color: C.MUTED, fontFace: 'Inter' });
});


// --- SLIDE 19: Background Sync Engine ---
const s19 = pptx.addSlide({ masterName: 'MASTER' });
header(s19, 'AUTOMATION ENGINE: BACKGROUND SYNC INTERVALS');

s19.addText('JSPulse runs 6 independent background timer threads creating a chain-reaction automation pipeline:', {
  x: 0.6, y: 1.1, w: 12.1, h: 0.4, fontSize: 12, italic: true, color: C.MUTED, fontFace: 'Inter'
});

const syncRows = [
  [{ text: 'Module', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Interval', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Action Performed', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Data Source -> Target', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } }],
  ['OPD Counter', '10 sec', 'Reload today\'s patient count', 'cms_daily_opd_sheet -> Display'],
  ['Dispense Medicine', '10 sec', 'Extract new prescriptions from OPD', 'cms_daily_opd_sheet -> cms_dispense_log'],
  ['Daily Consume (Extract)', '10 sec', 'Pull pending items from Dispense', 'cms_dispense_log -> cms_monthly_consume'],
  ['Daily Consume (Deduct)', '15 sec', 'Deduct from Stock + update Balance', 'cms_monthly_consume -> Stock + Balance'],
  ['Daily Consume (Pending)', '2 sec', 'Check for pending deduction items', 'Internal state check'],
  ['Dashboard', '30 sec', 'Reload all KPI metrics and alerts', 'All stores -> Dashboard display'],
];
s19.addTable(syncRows, {
  x: 0.6, y: 1.7, w: 12.1, h: 3.5, fontSize: 11, fontFace: 'Inter', align: 'left',
  border: { color: C.BD_SLATE, width: 1 }, colW: [2.5, 1.1, 4.2, 4.3]
});

// Timeline
s19.addText('Timeline (Per 30-Second Window):', { x: 0.5, y: 5.3, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: C.PRIMARY, fontFace: 'Inter' });
s19.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 5.8, w: 12.3, h: 0.08, fill: { color: C.BD_SLATE } });
for (let i = 0; i <= 6; i++) {
  const xPos = 0.5 + i * 2.05;
  s19.addShape(pptx.shapes.RECTANGLE, { x: xPos, y: 5.7, w: 0.02, h: 0.25, fill: { color: C.MUTED } });
  s19.addText(`${i * 5}s`, { x: xPos - 0.15, y: 5.95, w: 0.4, h: 0.2, fontSize: 8, color: C.MUTED, fontFace: 'Inter', align: 'center' });
}

const syncEvents = [
  { x: 0.5, color: C.GREEN }, { x: 4.6, color: C.GREEN }, { x: 8.7, color: C.GREEN },
  { x: 6.65, color: C.RED }, { x: 12.4, color: C.BLUE },
];
syncEvents.forEach(e => {
  s19.addShape(pptx.shapes.OVAL, { x: e.x - 0.06, y: 5.74, w: 0.15, h: 0.15, fill: { color: e.color } });
});

s19.addShape(pptx.shapes.OVAL, { x: 0.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.GREEN } });
s19.addText('= Extract sync (10s)', { x: 0.75, y: 6.3, w: 2.0, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });
s19.addShape(pptx.shapes.OVAL, { x: 3.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.RED } });
s19.addText('= Stock deduct (15s)', { x: 3.75, y: 6.3, w: 2.0, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });
s19.addShape(pptx.shapes.OVAL, { x: 6.5, y: 6.3, w: 0.15, h: 0.15, fill: { color: C.BLUE } });
s19.addText('= Dashboard refresh (30s)', { x: 6.75, y: 6.3, w: 2.5, h: 0.2, fontSize: 9, color: C.DARK, fontFace: 'Inter' });


// --- SLIDE 20: Outcomes ---
const s20 = pptx.addSlide({ masterName: 'MASTER' });
header(s20, 'PROJECT OUTCOMES: MEASURABLE IMPROVEMENTS');
s20.addImage({ path: LOGO_JSPULSE, x: 11.8, y: 0.15, w: 0.65, h: 0.65 });
s20.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.15, w: 1.2, h: 0.6 });

const outcomeRows = [
  [{ text: 'Operational Area', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Before (Paper)', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'After (JSPulse OHMS)', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } },
   { text: 'Impact', options: { bold: true, fill: C.PRIMARY, color: C.WHITE } }],
  ['OPD Patient Logging', '2 min per entry (handwritten)', '15 sec (digital form + auto-ID)', '87% faster'],
  ['Prescription to Pharmacy', '60 sec manual copy + errors', 'Auto-sync every 10 seconds', '100% accurate'],
  ['Stock Inventory Check', 'Physical inspection daily', 'Live counts + expiry alerts', 'Zero errors'],
  ['Monthly MIS Report', '4-6 hours manual compilation', 'One-click auto-aggregation', '98% time saved'],
  ['Compliance Audit', 'Hours of ledger searching', 'Instant PDF/Excel export', 'Audit-ready'],
  ['Data Storage', 'Paper ledgers (fire/water risk)', 'IndexedDB + disk backup', 'Zero data loss'],
  ['Network Dependency', 'Cloud apps crash on outage', '100% offline operation', 'Zero downtime'],
];
s20.addTable(outcomeRows, {
  x: 0.6, y: 1.2, w: 12.1, h: 4.8, fontSize: 11, fontFace: 'Inter', align: 'left',
  border: { color: C.BD_SLATE, width: 1 }, colW: [2.6, 2.8, 3.2, 2.0]
});
s20.addText('JSPulse OHMS eliminates 100% of paper transcription errors and ensures complete regulatory compliance under the Factories Act, 1948.', {
  x: 0.4, y: 6.2, w: 12.5, h: 0.4, fontSize: 12, italic: true, bold: true, color: C.PRIMARY, fontFace: 'Inter', align: 'center'
});


// --- NEW SLIDE: How JSPulse Solves Challenges ---
const s20_solutions = pptx.addSlide({ masterName: 'MASTER' });
header(s20_solutions, 'HOW JSPulse OHMS SOLVES OHC CHALLENGES');

// 3 columns of cards
card(
  s20_solutions,
  0.6, 1.6, 3.7, 4.5,
  C.BG_BLUE, C.BD_BLUE,
  '1. INSTANT REGISTRATION & SYNC',
  '• OPD Card Form: Auto-generates unique OPD IDs and scales to vitals entry in under 15 seconds.\n\n• Automated Sync: Background threads automatically extract prescriptions from doctor logs every 10 seconds, pushing them to the pharmacy queue and eliminating transcription errors.',
  C.PRIMARY, C.TEXT
);

card(
  s20_solutions,
  4.8, 1.6, 3.7, 4.5,
  C.BG_GREEN, C.BD_GREEN,
  '2. REAL-TIME STOCK & BALANCE',
  '• Auto-Deduction: Pharmacy dispensing triggers live medicine stock deduction with fuzzy matching.\n\n• Consumption Grids: 31-day x 7-section x 4-shift grid auto-sums daily consumption, instantly updating monthly balance sheets and preventing critical drug stockouts.',
  '064E3B', C.TEXT
);

card(
  s20_solutions,
  9.0, 1.6, 3.7, 4.5,
  C.BG_CYAN, C.BD_CYAN,
  '3. COMPLIANCE & OFFLINE RESILIENCE',
  '• One-Click Audits: Generate comprehensive MIS reports and PDF/Excel logs instantly to ensure Factories Act, 1948 audit compliance.\n\n• Offline Desktop Shell: Runs locally in Electron, guaranteeing zero downtime and 100% data access during steel plant network or cloud server outages.',
  '0369A1', C.TEXT
);


// --- SLIDE 21: Future Scope & Thank You ---
const s21 = pptx.addSlide();
s21.background = { color: C.WHITE };
s21.addImage({ path: LOGO_JSPULSE, x: 5.9, y: 0.3, w: 1.2, h: 1.2 });
s21.addImage({ path: LOGO_JINDAL, x: 10.5, y: 0.3, w: 2.0, h: 1.0 });

s21.addText('FUTURE SCOPE & RECOMMENDATIONS', { x: 0.5, y: 1.6, w: 12.3, h: 0.5, fontSize: 24, bold: true, color: C.PRIMARY, fontFace: 'Outfit' });
s21.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.2, w: 12.3, h: 0.02, fill: { color: C.BD_SLATE } });

s21.addText(
  '- USB Barcode Scanners - Interface pharmacy barcodes with dispense queues\n\n' +
  '- OCR Prescription Scanner - Camera module to extract text from printed slips\n\n' +
  '- Encrypted Cloud Sync - Background upload when network is available\n\n' +
  '- Mobile Companion App - React Native app for doctors during ward rounds', {
  x: 0.5, y: 2.5, w: 12.3, h: 2.6, fontSize: 12, color: C.DARK, fontFace: 'Inter', lineSpacing: 15
});

s21.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 5.4, w: 12.3, h: 0.05, fill: { color: C.GREEN } });
s21.addText('THANK YOU', { x: 0.5, y: 5.6, w: 12.3, h: 0.5, fontSize: 32, bold: true, color: C.PRIMARY, fontFace: 'Outfit', align: 'center' });
s21.addText('Ashwini Kumar  |  Jindal Steel & Power Ltd.  |  Summer 2026 Internship', {
  x: 0.5, y: 6.2, w: 12.3, h: 0.3, fontSize: 11, color: C.MUTED, fontFace: 'Inter', align: 'center'
});


// --- SLIDE 22: Image Sources ---
const s22 = pptx.addSlide();
s22.background = { color: C.WHITE };
addSlideHeaderReport(s22, 'Image Sources');
const imgSources = [
  { img: RVS_LOGO, url: 'https://www.rvscollege.ac.in/wp-content/uploads/2025/04/RVSCET-Website-295x80-Logo.png', src: 'www.rvscollege.ac.in' },
  { img: PLANT_OVERVIEW, url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/...', src: 'www.patratu.com' },
  { img: BRM_MILL, url: 'https://jindaltmt550.com/images/mp/manufacturing-process-stage-5-mob.webp', src: 'jindaltmt550.com' },
  { img: REBAR_MACHINE, url: 'https://ik.imagekit.io/sctpl/Untitled%20design%20-%202026-02-07T121813.187.png', src: 'www.sonavibrators.com' },
  { img: IT_DEPARTMENT, url: 'https://framerusercontent.com/images/TfHUCkLw85zPq7NPdT2KvJC5CU.jpg', src: 'shieldworkz.com' },
  { img: OHC_COLLAGE, url: 'https://www.jindalstainless.com/wp-content/uploads/2026/04/Inaguration-collage.jpg', src: 'www.jindalstainless.com' },
];
imgSources.forEach((item, idx) => {
  const rowY = 1.4 + idx * 0.95;
  s22.addImage({ path: item.img, x: 0.6, y: rowY, w: 1.2, h: 0.7, sizing: { type: 'cover' } });
  s22.addText(item.url, { x: 2.0, y: rowY, w: 10.7, h: 0.35, fontSize: 9.5, color: C.ACCENT, fontFace: 'Inter' });
  s22.addText(`Source: ${item.src}`, { x: 2.0, y: rowY + 0.35, w: 10.7, h: 0.35, fontSize: 9.5, bold: true, color: C.MUTED, fontFace: 'Inter' });
});


// === SAVE ===
const outPath = path.join(__dirname, 'JSPulse_OHMS_Final_Presentation_v4.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`\nFinal presentation generated:\n${outPath}`);
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
