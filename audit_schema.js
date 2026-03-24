const fs = require('fs');
const SUPABASE_URL = 'https://qmmgugalvcgaxvgsfslp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbWd1Z2FsdmNnYXh2Z3Nmc2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjgxNSwiZXhwIjoyMDg2MDAyODE1fQ.M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y';

async function main() {
  const specRes = await fetch(SUPABASE_URL + '/rest/v1/', {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
  });
  const spec = await specRes.json();
  if (!spec || !spec.definitions) { console.log('No definitions found'); return; }

  const out = [];
  const tableNames = Object.keys(spec.definitions).sort();
  out.push(`TOTAL TABLES: ${tableNames.length}\n`);

  for (const t of tableNames) {
    const def = spec.definitions[t];
    if (!def || !def.properties) continue;
    const req = def.required || [];
    const cols = Object.entries(def.properties).map(([col, info]) => {
      const parts = [col + ': ' + (info.format || info.type || '?')];
      if (info.enum) parts.push('enum=[' + info.enum.join(',') + ']');
      if (info.default !== undefined) parts.push('def=' + JSON.stringify(info.default));
      if (req.includes(col)) parts.push('[REQ]');
      // Extract FK info from description
      if (info.description && info.description.includes('Foreign Key')) {
        const m = info.description.match(/Foreign Key to `([^`]+)`/);
        if (m) parts.push('FK->' + m[1]);
      }
      return '  ' + parts.join(' | ');
    });
    out.push(`\n[${t}] (${Object.keys(def.properties).length} cols)`);
    out.push(cols.join('\n'));
  }

  const result = out.join('\n');
  fs.writeFileSync('DB_SCHEMA.txt', result);
  console.log(result);
}
main().catch(console.error);
