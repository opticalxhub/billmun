const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Code\\\\User\\\\History';
const corruptedTxt = 'corrupted_files.txt';

if (!fs.existsSync(historyPath)) { console.error('No Code history'); process.exit(0); }

// Load corrupted files into a Set of lowercased paths
const lines = fs.readFileSync(corruptedTxt, 'utf8').split('\n');
const fileHistoryEntries = new Map(); // original path -> array of {folder, id, timestamp}
const pathMapping = new Map(); // lowercase -> original path

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  
  const match = line.match(/^\d+\s+(.*)$/);
  const filePath = match ? match[1].trim() : line;
  
  if (filePath.includes(':\\')) {
    const lower = filePath.toLowerCase();
    pathMapping.set(lower, filePath);
    fileHistoryEntries.set(filePath, []);
  }
}

console.log(`Scanning VSCode history for ${fileHistoryEntries.size} corrupted files...`);

const folders = fs.readdirSync(historyPath);

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && data.resource && data.entries && data.entries.length > 0) {
        
        let decoded = decodeURIComponent(data.resource);
        if (decoded.startsWith('file:///')) decoded = decoded.substring(8);
        if (decoded.startsWith('vscode-remote://')) decoded = decoded.split('/c%3A/')[1] || decoded;
        
        let windowsPath = decoded.replace(/\//g, '\\');
        const lowerPath = windowsPath.toLowerCase();
        
        let matchOriginal = null;
        for (const [lowerCorrupted, originalCorrupted] of pathMapping.entries()) {
           if (lowerPath.endsWith(lowerCorrupted) || lowerCorrupted.endsWith(lowerPath)) {
               matchOriginal = originalCorrupted;
               break;
           }
        }

        if (matchOriginal) {
          const list = fileHistoryEntries.get(matchOriginal);
          for (const entry of data.entries) {
             list.push({ folder, id: entry.id, timestamp: entry.timestamp });
          }
        }
      }
    } catch (e) {}
  }
}

let restoredCount = 0;
let remainingCount = 0;

for (const [originalPath, entries] of fileHistoryEntries.entries()) {
  if (entries.length > 0) {
     entries.sort((a, b) => b.timestamp - a.timestamp);
     
     let foundValid = false;
     for (const entry of entries) {
        const contentPath = path.join(historyPath, entry.folder, entry.id);
        if (fs.existsSync(contentPath)) {
           const content = fs.readFileSync(contentPath, 'utf8').trim();
           
           if (content.length > 10 && 
               !content.startsWith('Placeholder for') && 
               !content.includes('Placeholder for') &&
               content !== '}' && content !== '};') {
               
               try {
                   fs.writeFileSync(originalPath, content);
                   console.log(`[RESTORED VIA VSCODE] ${originalPath}`);
                   restoredCount++;
                   foundValid = true;
               } catch (e) {
                   console.log(`[ERROR] ${originalPath}: ${e.message}`);
               }
               break; 
           }
        }
     }
     
     if (!foundValid) {
        remainingCount++;
     }
  } else {
     remainingCount++;
  }
}

console.log(`\nDONE. Restored absolute latest versions from VSCode: ${restoredCount}. Remaining missing: ${remainingCount}`);
