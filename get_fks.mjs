import pg from 'pg';
const { Client } = pg;
const client = new Client('postgresql://postgres.qmmgugalvcgaxvgsfslp:M_6xl7aDhCKCxfdGxsuEcRtGu5rDfE2Q8Udu1nKr28Y@aws-0-eu-central-1.pooler.supabase.com:6543/postgres');
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('speeches', 'resolutions', 'blocs', 'bloc_members');
  `);
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
