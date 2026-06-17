import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
} else {
  // Prevent duplicate connections during hot-reloading in development
  if (!(global as any).pgPool) {
    (global as any).pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  pool = (global as any).pgPool;
}

export { pool };

/**
 * Execute a single query on the database pool
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    const slowQueryThresholdMs = Number(process.env.SLOW_QUERY_THRESHOLD_MS || 500);
    if (process.env.NODE_ENV !== 'production' && duration > slowQueryThresholdMs) {
      console.warn(`Slow query: ${text.substring(0, 100)}... (${duration}ms)`);
    }
    return res;
  } catch (error) {
    console.error(`Database query error:`, error);
    throw error;
  }
}

/**
 * Execute multiple queries inside a single transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction rollback due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}
