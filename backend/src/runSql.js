import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from './data-source.js';

dotenv.config();

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node backend/src/runSql.js <sql-file>');
  process.exit(1);
}

try {
  const sql = await readFile(resolve(filePath), 'utf8');
  await pool.query(sql);
  await pool.end();
  console.log(`Executed ${filePath}`);
} catch (error) {
  console.error(error.message);
  await pool.end();
  process.exit(1);
}
