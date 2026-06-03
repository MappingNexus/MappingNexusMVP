import { Worker, Job } from 'bullmq';
import { redisConnection } from './queue.js';
import { pool } from '../config/db.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const embeddingWorker = redisConnection ? new Worker('embedding-queue', async (job: Job) => {
    const { employeeId, skillsText } = job.data;

    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set');
    }

    if (!skillsText || skillsText.trim() === '') {
        console.log(`[Worker] Job ${job.id} skipped: No skills text provided for employee ${employeeId}`);
        return;
    }

    console.log(`[Worker] Generating embedding for employee ${employeeId} via OpenRouter...`);

    // Call OpenRouter API using text-embedding-3-small
    // Note: We request 384 dimensions to match our vector(384) DB column.
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'Mapping Nexus MVP'
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: skillsText,
            dimensions: 384
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const vector = data.data[0].embedding;

    console.log(`[Worker] Vector generated for employee ${employeeId}. Updating database...`);

    // Execute SQL UPDATE to save it to Neon DB.
    // Update all skill rows for this employee with the composite embedding.
    const query = `UPDATE public.skills SET embedding = $1 WHERE employee_id = $2`;
    await pool.query(query, [JSON.stringify(vector), employeeId]);

    console.log(`[Worker] Job ${job.id} completed. DB updated for employee ${employeeId}.`);

}, { connection: redisConnection }) : null;

embeddingWorker?.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
