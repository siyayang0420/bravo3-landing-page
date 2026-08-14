/*
 * Applies server/schema.sql to whatever DATABASE_URL points at.
 *
 * This exists so the production table is created from a file in version
 * control rather than typed into the Neon SQL editor — the schema is
 * reviewable, repeatable, and the same on every branch.
 *
 * schema.sql is idempotent (`create table if not exists`), so re-running is
 * safe and is the normal way to apply it after a change.
 *
 *   DATABASE_URL='postgresql://…' npm run db:migrate
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set.\n' +
    'Put it in .env (see .env.example) and run:  npm run db:migrate',
  );
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));

/* A single connection, not a pool: this runs once and exits. */
const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  const sql = await readFile(schemaPath, 'utf8');
  await client.connect();

  /*
   * One transaction, so a schema.sql that grows to several statements can never
   * leave the database half-migrated.
   */
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');

  /* Report what is actually there now, rather than asserting success blindly. */
  const { rows } = await client.query(
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_name = 'waitlist_signups'
      order by ordinal_position`,
  );

  if (rows.length === 0) {
    console.error('Migration ran but waitlist_signups was not found.');
    process.exit(1);
  }

  console.log('waitlist_signups is ready:\n');
  console.table(rows);
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
