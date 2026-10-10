import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = fs.readdirSync(__dirname);
const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

console.log(`Found PDFs: ${pdfFiles.join(', ')}`);

for (const file of pdfFiles) {
  const filePath = path.join(__dirname, file);
  const data = fs.readFileSync(filePath);
  const contentStr = data.toString('utf-8');
  
  if (contentStr.includes('Rebar') || contentStr.includes('Patratu') || contentStr.includes('Deepak Kumar')) {
    console.log(`MATCH FOUND in file: ${file}`);
    
    // Check which terms match
    const hasRebar = contentStr.includes('Rebar');
    const hasPatratu = contentStr.includes('Patratu');
    const hasDeepak = contentStr.includes('Deepak');
    console.log(`  - Rebar: ${hasRebar}, Patratu: ${hasPatratu}, Deepak: ${hasDeepak}`);
  }
}
