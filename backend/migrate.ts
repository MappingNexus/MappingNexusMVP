import fs from 'fs';
import { pool } from './src/config/db.js';

async function migrate() {
    try {
        console.log('Reading migration file...');
        const sql = fs.readFileSync('./supabase/migrations/016_calendar_sync.sql', 'utf8');
        console.log('Applying migration...');
        await pool.query(sql);
        console.log('Migration applied successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
