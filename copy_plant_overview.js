import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = 'C:/Users/ashwi/.gemini/antigravity/brain/8834dedc-d08c-452c-8de0-7ee68f81af15/plant_overview_1783422761492.png';
const dest = path.join(__dirname, 'downloaded_assets/plant_overview.png');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied plant_overview to downloaded_assets');
} else {
  console.error('Source file does not exist:', src);
}
