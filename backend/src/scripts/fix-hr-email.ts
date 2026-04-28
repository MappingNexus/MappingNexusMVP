import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

const CORRECT_EMAIL = 'mappingnexus@gmail.com';
const TYPO_EMAIL    = 'mappingngexus@gmail.com';
const PASSWORD      = 'Test1234!';
const COMPANY_ID    = '5562667f-2314-4f5a-ab8c-6c8f86d3a4f6'; // Acme Corp

async function run() {
    // Show both accounts
    const both = await pool.query(
        `SELECT user_id, email, role, company_id FROM public.users WHERE email = ANY($1)`,
        [[CORRECT_EMAIL, TYPO_EMAIL]]
    );
    console.log('\nCurrent accounts:');
    both.rows.forEach(r => console.log(' ', r));

    // Delete the typo account (no employees linked to it)
    const del = await pool.query(
        `DELETE FROM public.users WHERE email = $1 RETURNING email`, [TYPO_EMAIL]
    );
    console.log(`\n🗑️  Deleted typo account: ${del.rows[0]?.email ?? 'not found'}`);

    // Ensure the correct account is HR for Acme Corp
    const hash = await bcrypt.hash(PASSWORD, 10);
    await pool.query(
        `UPDATE public.users
         SET role = 'hr', company_id = $1, password_hash = $2
         WHERE email = $3`,
        [COMPANY_ID, hash, CORRECT_EMAIL]
    );
    console.log(`✅ ${CORRECT_EMAIL} → role=hr, company=Acme Corp, password=${PASSWORD}`);

    await pool.end();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
