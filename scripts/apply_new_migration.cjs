const fs = require('fs');
const pg = require('pg');
const { Client } = pg;

async function run() {
  const connString = 'postgresql://postgres.xbuhvknlpkvjnzinzjys:Wea8sBfveVSTFNq4dnmverTime@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString: connString });
  try {
    await client.connect();
    console.log('Connected to the database');
    const sql = fs.readFileSync('supabase/migrations/20260611000000_add_start_date.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully ran migration!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

run();
