const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'components');
const filesToProcess = [];

function findFiles(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      filesToProcess.push(fullPath);
    }
  }
}

findFiles(dir);

let count = 0;
for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;
  
  // Replace initialData
  if (content.includes('const initialData = [')) {
    content = content.replace(/const initialData = \[\s*\{[\s\S]*?\}\s*\];/g, 'const initialData = [];');
  }
  
  // Replace sampleData in DispenseMedicine and others
  if (content.includes('const sampleData = [')) {
    content = content.replace(/const sampleData = \[\s*\{[\s\S]*?\}\s*\];/g, 'const sampleData = [];');
  }
  
  if (original !== content) {
    fs.writeFileSync(file, content);
    count++;
  }
}

console.log(`Processed ${count} files.`);
