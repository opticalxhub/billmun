const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.css')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('font-playfair')) {
        c = c.replace(/font-playfair font-bold/g, 'font-jotia-bold').replace(/font-playfair/g, 'font-jotia');
        fs.writeFileSync(p, c);
      }
    }
  });
}

walk('src');