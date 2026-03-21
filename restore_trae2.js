const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Trae\\\\User\\\\History';
const corruptedTxt = 'corrupted_files.txt';

if (!fs.existsSync(historyPath)) { process.exit(1); }

const lines = fs.readFileSync(corruptedTxt, 'utf8').split('\n');
const filesToRestore = [];
for (let line of lines) {
  line = line.trim();
  if (line) {
    let filePath = line.replace(/^\d+\s+/, '').trim();
    if (filePath) filesToRestore.push(filePath.replace(/\\/g, '/').toLowerCase());
  }
}

const folders = fs.readdirSync(historyPath);
const historyMap = new Map();

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && data.resource) {
        let uri = decodeURIComponent(data.resource);
        uri = uri.replace(/\\/g, '/').toLowerCase();
        
        let pathPart = uri;
        if (uri.startsWith('file:///')) {
           pathPart = uri.substring(8); // remove file:///
        }
        
        if (pathPart.includes(':')) {
           pathPart = pathPart.replace(':', '');
        }
        
        historyMap.set(pathPart, folder);
      }
    } catch (e) {}
  }
}

let restoredCount = 0;
let failedCount = 0;

for (const rawFile of filesToRestore) {
  let fileToFind = rawFile.replace(':', ''); // e.g. c/users/majdk...
  
  let matchFolder = null;
  for (const [historyPathKey, folder] of historyMap.entries()) {
    if (historyPathKey.endsWith(fileToFind) || fileToFind.endsWith(historyPathKey)) {
       matchFolder = folder;
       break;
    }
  }

  const originalFilePath = Object.entries(filesToRestore).find(([i, v]) => v.replace(':', '') === fileToFind)?.[1] || rawFile;

  let originalRealSystemPath = '';
  // Reconstruct original path from lowercased format by guessing or just relying on original file existence
  for (let l of lines) {
      if (l.toLowerCase().includes(rawFile)) {
         originalRealSystemPath = l.replace(/^\d+\s+/, '').trim();
         break;
      }
  }

  if (matchFolder && originalRealSystemPath) {
    const entriesPath = path.join(historyPath, matchFolder, 'entries.json');
    const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    if (data.entries && data.entries.length > 0) {
      const sortedEntries = [...data.entries].sort((a, b) => b.timestamp - a.timestamp);
      let foundValid = false;
      
      for (const entry of sortedEntries) {
         const contentPath = path.join(historyPath, matchFolder, entry.id);
         if (fs.existsSync(contentPath)) {
            const content = fs.readFileSync(contentPath, 'utf8').trim();
            if (content.length > 5 && 
                !content.startsWith('Placeholder for') && 
                !content.includes('Placeholder for') &&
                content !== '}' && content !== '};') {
                
                fs.writeFileSync(originalRealSystemPath, content);
                console.log(`RESTORED: ${originalRealSystemPath}`);
                restoredCount++;
                foundValid = true;
                break;
            }
         }
      }
      if (!foundValid) failedCount++;
    } else {
      failedCount++;
    }
  } else {
    failedCount++;
    console.log("NOT FOUND IN HISTORY:", originalRealSystemPath);
  }
}

console.log(`\nDONE. Restored: ${restoredCount}, Failed: ${failedCount}`);
