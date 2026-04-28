import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: () => null, // Disable retries to prevent console spam
});

redisConnection.on('error', () => {}); // Suppress error logs

// Mock embeddingQueue to bypass BullMQ Redis connection for testing Calendar Sync
export const embeddingQueue = {
    add: async (name: string, data: any, opts: any) => {
        console.log(`[Mock Queue] Job ${name} added, but Redis is disabled locally.`);
    }
} as any;

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
