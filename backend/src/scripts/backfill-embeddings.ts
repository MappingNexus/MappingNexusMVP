/**
 * Backfill Embeddings Script
 *
 * Generates vector embeddings for all existing skills that don't have them.
 * Run after deploying migration 007 + 008.
 *
 * Usage: npm run backfill-embeddings
 */
import { supabaseAdmin } from '../config/supabase.js';
import { generateSkillEmbedding } from '../services/embedding.service.js';

async function backfill() {
    console.log('🔄 Starting embedding backfill...\n');

    // Fetch all skills without embeddings
    const { data: skills, error } = await supabaseAdmin
        .from('skills')
        .select('*')
        .is('embedding', null);

    if (error) {
        console.error('❌ Failed to fetch skills:', error.message);
        process.exit(1);
    }

    if (!skills || skills.length === 0) {
        console.log('✅ All skills already have embeddings. Nothing to do.');
        process.exit(0);
    }

    console.log(`📊 Found ${skills.length} skills without embeddings.\n`);

    // Detect primary key column name (skill_id or id)
    const pkCol = skills[0].skill_id ? 'skill_id' : 'id';
    console.log(`   Using primary key column: ${pkCol}\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        const skillName = skill.skill_name;
        const proficiency = skill.proficiency || 'intermediate';
        const pk = skill[pkCol];

        try {
            const embedding = await generateSkillEmbedding(skillName, proficiency);

            const { error: updateError } = await supabaseAdmin
                .from('skills')
                .update({ embedding: JSON.stringify(embedding) })
                .eq(pkCol, pk);

            if (updateError) {
                console.error(`  ❌ ${skillName}: ${updateError.message}`);
                failed++;
            } else {
                success++;
            }

            // Progress every 25 skills
            if ((i + 1) % 25 === 0) {
                console.log(`  📈 Progress: ${i + 1}/${skills.length} (${success} ok, ${failed} failed)`);
            }
        } catch (err: any) {
            console.error(`  ❌ ${skillName}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Backfill complete: ${success} embedded, ${failed} failed out of ${skills.length} total.`);
    process.exit(0);
}

backfill();
