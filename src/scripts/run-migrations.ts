import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const migrationsDir = path.join(__dirname, '../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    
    console.log(`Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    try {
      await client.query(sql);
      console.log(`Successfully ran ${file}`);
    } catch (err: any) {
      console.error(`Error running ${file}: ${err.message}`);
      // Don't stop on error, keep going in case it's a duplicate table error
    }
  }

  await client.end();
  console.log('Finished running migrations.');
}

main();
