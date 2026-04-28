import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: () => null, // Disable retries to prevent console spam
});

if (typeof (redisConnection as any).on === 'function') {
    redisConnection.on('error', () => {}); // Suppress noisy local Redis errors
}

export const embeddingQueue = new Queue('embedding-queue', {
    connection: redisConnection,
});

/**
 * Enqueue a job to generate and save an embedding vector for an employee's skills.
 */
export async function enqueueEmbeddingJob(employeeId: string, skillsText: string) {
    await embeddingQueue.add('generate-embedding', { employeeId, skillsText }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
}
