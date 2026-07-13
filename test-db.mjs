import pg from 'pg';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : '(NOT SET)');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const r = await pool.query('SELECT NOW() as now');
  console.log('Connected! Server time:', r.rows[0].now);
} catch (e) {
  console.error('DB Error:', e.message);
} finally {
  await pool.end();
}
