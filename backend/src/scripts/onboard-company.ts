/**
 * Company Onboarding Script
 *
 * Creates a new company + HR admin + optional manager accounts in one shot.
 *
 * Usage:
 *   npm run onboard-company -- --name "Acme Corp" --hrEmail "hr@acme.com"
 *   npm run onboard-company -- --name "Acme Corp" --hrEmail "hr@acme.com" --managers "m1@acme.com,m2@acme.com"
 *
 * What it does:
 *   1. Creates company row in `companies` table
 *   2. Creates HR auth user in Supabase Auth
 *   3. Auth trigger creates the HR row in `users` (role=hr)
 *   4. Optionally creates manager auth users; the trigger creates their `users` rows
 *   5. Sends password setup emails
 */
import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';
import { sendPasswordSetupEmail } from '../services/password-reset.service.js';

// ── Parse CLI args ──
function parseArgs(): { name: string; hrEmail: string; managers: string[] } {
    const args = process.argv.slice(2);
    let name = '';
    let hrEmail = '';
    let managers: string[] = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--name' && args[i + 1]) { name = args[++i]; }
        else if (args[i] === '--hrEmail' && args[i + 1]) { hrEmail = args[++i]; }
        else if (args[i] === '--managers' && args[i + 1]) {
            managers = args[++i].split(',').map(e => e.trim()).filter(Boolean);
        }
    }

    if (!name || !hrEmail) {
        console.error('\n❌ Usage: npm run onboard-company -- --name "Company Name" --hrEmail "hr@company.com" [--managers "m1@co.com,m2@co.com"]\n');
        process.exit(1);
    }

    return { name, hrEmail: hrEmail.toLowerCase().trim(), managers };
}

function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pw = '';
    const bytes = crypto.randomBytes(16);
    for (let i = 0; i < 16; i++) pw += chars[bytes[i] % chars.length];
    return pw;
}

async function createAuthUser(email: string, password: string, companyId: string, role: 'hr' | 'manager') {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { company_id: companyId, role },
    });

    if (error) throw new Error(`Auth creation failed for ${email}: ${(error as any)?.message}`);

    await sendPasswordSetupEmail(email);

    return data.user.id;
}

async function main() {
    const { name, hrEmail, managers } = parseArgs();

    console.log('\n' + '='.repeat(60));
    console.log('  🏢 MAPPING NEXUS — Company Onboarding');
    console.log('='.repeat(60));

    // ── Step 1: Create Company ──
    console.log(`\n📌 Creating company: ${name}`);
    const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({ company_name: name })
        .select()
        .single();

    if (companyError) {
        console.error('❌ Failed to create company:', (companyError as any).message);
        process.exit(1);
    }

    const companyId = company.company_id;
    console.log(`   ✅ Company ID: ${companyId}`);

    // ── Step 2: Create HR Admin ──
    console.log(`\n📌 Creating HR admin: ${hrEmail}`);
    try {
        const hrUserId = await createAuthUser(hrEmail, generatePassword(), companyId, 'hr');
        console.log(`   ✅ HR User ID: ${hrUserId}`);
        console.log(`   📧 Password setup email sent to ${hrEmail}`);
    } catch (err: any) {
        console.error(`   ❌ ${err.message}`);
        // Cleanup company
        await supabaseAdmin.from('companies').delete().eq('company_id', companyId);
        process.exit(1);
    }

    // ── Step 3: Create Managers ──
    for (const mgrEmail of managers) {
        console.log(`\n📌 Creating manager: ${mgrEmail}`);
        try {
            const mgrUserId = await createAuthUser(
                mgrEmail.toLowerCase().trim(),
                generatePassword(),
                companyId,
                'manager'
            );
            console.log(`   ✅ Manager User ID: ${mgrUserId}`);
            console.log(`   📧 Password setup email sent to ${mgrEmail.toLowerCase().trim()}`);
        } catch (err: any) {
            console.error(`   ❌ ${err.message} — skipping this manager`);
        }
    }

    // ── Summary ──
    console.log('\n' + '='.repeat(60));
    console.log('  ✅ ONBOARDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n  Company:    ${name}`);
    console.log(`  Company ID: ${companyId}`);
    console.log(`\n  ── Next Steps ──`);
    console.log(`  1. Ask the client's HR admin to open the invite email and set their password`);
    console.log(`  2. HR logs in and adds employees (or uses CSV bulk import)`);
    console.log(`  3. HR creates teams and assigns managers`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
