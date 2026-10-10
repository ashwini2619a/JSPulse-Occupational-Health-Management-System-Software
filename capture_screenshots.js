import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotDir = path.join(__dirname, 'screenshots');

const screens = [
  { id: 'dashboard', label: 'Dashboard', wait: 3000 },
  { id: 'opdcard', label: 'OPD Card Form', wait: 2000 },
  { id: 'opd', label: 'OPD', wait: 2000 },
  { id: 'dispense', label: 'Dispense', wait: 2000 },
  { id: 'medconsume', label: 'Medicine Consume', wait: 2000 },
  { id: 'inventory', label: 'Medicine Inventory', wait: 2000 },
  { id: 'shift', label: 'Daily Consume', wait: 2000 },
  { id: 'monthlybalance', label: 'Monthly Balance', wait: 2000 },
  { id: 'mis', label: 'MIS Report', wait: 3000 },
  { id: 'clinical', label: 'Clinical Records', wait: 2000 },
  { id: 'systemhealth', label: 'System Health', wait: 2000 },
];

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for app to load
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('App loaded. Starting screenshot captures...\n');

  for (const screen of screens) {
    console.log(`Capturing: ${screen.label} (view: ${screen.id})...`);
    
    try {
      // Click the sidebar button matching this view ID
      // The nav buttons have the view id set via onClick handler
      // We need to find the button whose click calls setCurrentView(screen.id)
      // The buttons are inside .nav-links and have class 'btn'
      
      const clicked = await page.evaluate((viewId) => {
        // Find all nav buttons
        const buttons = document.querySelectorAll('.nav-links button.btn');
        for (const btn of buttons) {
          // Check if the button text matches
          const span = btn.querySelector('span');
          if (span) {
            // We'll simulate click on each button and let React handle it
          }
        }
        // Alternative: directly set the React state
        // Find the React fiber and set state
        return false;
      }, screen.id);

      // Better approach: use page.evaluate to call the React setState directly
      await page.evaluate((viewId) => {
        // Find the nav button by matching the label text
        const labelMap = {
          'dashboard': 'Dashboard',
          'opdcard': 'OPD Card Form',
          'opd': 'OPD',
          'dispense': 'Dispense',
          'medconsume': 'Medicine Consume',
          'inventory': 'Medicine Inventory',
          'shift': 'Daily Consume',
          'monthlybalance': 'Monthly Balance',
          'mis': 'MIS Report',
          'clinical': 'Clinical Records',
          'systemhealth': 'System Health',
          'injury': 'Injury Reports',
          'firstaid': 'BILLINGS',
          'patient': 'Medicine Incoming'
        };
        
        const targetLabel = labelMap[viewId];
        const buttons = document.querySelectorAll('.nav-links button');
        for (const btn of buttons) {
          const span = btn.querySelector('span');
          if (span && span.textContent.trim() === targetLabel) {
            btn.click();
            return true;
          }
        }
        return false;
      }, screen.id);
      
      // Wait for the view to render
      await new Promise(r => setTimeout(r, screen.wait));
      
      // Take screenshot
      const filePath = path.join(screenshotDir, `${screen.id}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  -> Saved: ${filePath}`);
    } catch (err) {
      console.error(`  -> ERROR capturing ${screen.label}:`, err.message);
    }
  }

  console.log('\nAll screenshots captured! Closing browser...');
  await browser.close();
  console.log('Done.');
}

captureScreenshots().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
