const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Trae\\\\User\\\\History';
const corruptedTxt = 'corrupted_files.txt';

if (!fs.existsSync(historyPath)) {
  console.log('No Trae history found at', historyPath);
  process.exit(1);
}

if (!fs.existsSync(corruptedTxt)) {
  console.log('No corrupted_files.txt found. Cannot determine which files to restore.');
  process.exit(1);
}

const lines = fs.readFileSync(corruptedTxt, 'utf8').split('\n');
const filesToRestore = [];
for (let line of lines) {
  line = line.trim();
  if (line) {
    // line format is "3  C:\Users\..." or similar
    const match = line.match(/^\d+\s+(.*)$/);
    if (match && match[1]) {
      filesToRestore.push(match[1].trim());
    } else if (line.includes(':\\')) {
      filesToRestore.push(line);
    }
  }
}

console.log(`Found ${filesToRestore.length} files to potentially restore.`);

// Build index of history folders to speed up lookup
const folders = fs.readdirSync(historyPath);
const historyMap = new Map(); // Map lowercase file URI to folder name

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && data.resource) {
        // e.g., file:///c%3A/Users/majdk/...
        // Convert to lowercase and decode URI just to be safe for matching
        let cleanUri = decodeURIComponent(data.resource.toLowerCase());
        // normalize slashes
        cleanUri = cleanUri.replace(/\\/g, '/');
        // keep only the path part
        const pathMatch = cleanUri.match(/c:\/users\/.*/);
        if (pathMatch) {
            historyMap.set(pathMatch[0], folder);
        } else {
            historyMap.set(cleanUri, folder);
        }
      }
    } catch (e) {
      // ignore parsing errors
    }
  }
}

let restoredCount = 0;
let failedCount = 0;

for (const filePath of filesToRestore) {
  // normalize file path to match history map keys
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  
  let matchFolder = null;
  for (const [key, folder] of historyMap.entries()) {
     if (key.endsWith(normalizedPath) || normalizedPath.endsWith(key) || key.includes(normalizedPath)) {
         matchFolder = folder;
         break;
     }
  }

  if (matchFolder) {
    const entriesPath = path.join(historyPath, matchFolder, 'entries.json');
    const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    
    // Sort entries by timestamp descending (newest first)
    if (data.entries && data.entries.length > 0) {
      const sortedEntries = [...data.entries].sort((a, b) => b.timestamp - a.timestamp);
      let foundValid = false;
      
      for (const entry of sortedEntries) {
         const contentPath = path.join(historyPath, matchFolder, entry.id);
         if (fs.existsSync(contentPath)) {
            const content = fs.readFileSync(contentPath, 'utf8').trim();
            // We want to avoid restoring:
            // 1. the corrupted 3-byte '}'
            // 2. the placeholder we generated today
            // 3. something that is completely empty
            if (content.length > 5 && 
                !content.startsWith('Placeholder for') && 
                !content.includes('Placeholder for') &&
                content !== '}' && content !== '};') {
                
                // FOUND A VALID VERSION!
                try {
                  fs.writeFileSync(filePath, content);
                  console.log(`[RESTORED] ${filePath}`);
                  restoredCount++;
                  foundValid = true;
                  break;
                } catch(err) {
                  console.log(`[ERROR] writing to ${filePath}:`, err.message);
                }
            }
         }
      }
      
      if (!foundValid) {
        console.log(`[FAILED] ${filePath} - No valid intact history found.`);
        failedCount++;
      }
    } else {
      console.log(`[FAILED] ${filePath} - History folder empty.`);
      failedCount++;
    }
  } else {
    console.log(`[FAILED] ${filePath} - Could not find in Trae History.`);
    failedCount++;
  }
}

console.log(`\nDONE. Restored: ${restoredCount}, Failed: ${failedCount}`);
