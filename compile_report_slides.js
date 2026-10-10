import pptxgen from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE_16x9', width: 13.33, height: 7.5 });
pptx.layout = 'WIDE_16x9';

// === CONSTANTS ===
const C = {
  BG_WHITE: 'FFFFFF',
  PRIMARY: '0F172A',    // Slate 900
  TEXT: '334155',       // Slate 700
  MUTED: '64748B',      // Slate 500
  ACCENT: '2563EB',     // Blue 600
  BORDER: 'E2E8F0',     // Slate 200
  LIGHT_BG: 'F8FAFC'    // Slate 50
};

// === ASSETS ===
const RVS_LOGO = path.join(__dirname, 'downloaded_assets/rvs_logo.png');
const PLANT_OVERVIEW = path.join(__dirname, 'downloaded_assets/plant_overview.png');
const BRM_MILL = path.join(__dirname, 'downloaded_assets/brm_mill.webp');
const REBAR_MACHINE = path.join(__dirname, 'downloaded_assets/rebar_machine.png');
const IT_DEPARTMENT = path.join(__dirname, 'downloaded_assets/it_department.jpg');
const OHC_COLLAGE = path.join(__dirname, 'downloaded_assets/ohc_collage.jpg');

// Helpers
function addSlideHeader(slide, title) {
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

function addBulletItem(slide, index, iconText, title, desc) {
  const rowY = 2.05 + index * 1.3;
  
  // Icon Circle
  slide.addShape(pptx.shapes.OVAL, {
    x: 0.6,
    y: rowY + 0.05,
    w: 0.25,
    h: 0.25,
    fill: { color: C.ACCENT }
  });
  
  // Icon symbol inside
  slide.addText(iconText, {
    x: 0.6,
    y: rowY + 0.03,
    w: 0.25,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    fontFace: 'Segoe UI'
  });
  
  // Title
  slide.addText(title, {
    x: 0.95,
    y: rowY,
    w: 5.15,
    h: 0.3,
    fontSize: 14.5,
    bold: true,
    color: C.PRIMARY,
    fontFace: 'Inter'
  });
  
  // Description
  slide.addText(desc, {
    x: 0.95,
    y: rowY + 0.3,
    w: 5.15,
    h: 0.6,
    fontSize: 13.5,
    color: C.TEXT,
    fontFace: 'Inter',
    lineSpacing: 18
  });
}

// ----------------------------------------------------
// SLIDE 1: Cover Page
// ----------------------------------------------------
const s1 = pptx.addSlide();
s1.background = { color: C.BG_WHITE };

// Top-left placeholder 600 x 400
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.6,
  y: 0.6,
  w: 2.0,
  h: 1.33,
  fill: { color: 'F1F5F9' },
  line: { color: C.BORDER, width: 1 }
});
s1.addText('600 × 400', {
  x: 0.6,
  y: 1.1,
  w: 2.0,
  h: 0.3,
  fontSize: 14,
  color: '94A3B8',
  align: 'center',
  fontFace: 'Inter'
});

// Top-right RVS Logo
s1.addImage({
  path: RVS_LOGO,
  x: 10.0,
  y: 0.6,
  w: 2.7,
  h: 0.7,
  sizing: { type: 'contain' }
});

// Middle Texts
s1.addText('INTERNSHIP REPORT', {
  x: 0.6,
  y: 2.4,
  w: 12.13,
  h: 0.7,
  fontSize: 38,
  bold: true,
  color: '1E293B',
  align: 'center',
  fontFace: 'Outfit'
});

s1.addText('A report submitted in partial fulfillment of the requirements for the Award of Degree of Bachelor of Technology in Computer Science and Engineering', {
  x: 0.6,
  y: 3.2,
  w: 12.13,
  h: 0.6,
  fontSize: 15,
  color: C.TEXT,
  align: 'center',
  fontFace: 'Inter',
  lineSpacing: 22
});

s1.addText('By: ASHWINI KUMAR', {
  x: 0.6,
  y: 4.1,
  w: 12.13,
  h: 0.3,
  fontSize: 16.5,
  bold: true,
  color: C.PRIMARY,
  align: 'center',
  fontFace: 'Inter'
});

s1.addText('Roll no: CSE/58/24  |  4th Semester', {
  x: 0.6,
  y: 4.45,
  w: 12.13,
  h: 0.3,
  fontSize: 15.5,
  color: C.PRIMARY,
  align: 'center',
  fontFace: 'Inter'
});

// Bottom-left Submitted To
s1.addText('SUBMITTED TO', {
  x: 0.6,
  y: 5.8,
  w: 5.5,
  h: 0.2,
  fontSize: 10,
  bold: true,
  color: C.MUTED,
  fontFace: 'Inter'
});
s1.addText('RVS College of Engineering and Technology, Jamshedpur', {
  x: 0.6,
  y: 6.05,
  w: 5.5,
  h: 0.5,
  fontSize: 13.5,
  bold: true,
  color: '1E3A8A',
  fontFace: 'Inter'
});

// Bottom-right Duration & Supervision
s1.addText('DURATION & SUPERVISION', {
  x: 6.8,
  y: 5.8,
  w: 5.9,
  h: 0.2,
  fontSize: 10,
  bold: true,
  color: C.MUTED,
  fontFace: 'Inter'
});
s1.addText('Under Supervision: Mr. Deepak Kumar (HOD, IT Dept., Jindal Steel, Patratu)\nDuration: 1st June 2026 to 30th June 2026', {
  x: 6.8,
  y: 6.05,
  w: 5.9,
  h: 0.6,
  fontSize: 13.5,
  bold: true,
  color: '1E3A8A',
  fontFace: 'Inter',
  lineSpacing: 18
});


// ----------------------------------------------------
// SLIDE 2: Plant Overview
// ----------------------------------------------------
const s2 = pptx.addSlide();
s2.background = { color: C.BG_WHITE };
addSlideHeader(s2, 'Plant Overview');

s2.addText('The Jindal Steel Plant in Patratu is a facility focused on advanced steel production and downstream processing, integrating cutting-edge technology for industrial efficiency and safety.', {
  x: 0.6,
  y: 2.2,
  w: 5.5,
  h: 3.5,
  fontSize: 16.5,
  color: C.TEXT,
  fontFace: 'Inter',
  lineSpacing: 25
});

s2.addImage({
  path: PLANT_OVERVIEW,
  x: 6.6,
  y: 2.0,
  w: 6.13,
  h: 4.2
});


// ----------------------------------------------------
// SLIDE 3: Production: Bar & Wire Rod Mills
// ----------------------------------------------------
const s3 = pptx.addSlide();
s3.background = { color: C.BG_WHITE };
addSlideHeader(s3, 'Production: Bar & Wire Rod Mills');

addBulletItem(s3, 0, '✓', 'Bar Rod Mill (BRM):', 'High-capacity TMT production line for construction reinforcement.');
addBulletItem(s3, 1, '✓', 'Wire Rod Mill (WRM):', 'Specialized unit for precision wire rod manufacturing.');
addBulletItem(s3, 2, '✓', 'Quality Control:', 'Advanced rolling processes ensuring uniform material strength and quality.');

s3.addImage({
  path: BRM_MILL,
  x: 6.6,
  y: 2.0,
  w: 6.13,
  h: 4.2
});


// ----------------------------------------------------
// SLIDE 4: Downstream: Rebar Service Centre
// ----------------------------------------------------
const s4 = pptx.addSlide();
s4.background = { color: C.BG_WHITE };
addSlideHeader(s4, 'Downstream: Rebar Service Centre');

addBulletItem(s4, 0, '⚙', 'Cut & Bend:', 'Fully customized, pre-processed rebar to site specifications.');
addBulletItem(s4, 1, '⚙', 'Weld Mesh:', 'High-strength mesh support for civil infrastructure.');
addBulletItem(s4, 2, '⚙', 'Supply Efficiency:', 'Optimizing site operations by reducing construction scrap significantly.');

s4.addImage({
  path: REBAR_MACHINE,
  x: 6.6,
  y: 2.0,
  w: 6.13,
  h: 4.2
});


// ----------------------------------------------------
// SLIDE 5: Department: IT Department
// ----------------------------------------------------
const s5 = pptx.addSlide();
s5.background = { color: C.BG_WHITE };
addSlideHeader(s5, 'Department: IT Department');

addBulletItem(s5, 0, '品', 'Network Infrastructure:', 'Managing the robust industrial communication network.');
addBulletItem(s5, 1, '品', 'Enterprise Operations:', 'Supporting SAP, production scheduling, and inventory systems.');
addBulletItem(s5, 2, '品', 'Cybersecurity:', 'Ensuring a secure environment for all OT/IT industrial data.');

s5.addImage({
  path: IT_DEPARTMENT,
  x: 6.6,
  y: 2.0,
  w: 6.13,
  h: 4.2
});


// ----------------------------------------------------
// SLIDE 6: Department: Occupational Health Centres
// ----------------------------------------------------
const s6 = pptx.addSlide();
s6.background = { color: C.BG_WHITE };
addSlideHeader(s6, 'Department: Occupational Health Centres');

addBulletItem(s6, 0, '✚', 'Emergency Care:', 'On-site medical response teams available 24/7.');
addBulletItem(s6, 1, '✚', 'Wellness Monitoring:', 'Periodic industrial health screenings for all plant personnel.');
addBulletItem(s6, 2, '✚', 'Safety Standards:', 'Promoting industrial hygiene and proactive safety protocols.');

s6.addImage({
  path: OHC_COLLAGE,
  x: 6.6,
  y: 2.0,
  w: 6.13,
  h: 4.2
});


// ----------------------------------------------------
// SLIDE 7: Image Sources
// ----------------------------------------------------
const s7 = pptx.addSlide();
s7.background = { color: C.BG_WHITE };
addSlideHeader(s7, 'Image Sources');

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
  s7.addImage({
    path: item.img,
    x: 0.6,
    y: rowY,
    w: 1.2,
    h: 0.7,
    sizing: { type: 'cover' }
  });
  
  // URL Text
  s7.addText(item.url, {
    x: 2.0,
    y: rowY,
    w: 10.7,
    h: 0.35,
    fontSize: 9.5,
    color: C.ACCENT,
    fontFace: 'Inter'
  });
  
  // Source text
  s7.addText(`Source: ${item.src}`, {
    x: 2.0,
    y: rowY + 0.35,
    w: 10.7,
    h: 0.35,
    fontSize: 9.5,
    bold: true,
    color: C.MUTED,
    fontFace: 'Inter'
  });
});

// Save presentation
const outPath = path.join(__dirname, 'Internship_Report_Overview_Presentation.pptx');
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Presentation generated successfully: ${outPath}`);
  process.exit(0);
}).catch(err => {
  console.error('Failed to generate presentation:', err);
  process.exit(1);
});
