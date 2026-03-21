const fs = require('fs');
const path = require('path');
const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Trae\\\\User\\\\History';

if (!fs.existsSync(historyPath)) {
  console.log('No Trae history found');
  process.exit(0);
}

const folders = fs.readdirSync(historyPath);
let foundMatch = null;

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (data && data.resource && data.resource.toLowerCase().includes('files.txt')) {
       console.log('Found something related to files:', folder);
       // we can ignore this, we want gallery.tsx
    }
    if (data && data.resource && data.resource.toLowerCase().includes('gallery.tsx')) {
       console.log('Found gallery.tsx in', folder);
       console.log(data);
       foundMatch = folder;
       break;
    }
  }
}
if (foundMatch) {
   const entriesFolder = path.join(historyPath, foundMatch);
   const entries = fs.readdirSync(entriesFolder);
   console.log('Files in folder:', entriesFolder, entries);
   for (const file of entries) {
      if (file !== 'entries.json') {
          const content = fs.readFileSync(path.join(entriesFolder, file), 'utf8');
          console.log(`-- Content of ${file} (len: ${content.length}):\n${content.substring(0, 100)}...\n`);
      }
   }
}
