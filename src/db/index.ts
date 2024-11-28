import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Batch, LlmRequest } from './models';

// TODO: ensure this follows conventions https://orm.drizzle.team/docs/get-started/postgresql-new

export class DatabaseClient {
  public db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'main',
      ssl: false // TODO: Try removing when in docker
    });

    this.db = drizzle(this.pool, { schema: { LlmRequest, Batch } });
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const dbClient = new DatabaseClient();
