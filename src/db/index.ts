import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Request } from './models/request';

// DB setup:
// CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
// CREATE DATABASE main;

// TODO: Verify that this uses newest practices and syntax: https://orm.drizzle.team/docs/get-started/postgresql-new
// TODO: Cleanup this file, kinda unnecessary. maybe create a class

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export const initDb = async () => {
  if (_pool) return _db!;

  _pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'main',
    ssl: false // TODO: Try removing when in docker
  });

  // Test the connection
  try {
    await _pool.query('SELECT 1');
    console.log('Connected to database');
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error}`);
  }

  _db = drizzle(_pool, { schema: { Request } });
  return _db;
};

export const closeDb = async () => {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
};

export const getDb = () => {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
};
