import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pptxPath = path.join(__dirname, 'JSPulse_OHMS_Final_Presentation_v4.pptx');

if (fs.existsSync(pptxPath)) {
  const stats = fs.statSync(pptxPath);
  console.log('Verification Success:');
  console.log(`- File exists: ${pptxPath}`);
  console.log(`- File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} else {
  console.error('Verification Error: Presentation file does not exist at ' + pptxPath);
}
