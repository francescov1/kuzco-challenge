import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/models/index.ts'],
  dbCredentials: {
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    ssl: false
  }
});
