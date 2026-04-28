import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    const sqlPath = path.resolve('supabase/migrations/017_neon_backfill_missing_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔌 Connecting to Neon DB...');
    const client = await pool.connect();
    try {
        console.log('⚙️  Running migration 017 (backfill missing tables & calendar columns)...\n');
        await client.query(sql);
        console.log('✅ Migration 017 completed successfully!\n');

        // Quick verification
        console.log('🔍 Verifying calendar columns on employees...');
        const empCols = await client.query<{ column_name: string }>(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'employees'
              AND column_name LIKE '%calendar%'
            ORDER BY column_name
        `);
        if (empCols.rows.length > 0) {
            console.log('  ✓ Found:', empCols.rows.map(r => r.column_name).join(', '));
        } else {
            console.warn('  ⚠ No calendar columns found on employees — check migration output above.');
        }

        console.log('\n🔍 Verifying availability_window table...');
        const awCols = await client.query<{ column_name: string }>(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'availability_window'
            ORDER BY column_name
        `);
        if (awCols.rows.length > 0) {
            console.log('  ✓ Columns:', awCols.rows.map(r => r.column_name).join(', '));
        } else {
            console.warn('  ⚠ availability_window table not found — check migration output above.');
        }

        console.log('\n🎉 Done! You can now restart the backend and retry the calendar sync.');
    } catch (err: any) {
        console.error('\n❌ Migration failed:', err.message || err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
