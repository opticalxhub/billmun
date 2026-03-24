import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const issues = [];
const tablesUsed = new Set();
let fileCount = 0;

walkDir('./src/app', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  fileCount++;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const fromMatch = line.match(/\.from\(['"]([^'"]+)['"]\)/g);
    if (fromMatch) {
      fromMatch.forEach(m => {
        const table = m.match(/\.from\(['"]([^'"]+)['"]\)/)[1];
        tablesUsed.add(table);
      });
      // Try to find missing await
      if (line.includes('.from') && !line.includes('await') && !line.includes('return') && !line.includes('.then') && !line.includes('channel')) {
         if (line.includes('.select') || line.includes('.insert') || line.includes('.update') || line.includes('.delete') || line.includes('.upsert')) {
             issues.push(`[Potential Unawaited Call] ${filePath}:${index+1} => ${line.trim()}`);
         }
      }
    }
  });
});

const report = {
    fileCount,
    tables: Array.from(tablesUsed),
    issues
};
fs.writeFileSync('static_analysis.json', JSON.stringify(report, null, 2));
