require('dotenv').config();
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!databaseUrl) {
    console.error('Missing DATABASE_URL in environment');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  // Strip sslmode from query string so pg doesn't force strict CA verification for pooler
  const cleanDbUrl = databaseUrl.replace(/[?&]sslmode=[^&]+/g, '');
  const client = new Client({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    // 1. Read schema SQL
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing supabase/schema.sql...');
    await client.query(sql);
    console.log('schema.sql executed successfully.');

    // 2. Ensure schema asrii exists and has access/view if needed
    console.log('Ensuring schema asrii compatibility...');
    await client.query(`
      create schema if not exists asrii;
      create table if not exists asrii.kindling_articles (
        like public.kindling_articles including all
      );
    `);
    console.log('Schema asrii configured.');

    // 3. Verify public.kindling_articles
    const countRes = await client.query('select count(*)::int as count from public.kindling_articles;');
    console.log(`Current article count in public.kindling_articles: ${countRes.rows[0].count}`);

    await client.end();
  } catch (err) {
    console.error('PostgreSQL migration failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }

  // 4. Verify PostgREST API with Supabase JS client
  if (supabaseUrl && serviceKey) {
    console.log('Verifying Supabase JS / PostgREST connection...');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase
        .from('kindling_articles')
        .select('id, article, created_at')
        .limit(5);

      if (error) {
        console.error('Supabase client query error:', error.message);
        process.exit(1);
      }

      console.log(`Supabase PostgREST verified! Fetched ${data ? data.length : 0} article(s).`);
      if (data && data.length > 0) {
        console.log(`Sample article ID: "${data[0].id}" - Title: "${data[0].article?.title}"`);
      }
    } catch (apiErr) {
      console.error('Supabase client verification failed:', apiErr);
      process.exit(1);
    }
  }

  console.log('\nMigration and verification completed successfully!');
}

runMigration();
