import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const isTest = process.env.NODE_ENV === 'test';

export const redisConnection = redisUrl || isTest
    ? new Redis(redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        retryStrategy: () => null,
    })
    : null;

if (redisConnection && typeof (redisConnection as any).on === 'function') {
    redisConnection.on('error', () => {}); // Suppress noisy local Redis errors
}

export const embeddingQueue = redisConnection
    ? new Queue('embedding-queue', { connection: redisConnection })
    : null;

/**
 * Enqueue a job to generate and save an embedding vector for an employee's skills.
 */
export async function enqueueEmbeddingJob(employeeId: string, skillsText: string) {
    if (!embeddingQueue) {
        return;
    }

    await embeddingQueue.add('generate-embedding', { employeeId, skillsText }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
}
