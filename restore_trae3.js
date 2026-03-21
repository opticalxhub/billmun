const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Trae\\\\User\\\\History';
const corruptedTxt = 'corrupted_files.txt';

if (!fs.existsSync(historyPath)) { process.exit(1); }

// Load corrupted files into a Set of lowercased paths
const lines = fs.readFileSync(corruptedTxt, 'utf8').split('\n');
const corruptedSet = new Set();
const pathMapping = new Map(); // lowercase -> original path

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  
  // Extract path (e.g., "3  C:\Users\...")
  const match = line.match(/^\d+\s+(.*)$/);
  const filePath = match ? match[1].trim() : line;
  
  if (filePath.includes(':\\')) {
    const lower = filePath.toLowerCase();
    corruptedSet.add(lower);
    pathMapping.set(lower, filePath);
  }
}

console.log(`Looking for ${corruptedSet.size} files in Trae history...`);

const folders = fs.readdirSync(historyPath);
let restoredCount = 0;

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && data.resource) {
        // Unescape the file URI:
        // "file:///c%3A/Users/majdk/Downloads/billmn/src/app/gallery.tsx" -> "c:/Users/majdk/Downloads/billmn/src/app/gallery.tsx"
        let decoded = decodeURIComponent(data.resource);
        if (decoded.startsWith('file:///')) decoded = decoded.substring(8);
        if (decoded.startsWith('vscode-remote://')) decoded = decoded.split('/c%3A/')[1] || decoded; // fallback
        
        // Normalize backslashes and drive letter format
        // decoded might be "c:/Users...", make it "c:\Users..."
        let windowsPath = decoded.replace(/\//g, '\\');
        
        const lowerPath = windowsPath.toLowerCase();
        
        // Match against corrupted Set
        let matchLower = null;
        for (const corruptedPath of corruptedSet) {
           if (lowerPath.endsWith(corruptedPath) || corruptedPath.endsWith(lowerPath)) {
               matchLower = corruptedPath;
               break;
           }
        }

        if (matchLower) {
          const originalPath = pathMapping.get(matchLower);
          
          if (data.entries && data.entries.length > 0) {
            const sortedEntries = [...data.entries].sort((a, b) => b.timestamp - a.timestamp);
            
            for (const entry of sortedEntries) {
               const contentPath = path.join(historyPath, folder, entry.id);
               if (fs.existsSync(contentPath)) {
                  const content = fs.readFileSync(contentPath, 'utf8').trim();
                  
                  // Filter out placeholders and corrupted ones
                  if (content.length > 5 && 
                      !content.startsWith('Placeholder for') && 
                      !content.includes('Placeholder for') &&
                      content !== '}' && content !== '};') {
                      
                      try {
                          fs.writeFileSync(originalPath, content);
                          console.log(`[RESTORED] ${originalPath}`);
                          restoredCount++;
                          corruptedSet.delete(matchLower); // don't restore it again from another folder if duplicate
                      } catch (e) {
                          console.log(`[ERROR] Unable to write ${originalPath}: ${e.message}`);
                      }
                      
                      break; // We found the latest valid entry for this file, move to next file
                  }
               }
            }
          }
        }
      }
    } catch (e) {}
  }
}

console.log(`\nDONE. Total successfully restored: ${restoredCount}. Remaining unmatched/unrecoverable: ${corruptedSet.size}`);
