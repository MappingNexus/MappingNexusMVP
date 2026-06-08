/**
 * Repairs known manager demo accounts whose public.users.role was accidentally
 * changed to another role.
 *
 * Usage:
 *   npm run fix-manager-roles
 *   MANAGER_EMAILS="alice@example.com,bob@example.com" npm run fix-manager-roles
 */
import { pool } from '../config/db.js';
import { revokeAllSessionsForUser } from '../services/session.service.js';

const DEFAULT_MANAGER_EMAILS = [
    'manager1@acme.test',
    'manager2@acme.test',
    'arjun.manager@asteriaops.demo',
    'meera.manager@asteriaops.demo',
    'vikram.manager@asteriaops.demo',
];

function getManagerEmails(): string[] {
    const raw = process.env.MANAGER_EMAILS;
    const emails = raw
        ? raw.split(',')
        : DEFAULT_MANAGER_EMAILS;

    return [...new Set(
        emails
            .map(email => email.toLowerCase().trim())
            .filter(Boolean)
    )];
}

async function run() {
    const emails = getManagerEmails();
    if (emails.length === 0) {
        console.error('No manager emails provided.');
        process.exitCode = 1;
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT user_id, email, role
             FROM public.users
             WHERE email = ANY($1)
             FOR UPDATE`,
            [emails]
        );

        const found = new Set(result.rows.map(row => row.email));
        const missing = emails.filter(email => !found.has(email));
        const changed = result.rows.filter(row => row.role !== 'manager');

        for (const user of changed) {
            await client.query(
                `UPDATE public.users
                 SET role = 'manager'
                 WHERE user_id = $1`,
                [user.user_id]
            );
            await revokeAllSessionsForUser(user.user_id, client);
        }

        await client.query('COMMIT');

        console.log(`Checked ${emails.length} manager email(s).`);
        console.log(`Updated ${changed.length} account(s) to role=manager.`);
        if (missing.length > 0) {
            console.log(`Missing account(s): ${missing.join(', ')}`);
        }
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Failed to fix manager roles:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error('Failed to fix manager roles:', err.message);
    process.exitCode = 1;
});
