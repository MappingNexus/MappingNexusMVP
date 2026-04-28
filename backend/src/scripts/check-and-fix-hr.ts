/**
 * check-and-fix-hr.ts
 *
 * 1. Prints the company linked to mappingngexus@gmail.com
 * 2. Prints employee counts per company
 * 3. Migrates all employees from "Acme Corp" into whatever company
 *    mappingngexus@gmail.com belongs to, then deletes the empty Acme Corp.
 *
 * Run: npx tsx src/scripts/check-and-fix-hr.ts
 */
import { pool } from '../config/db.js';

async function run() {
    // ── 1. Find HR's current company ──────────────────────────────────────
    const hrRes = await pool.query(`
        SELECT u.user_id, u.email, u.company_id, u.role, c.company_name
        FROM public.users u
        JOIN public.companies c ON c.company_id = u.company_id
        WHERE u.email = 'mappingngexus@gmail.com'
    `);

    if (hrRes.rows.length === 0) {
        console.error('❌ mappingngexus@gmail.com not found in users table.');
        await pool.end(); return;
    }

    const hr = hrRes.rows[0];
    console.log('\n── HR User ─────────────────────────────────────');
    console.log('  Email:      ', hr.email);
    console.log('  Role:       ', hr.role);
    console.log('  Company ID: ', hr.company_id);
    console.log('  Company:    ', hr.company_name);

    // ── 2. Show employee counts per company ───────────────────────────────
    const counts = await pool.query(`
        SELECT c.company_name, c.company_id, COUNT(e.employee_id) AS emp_count
        FROM public.companies c
        LEFT JOIN public.employees e ON e.company_id = c.company_id
        GROUP BY c.company_id, c.company_name
        ORDER BY emp_count DESC
    `);

    console.log('\n── Employee counts per company ─────────────────');
    for (const row of counts.rows) {
        console.log(`  ${row.company_name.padEnd(30)} ${row.emp_count} employees  (${row.company_id})`);
    }

    // ── 3. Find "Acme Corp" (the seeded company) ──────────────────────────
    const acmeRes = await pool.query(`
        SELECT company_id FROM public.companies WHERE company_name = 'Acme Corp' LIMIT 1
    `);

    if (acmeRes.rows.length === 0) {
        console.log('\n✅ No "Acme Corp" company found — nothing to migrate.');
        await pool.end(); return;
    }

    const acmeId = acmeRes.rows[0].company_id;
    const hrCompanyId = hr.company_id;

    if (acmeId === hrCompanyId) {
        console.log('\n✅ HR is already in Acme Corp — no migration needed.');
        await pool.end(); return;
    }

    console.log(`\n🔄 Migrating employees + users from Acme Corp → ${hr.company_name}...`);

    // Move employees
    const empUpdate = await pool.query(
        `UPDATE public.employees SET company_id = $1 WHERE company_id = $2`,
        [hrCompanyId, acmeId]
    );
    console.log(`  ✅ Moved ${empUpdate.rowCount} employee rows`);

    // Move skills
    const skillUpdate = await pool.query(
        `UPDATE public.skills SET company_id = $1 WHERE company_id = $2`,
        [hrCompanyId, acmeId]
    );
    console.log(`  ✅ Updated ${skillUpdate.rowCount} skill rows`);

    // Move manager1 & manager2 users
    const userUpdate = await pool.query(
        `UPDATE public.users SET company_id = $1 WHERE company_id = $2 AND email != 'mappingngexus@gmail.com'`,
        [hrCompanyId, acmeId]
    );
    console.log(`  ✅ Moved ${userUpdate.rowCount} other user rows (managers/employees)`);

    // Delete now-empty Acme Corp company
    await pool.query(`DELETE FROM public.companies WHERE company_id = $1`, [acmeId]);
    console.log(`  🗑️  Deleted empty "Acme Corp" company`);

    // Final count
    const finalCount = await pool.query(
        `SELECT COUNT(*) AS cnt FROM public.employees WHERE company_id = $1`,
        [hrCompanyId]
    );
    console.log(`\n✅ Done! ${hr.company_name} now has ${finalCount.rows[0].cnt} employees.`);
    console.log('   Log out and log back in as mappingngexus@gmail.com to see them all.\n');

    await pool.end();
}

run().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
