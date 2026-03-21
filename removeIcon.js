const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('BillmunIcon')) {
        c = c.replace(/import\s*\{\s*BillmunIcon\s*\}\s*from\s*['"]@\/components\/icons['"];?\r?\n/g, '');
        c = c.replace(/BillmunIcon,\r?\n\s*/g, '');
        fs.writeFileSync(p, c);
      }
    }
  });
}

walk('src');