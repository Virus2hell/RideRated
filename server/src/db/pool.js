import pg from 'pg';
import { env } from '../config/env.js';

// Return DATE columns as plain 'YYYY-MM-DD' strings. By default pg turns them into JS Dates at
// local midnight, which can shift the day by one depending on the server's timezone.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

// Local Postgres: no SSL. Hosted Postgres (Supabase, Neon…): SSL on.
// We drop any ?sslmode=... from the URL so this setting always wins.
const url = new URL(env.DATABASE_URL);
const isLocalDb = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
url.searchParams.delete('sslmode');

export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  max: 10,
});

// If Postgres drops an idle connection (PC sleep, Postgres restart, network blip), pg emits an
// 'error' event. Without a listener Node treats it as fatal and the whole API crashes.
// Log it instead: the pool simply opens a fresh connection for the next query.
pool.on('error', (err) => {
  console.error('Postgres idle client error (the API keeps running):', err.message);
});

// Small helper so controllers can write: const { rows } = await query(sql, params)
export const query = (text, params) => pool.query(text, params);
