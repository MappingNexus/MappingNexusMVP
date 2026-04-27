import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

process.env.OPENROUTER_API_KEY = 'test-key';

const mockAdd = jest.fn<any>();
let workerProcessor: any;

jest.unstable_mockModule('bullmq', () => {
    return {
        Queue: class {
            constructor() {}
            add = mockAdd;
        },
        Worker: class {
            constructor(name: string, processor: any) {
                workerProcessor = processor;
            }
            on() {}
        }
    };
});

jest.unstable_mockModule('ioredis', () => {
    return {
        default: class {
            constructor() {}
        }
    };
});

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../config/db.js', () => {
    return {
        pool: {
            query: mockQuery
        },
        query: mockQuery
    };
});

// Mock Supabase
const mockBuilder = {
    select: jest.fn<any>().mockReturnThis(),
    single: jest.fn<any>().mockResolvedValue({ data: { employee_id: 'emp-123', user_id: 'user-1', is_archived: false }, error: null }),
    eq: jest.fn<any>().mockReturnThis(),
    delete: jest.fn<any>().mockReturnThis(),
    in: jest.fn<any>().mockReturnThis(),
    order: jest.fn<any>().mockReturnThis(),
    then: function(resolve: any) { resolve({ data: { employee_id: 'emp-123' }, error: null }); }
};

const mockSupabaseAdmin = {
    auth: {
        admin: {
            createUser: jest.fn<any>().mockResolvedValue({ data: { user: { id: 'emp-123' } }, error: null }),
            deleteUser: jest.fn<any>().mockResolvedValue({}),
        }
    },
    from: jest.fn<any>(() => ({
        insert: jest.fn<any>(() => mockBuilder),
        update: jest.fn<any>(() => mockBuilder),
        select: jest.fn<any>(() => mockBuilder),
        delete: jest.fn<any>(() => mockBuilder)
    }))
};

jest.unstable_mockModule('../config/supabase.js', () => ({
    supabaseAdmin: mockSupabaseAdmin
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { userId: 'user-1', companyId: 'comp-1', role: 'hr' };
        next();
    },
    requireRole: () => (req: any, res: any, next: any) => next()
}));

jest.unstable_mockModule('../services/encryption.service.js', () => ({
    encrypt: jest.fn(async (val) => val),
    decrypt: jest.fn(async (val) => val),
    encryptFields: jest.fn(async (obj) => obj),
    decryptFields: jest.fn(async (obj) => obj),
    hashForDisplay: jest.fn(() => 'HASH')
}));

jest.unstable_mockModule('../services/password-reset.service.js', () => ({
    sendPasswordSetupEmail: jest.fn<any>().mockResolvedValue({ error: null }),
    getInviteEmailFailureMessage: jest.fn<any>(() => 'failed'),
    getInviteEmailSentMessage: jest.fn<any>(() => 'sent')
}));

jest.unstable_mockModule('../utils/company-secret.js', () => ({
    requireCompanySecret: jest.fn(() => 'secret'),
    getCompanySecret: jest.fn(() => 'secret')
}));

jest.unstable_mockModule('../utils/validation.js', () => ({
    validate: () => (req: any, res: any, next: any) => next()
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
    logAction: jest.fn<any>().mockResolvedValue(undefined),
    AuditActions: { EMPLOYEE_CREATED: 'EMPLOYEE_CREATED', EMPLOYEE_EDITED: 'EMPLOYEE_EDITED' }
}));

const queueModule = await import('./queue.js');
const { enqueueEmbeddingJob } = queueModule;
await import('./embedding.worker.js'); // Ensure worker is initialized
const { default: employeesRoutes } = await import('../routes/employees.routes.js');

const app = express();
app.use(express.json());
app.use('/api/employees', employeesRoutes);

const mockFetch = jest.fn<any>();
(global as any).fetch = mockFetch;

describe('BullMQ Embedding Queue & Worker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. enqueueEmbeddingJob() — Queue Test', async () => {
        await enqueueEmbeddingJob('emp-123', 'JavaScript, TypeScript, React');
        expect(mockAdd).toHaveBeenCalledWith(
            'generate-embedding',
            { employeeId: 'emp-123', skillsText: 'JavaScript, TypeScript, React' },
            expect.objectContaining({
                attempts: 3,
                backoff: expect.objectContaining({ type: 'exponential' })
            })
        );
    });

    it('2. Worker Processor — Success Case', async () => {
        const fakeVector = Array(384).fill(0.5);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ embedding: fakeVector }] })
        });

        await workerProcessor({
            id: 'job-1',
            data: { employeeId: 'emp-456', skillsText: 'Python' }
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'https://openrouter.ai/api/v1/embeddings',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"dimensions":384')
            })
        );
        expect(mockQuery).toHaveBeenCalledWith(
            'UPDATE public.skills SET embedding = $1 WHERE employee_id = $2',
            [JSON.stringify(fakeVector), 'emp-456']
        );
    });

    it('3. Worker Processor — OpenRouter Failure + Retry', async () => {
        const fakeVector = Array(384).fill(0.1);
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Internal Server Error' })
            .mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'Bad Gateway' })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ embedding: fakeVector }] }) });

        await expect(workerProcessor({ id: 'job-2', data: { employeeId: 'emp-789', skillsText: 'Java' } }))
            .rejects.toThrow('OpenRouter API error');

        await expect(workerProcessor({ id: 'job-2', data: { employeeId: 'emp-789', skillsText: 'Java' } }))
            .rejects.toThrow('OpenRouter API error');

        await workerProcessor({ id: 'job-2', data: { employeeId: 'emp-789', skillsText: 'Java' } });

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(
            'UPDATE public.skills SET embedding = $1 WHERE employee_id = $2',
            [JSON.stringify(fakeVector), 'emp-789']
        );
    });

    it('4. Employee POST route — Instant 200', async () => {
        const payload = {
            name: 'John Doe',
            workEmail: 'john@example.com',
            department: 'Engineering',
            skills: [{ name: 'React', proficiency: 'expert' }]
        };

        const response = await request(app).post('/api/employees').send(payload);

        expect(response.status).toBe(201);
        expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('skills');
        
        expect(mockAdd).toHaveBeenCalledWith(
            'generate-embedding',
            expect.objectContaining({ employeeId: 'emp-123', skillsText: 'react (expert)' }),
            expect.any(Object)
        );
    });

    it('5. Employee PUT route — Instant 200', async () => {
        const payload = {
            skills: [{ name: 'Node.js', proficiency: 'intermediate' }]
        };

        const response = await request(app).put('/api/employees/emp-123').send(payload);

        expect(response.status).toBe(200);
        expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('skills');
        
        expect(mockAdd).toHaveBeenCalledWith(
            'generate-embedding',
            expect.objectContaining({ employeeId: 'emp-123', skillsText: 'node.js (intermediate)' }),
            expect.any(Object)
        );
    });
});
