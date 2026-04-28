import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

type UserRole = 'hr' | 'manager' | 'employee';

type TestUser = {
    userId: string;
    companyId: string;
    role: UserRole;
    email: string;
};

type TestEmployee = {
    employee_id: string;
    company_id: string;
    name_encrypted: string;
    cost_per_day_encrypted: string;
    department: string;
    seniority_level: string;
    location: string;
    travel_eligible: boolean;
    current_project_load: number;
    tenure_years: number;
    is_archived: boolean;
};

type TestSkill = {
    skill_id: string;
    employee_id: string;
    company_id: string;
    skill_name: string;
    proficiency: string;
    last_used_date: string;
};

let currentUser: TestUser;
let fakeSupabase: FakeSupabase;

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
const logActionMock = jest.fn(async () => undefined);
const generateQueryEmbeddingMock = jest.fn(async () => Array.from({ length: 384 }, () => 0.42));

class FakeSupabase {
    employees: TestEmployee[] = [];
    skills: TestSkill[] = [];
    availabilityWindows: any[] = [];
    vectorResults: any[] = [];

    from(table: string) {
        return new GenericQueryBuilder(this, table);
    }

    async rpc(fn: string, params: Record<string, any>) {
        if (fn !== 'match_skills_by_embedding') {
            return { data: null, error: { message: `Unhandled RPC ${fn}` } };
        }

        const vector = Array.isArray(params.query_embedding)
            ? params.query_embedding
            : JSON.parse(String(params.query_embedding || '[]'));

        if (vector.length !== 384) {
            return { data: null, error: { message: `Expected 384-dim query embedding, got ${vector.length}` } };
        }

        return {
            data: this.vectorResults.filter(result => result.company_id === params.match_company_id),
            error: null,
        };
    }
}

class GenericQueryBuilder {
    private filters: Array<{ kind: 'eq' | 'in' | 'not'; column: string; value: unknown }> = [];
    private singleMode = false;

    constructor(private readonly db: FakeSupabase, private readonly table: string) {}

    select(_columns = '*') {
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push({ kind: 'eq', column, value });
        return this;
    }

    in(column: string, value: unknown[]) {
        this.filters.push({ kind: 'in', column, value });
        return this;
    }

    not(column: string, _op: string, value: unknown) {
        this.filters.push({ kind: 'not', column, value });
        return this;
    }

    order(_column: string, _options?: { ascending?: boolean }) {
        return this;
    }

    single() {
        this.singleMode = true;
        return this.execute();
    }

    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ) {
        return this.execute().then(onfulfilled, onrejected);
    }

    private getSource() {
        if (this.table === 'employees') return this.db.employees;
        if (this.table === 'skills') return this.db.skills;
        if (this.table === 'availability_window') return this.db.availabilityWindows;
        if (this.table === 'team_memberships') return [];
        throw new Error(`Unhandled table in matching test fake supabase: ${this.table}`);
    }

    private async execute() {
        const rows = this.getSource().filter(row => this.filters.every(filter => {
            const value = (row as Record<string, unknown>)[filter.column];
            if (filter.kind === 'eq') return value === filter.value;
            if (filter.kind === 'in') return Array.isArray(filter.value) && filter.value.includes(value);
            if (filter.kind === 'not') return value !== filter.value;
            return true;
        }));

        if (this.singleMode) {
            if (rows.length !== 1) {
                return { data: null, error: { code: 'PGRST116', message: 'Row not found.' } };
            }
            return { data: structuredClone(rows[0]), error: null };
        }

        return { data: structuredClone(rows), error: null };
    }
}

jest.unstable_mockModule('../config/supabase.js', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => fakeSupabase.from(table)),
        rpc: jest.fn((fn: string, params: Record<string, any>) => fakeSupabase.rpc(fn, params)),
    },
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        (req as express.Request & { user?: TestUser }).user = currentUser;
        next();
    },
    requireRole: (...roles: UserRole[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const user = (req as express.Request & { user?: TestUser }).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ success: false, message: 'Access denied.' });
            return;
        }
        next();
    },
}));

jest.unstable_mockModule('../middleware/rateLimiter.js', () => ({
    matchingLimiter: passThrough,
}));

jest.unstable_mockModule('../services/encryption.service.js', () => ({
    decrypt: jest.fn(async (value: string) => value),
    hashForDisplay: jest.fn((id: string) => `HASH-${id.slice(-4)}`),
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
    logAction: logActionMock,
    AuditActions: {
        MATCH_QUERY_EXECUTED: 'match_query_executed',
    },
}));

jest.unstable_mockModule('../services/embedding.service.js', () => ({
    generateQueryEmbedding: generateQueryEmbeddingMock,
}));

jest.unstable_mockModule('../utils/company-secret.js', () => ({
    getCompanySecret: jest.fn(() => undefined),
}));

jest.unstable_mockModule('../utils/validation.js', () => ({
    validate: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.unstable_mockModule('../config/env.js', () => ({
    env: {
        OPENROUTER_API_KEY: 'test-key',
    },
}));

jest.unstable_mockModule('@langchain/openai', () => ({
    ChatOpenAI: class {
        constructor() {}
        async invoke() {
            return { content: '[]' };
        }
    },
}));

jest.unstable_mockModule('@langchain/core/documents', () => ({
    Document: class {
        pageContent: string;
        metadata: Record<string, unknown>;
        constructor(params: { pageContent: string; metadata: Record<string, unknown> }) {
            this.pageContent = params.pageContent;
            this.metadata = params.metadata;
        }
    },
}));

jest.unstable_mockModule('@langchain/core/messages', () => ({
    HumanMessage: class {
        constructor(public readonly content: string) {}
    },
    SystemMessage: class {
        constructor(public readonly content: string) {}
    },
}));

const { default: matchingRoutes } = await import('./matching.routes.js');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/match', matchingRoutes);
    return app;
}

describe('matching route semantic shortlist', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createApp();
        currentUser = {
            userId: 'hr-1',
            companyId: 'company-a',
            role: 'hr',
            email: 'hr@company-a.test',
        };
        fakeSupabase = new FakeSupabase();
        logActionMock.mockClear();
        generateQueryEmbeddingMock.mockClear();

        fakeSupabase.employees = [
            {
                employee_id: 'emp-1',
                company_id: 'company-a',
                name_encrypted: 'Alice',
                cost_per_day_encrypted: '4000',
                department: 'Engineering',
                seniority_level: 'senior',
                location: 'Bangalore',
                travel_eligible: true,
                current_project_load: 0,
                tenure_years: 4,
                is_archived: false,
            },
            {
                employee_id: 'emp-2',
                company_id: 'company-a',
                name_encrypted: 'Bob',
                cost_per_day_encrypted: '7000',
                department: 'Engineering',
                seniority_level: 'mid',
                location: 'Pune',
                travel_eligible: true,
                current_project_load: 2,
                tenure_years: 2,
                is_archived: false,
            },
        ];

        fakeSupabase.skills = [
            {
                skill_id: 'skill-1',
                employee_id: 'emp-1',
                company_id: 'company-a',
                skill_name: 'react',
                proficiency: 'expert',
                last_used_date: '2026-04-15',
            },
            {
                skill_id: 'skill-2',
                employee_id: 'emp-1',
                company_id: 'company-a',
                skill_name: 'typescript',
                proficiency: 'intermediate',
                last_used_date: '2026-04-10',
            },
            {
                skill_id: 'skill-3',
                employee_id: 'emp-2',
                company_id: 'company-a',
                skill_name: 'react',
                proficiency: 'intermediate',
                last_used_date: '2026-04-08',
            },
        ];

        fakeSupabase.vectorResults = [
            { employee_id: 'emp-1', skill_name: 'react', similarity: 0.97, company_id: 'company-a' },
            { employee_id: 'emp-1', skill_name: 'typescript', similarity: 0.91, company_id: 'company-a' },
            { employee_id: 'emp-2', skill_name: 'react', similarity: 0.72, company_id: 'company-a' },
        ];
    });

    it('returns ranked semantic matches for a synthetic workforce query', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({
                brief: 'Need a frontend engineer for a client portal refresh.',
                requirements: {
                    skills: [
                        { name: 'React', priority: 'Essential' },
                        { name: 'TypeScript', priority: 'Preferred' },
                    ],
                    seniorityLevel: 'senior',
                    travelRequired: false,
                    startDate: '2026-05-15',
                    endDate: '2026-06-30',
                },
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.searchMethod).toBe('semantic');
        expect(response.body.totalCandidatesScanned).toBe(2);
        expect(generateQueryEmbeddingMock).toHaveBeenCalledWith(
            [
                { name: 'React', priority: 'Essential' },
                { name: 'TypeScript', priority: 'Preferred' },
            ],
            'Need a frontend engineer for a client portal refresh.'
        );
        expect(response.body.matches).toHaveLength(2);
        expect(response.body.matches[0]).toMatchObject({
            rank: 1,
            confidenceScore: expect.any(Number),
            employee: {
                employeeId: 'emp-1',
                name: 'Alice',
            },
        });
        expect(response.body.matches[1]).toMatchObject({
            rank: 2,
            employee: {
                employeeId: 'emp-2',
                name: 'Bob',
            },
        });
        expect(response.body.matches[0].confidenceScore).toBeGreaterThan(response.body.matches[1].confidenceScore);
    });
});
