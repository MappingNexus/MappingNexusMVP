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

type TestProject = {
    project_id: string;
    company_id: string;
    project_name: string;
    required_skills: Array<{ skill_name: string; proficiency: string; count: number }>;
    start_date: string | null;
    end_date: string | null;
    status: 'planned' | 'active' | 'completed';
};

let currentUser: TestUser;
let fakeSupabase: FakeSupabase;

class FakeSupabase {
    projects: TestProject[] = [];

    from(table: string) {
        if (table !== 'projects') {
            throw new Error(`Unhandled table in projects test fake supabase: ${table}`);
        }
        return new ProjectQueryBuilder(this.projects);
    }
}

class ProjectQueryBuilder {
    private filters: Array<{ column: string; value: unknown }> = [];
    private updatePayload: Partial<TestProject> | null = null;
    private singleMode = false;
    private orderBy: { column: keyof TestProject; ascending: boolean } | null = null;

    constructor(private readonly projects: TestProject[]) {}

    select(_columns = '*') {
        return this;
    }

    update(values: Partial<TestProject>) {
        this.updatePayload = values;
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push({ column, value });
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.orderBy = {
            column: column as keyof TestProject,
            ascending: options?.ascending !== false,
        };
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

    private async execute() {
        const matchingProjects = this.applyFilters();

        if (this.updatePayload) {
            if (matchingProjects.length === 0) {
                return this.singleMode
                    ? { data: null, error: { code: 'PGRST116', message: 'Row not found.' } }
                    : { data: [], error: null };
            }

            const updatedProjects = matchingProjects.map(project => {
                Object.assign(project, this.updatePayload);
                return structuredClone(project);
            });

            return this.singleMode
                ? { data: updatedProjects[0], error: null }
                : { data: updatedProjects, error: null };
        }

        let data = matchingProjects.map(project => structuredClone(project));
        if (this.orderBy) {
            const { column, ascending } = this.orderBy;
            data.sort((a, b) => {
                const left = a[column] ?? '';
                const right = b[column] ?? '';
                if (left === right) return 0;
                return left > right ? (ascending ? 1 : -1) : (ascending ? -1 : 1);
            });
        }

        return this.singleMode
            ? data.length === 1
                ? { data: data[0], error: null }
                : { data: null, error: { code: 'PGRST116', message: 'Row not found.' } }
            : { data, error: null };
    }

    private applyFilters() {
        return this.projects.filter(project =>
            this.filters.every(filter => (project as Record<string, unknown>)[filter.column] === filter.value)
        );
    }
}

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();

jest.unstable_mockModule('../config/supabase.js', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => fakeSupabase.from(table)),
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

jest.unstable_mockModule('../services/audit.service.js', () => ({
    logAction: jest.fn(async () => undefined),
    AuditActions: {},
}));

const { default: projectsRoutes } = await import('./projects.routes.js');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/projects', projectsRoutes);
    return app;
}

describe('projects route tenant isolation', () => {
    let app: express.Express;

    beforeEach(() => {
        fakeSupabase = new FakeSupabase();
        app = createApp();
        currentUser = {
            userId: 'user-a',
            companyId: 'company-a',
            role: 'manager',
            email: 'manager@company-a.test',
        };
        fakeSupabase.projects = [
            {
                project_id: 'project-a',
                company_id: 'company-a',
                project_name: 'Alpha Project',
                required_skills: [{ skill_name: 'react', proficiency: 'expert', count: 2 }],
                start_date: '2026-05-01',
                end_date: '2026-06-01',
                status: 'planned',
            },
            {
                project_id: 'project-b',
                company_id: 'company-b',
                project_name: 'Bravo Project',
                required_skills: [{ skill_name: 'python', proficiency: 'expert', count: 1 }],
                start_date: '2026-05-02',
                end_date: '2026-06-02',
                status: 'active',
            },
        ];
    });

    it('only returns projects for the authenticated user company', async () => {
        const response = await request(app).get('/api/projects');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.projects).toHaveLength(1);
        expect(response.body.projects[0]).toMatchObject({
            project_id: 'project-a',
            company_id: 'company-a',
        });
        expect(response.body.projects.some((project: TestProject) => project.project_id === 'project-b')).toBe(false);
    });

    it('returns 404 and leaves the target untouched when updating another company project', async () => {
        currentUser = {
            userId: 'hr-a',
            companyId: 'company-a',
            role: 'hr',
            email: 'hr@company-a.test',
        };

        const response = await request(app)
            .put('/api/projects/project-b')
            .send({
                projectName: 'Hijacked Project',
                requiredSkills: [{ skill_name: 'go', proficiency: 'intermediate', count: 1 }],
                startDate: '2026-05-10',
                endDate: '2026-06-10',
                status: 'completed',
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ success: false, message: 'Project not found.' });

        const untouchedProject = fakeSupabase.projects.find(project => project.project_id === 'project-b');
        expect(untouchedProject).toMatchObject({
            project_name: 'Bravo Project',
            company_id: 'company-b',
            status: 'active',
        });
    });
});
