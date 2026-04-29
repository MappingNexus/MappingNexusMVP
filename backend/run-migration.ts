import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Connecting to Neon DB...');
        const sqlPath = path.resolve(__dirname, 'supabase/migrations/neon_master_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration...');
        await pool.query(sql);
        console.log('? Migration completed successfully!');
    } catch (err) {
        console.error('? Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
