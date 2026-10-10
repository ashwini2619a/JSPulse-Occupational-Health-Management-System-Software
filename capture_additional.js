import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotDir = path.join(__dirname, 'screenshots');

const screens = [
  { id: 'backup', label: 'Backup & Restore', wait: 2000 },
  { id: 'shortcuts', label: 'Excel Shortcuts', wait: 2000 }
];

async function captureAdditional() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  for (const screen of screens) {
    console.log(`Capturing: ${screen.label} (view: ${screen.id})...`);
    try {
      await page.evaluate((viewId) => {
        const labelMap = {
          'backup': 'Backup & Restore',
          'shortcuts': 'Excel Shortcuts'
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
      
      await new Promise(r => setTimeout(r, screen.wait));
      const filePath = path.join(screenshotDir, `${screen.id}.png`);
      await page.screenshot({ path: filePath });
      console.log(`  -> Saved: ${filePath}`);
    } catch (err) {
      console.error(`  -> ERROR:`, err.message);
    }
  }

  await browser.close();
  console.log('Done.');
  process.exit(0);
}

captureAdditional().catch(err => {
  console.error(err);
  process.exit(1);
});
