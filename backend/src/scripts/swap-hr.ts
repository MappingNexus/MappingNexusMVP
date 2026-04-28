import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const HR_OLD     = 'hr@acme.test';
const HR_NEW     = 'mappingngexus@gmail.com';
const PASSWORD   = 'Test1234!';
const COMPANY_ID = '5562667f-2314-4f5a-ab8c-6c8f86d3a4f6';

async function run() {
    console.log('🔐 Hashing password...');
    const hash = await bcrypt.hash(PASSWORD, 10);

    // Remove old HR
    const del = await pool.query('DELETE FROM public.users WHERE email = $1 RETURNING email', [HR_OLD]);
    if (del.rowCount && del.rowCount > 0) {
        console.log('🗑️  Deleted old HR:', HR_OLD);
    } else {
        console.log('ℹ️  Old HR not found (already removed):', HR_OLD);
    }

    // Insert or update new HR
    await pool.query(
        `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
         VALUES ($1, $2, $3, $4, 'hr')
         ON CONFLICT (email)
         DO UPDATE SET password_hash = EXCLUDED.password_hash,
                       role          = 'hr',
                       company_id    = EXCLUDED.company_id`,
        [crypto.randomUUID(), HR_NEW, hash, COMPANY_ID]
    );
    console.log('✅ HR user ready:', HR_NEW, '/', PASSWORD);

    await pool.end();
    console.log('Done.');
}

run().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
