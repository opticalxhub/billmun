const fs = require('fs');
const path = require('path');

const historyPath = 'C:\\\\Users\\\\majdk\\\\AppData\\\\Roaming\\\\Trae\\\\User\\\\History';
const searchFile = 'dashboard/delegate/page.tsx';

const folders = fs.readdirSync(historyPath);
const entriesList = [];

for (const folder of folders) {
  const p = path.join(historyPath, folder, 'entries.json');
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && data.resource && data.resource.toLowerCase().includes(searchFile.toLowerCase())) {
        for (const entry of data.entries) {
            entriesList.push({ folder, id: entry.id, timestamp: entry.timestamp });
        }
      }
    } catch (e) {}
  }
}

entriesList.sort((a, b) => b.timestamp - a.timestamp);

let out = `Found ${entriesList.length} total entries for ${searchFile} across all folders:\n`;
for (let i = 0; i < Math.min(10, entriesList.length); i++) {
   const entry = entriesList[i];
   const contentPath = path.join(historyPath, entry.folder, entry.id);
   const content = fs.readFileSync(contentPath, 'utf8');
   const date = new Date(entry.timestamp).toLocaleString();
   out += `[${i+1}] Date: ${date} | Len: ${content.length} | First: ${content.substring(0, 30)}\n`;
}
console.log(out);
