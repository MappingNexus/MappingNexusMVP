/**
 * Neon DB Connection Pool
 *
 * Single connection pool for all backend DB operations.
 * Uses node-postgres (pg) with Neon's TLS-required pooler URL.
 */
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
});

/**
 * Verify DB connection on startup.
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Neon DB connected successfully');
        return true;
    } catch (err: any) {
        console.error('❌ Neon DB connection failed:', err.message);
        return false;
    }
}

/**
 * Helper: run a parameterized query from the pool.
 */
export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}
