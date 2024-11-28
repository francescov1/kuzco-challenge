import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/models/request.ts', './src/db/models/batch.ts'],
  dbCredentials: {
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'main',
    ssl: false // TODO: Try removing when in docker
  }
});
