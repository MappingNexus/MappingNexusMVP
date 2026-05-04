/**
 * Supabase Compatibility Shim — Neon DB
 *
 * Mimics the Supabase client's chained query builder API
 * (.from().select().eq().eq().single() etc.) using node-postgres (pg)
 * under the hood.
 *
 * This lets all existing route files work without rewriting every query.
 *
 * Supported: select, insert, update, delete, eq, neq, in, is,
 *            order, limit, range, single, maybeSingle, count
 */
import { pool } from './db.js';

type Row = Record<string, any>;

type QueryResult = {
    data: any;
    error: { message: string; code?: string } | null;
    count?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Query Builder
// ─────────────────────────────────────────────────────────────────────────────

class SupabaseQueryBuilder {
    private tableName: string;
    private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private selectCols = '*';
    private conditions: { col: string; op: string; val: any }[] = [];
    private insertData: Row | Row[] | null = null;
    private updateData: Row | null = null;
    private orderCols: { col: string; asc: boolean }[] = [];
    private limitVal: number | null = null;
    private offsetVal: number | null = null;
    private isSingle = false;
    private isMaybeSingle = false;
    private withCount = false;
    private inConditions: { col: string; vals: any[] }[] = [];
    private isConditions: { col: string; val: any }[] = [];
    private neqConditions: { col: string; val: any }[] = [];
    private returningCols = '*';

    constructor(table: string) {
        this.tableName = table;
    }

    select(cols = '*', opts?: { count?: 'exact' }) {
        if (this.operation === 'insert' || this.operation === 'update' || this.operation === 'delete') {
            this.returningCols = this.normalizeSelectCols(cols);
            return this;
        }
        this.operation = 'select';
        // Strip Supabase join syntax like "*, team_memberships(count)" — simplify to base cols
        this.selectCols = this.normalizeSelectCols(cols);
        if (opts?.count === 'exact') this.withCount = true;
        return this;
    }

    insert(data: Row | Row[]) {
        this.operation = 'insert';
        this.insertData = data;
        return this;
    }

    update(data: Row) {
        this.operation = 'update';
        this.updateData = data;
        return this;
    }

    delete() {
        this.operation = 'delete';
        return this;
    }

    // select() result after insert/update
    returning(cols = '*') {
        this.returningCols = this.normalizeSelectCols(cols);
        return this;
    }

    eq(col: string, val: any) {
        this.conditions.push({ col, op: '=', val });
        return this;
    }

    neq(col: string, val: any) {
        this.neqConditions.push({ col, val });
        return this;
    }

    in(col: string, vals: any[]) {
        this.inConditions.push({ col, vals });
        return this;
    }

    is(col: string, val: any) {
        this.isConditions.push({ col, val });
        return this;
    }

    gte(col: string, val: any) {
        this.conditions.push({ col, op: '>=', val });
        return this;
    }

    gt(col: string, val: any) {
        this.conditions.push({ col, op: '>', val });
        return this;
    }

    lte(col: string, val: any) {
        this.conditions.push({ col, op: '<=', val });
        return this;
    }

    lt(col: string, val: any) {
        this.conditions.push({ col, op: '<', val });
        return this;
    }

    ilike(col: string, pattern: string) {
        this.conditions.push({ col, op: 'ILIKE', val: pattern });
        return this;
    }

    not(col: string, op: string, val: any) {
        // Simplified: treat as a NOT eq
        this.neqConditions.push({ col, val });
        return this;
    }

    /** No-op — throwOnError not needed since we return { data, error } */
    throwOnError() {
        return this;
    }

    /** Basic OR support — logs warning, falls through without filtering */
    or(_filterString: string) {
        // Complex OR filtering not implemented in shim.
        // Move complex queries to raw pool.query() for best results.
        console.warn('[SupabaseShim] or() filter not fully implemented. Results may be unfiltered.');
        return this;
    }

    order(col: string, opts?: { ascending?: boolean }) {
        this.orderCols.push({ col, asc: opts?.ascending !== false });
        return this;
    }

    limit(n: number) {
        this.limitVal = n;
        return this;
    }

    range(from: number, to: number) {
        this.offsetVal = from;
        this.limitVal = to - from + 1;
        return this;
    }

    single() {
        this.isSingle = true;
        this.limitVal = 1;
        return this.execute();
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        this.limitVal = 1;
        return this.execute();
    }

    then(resolve: (val: QueryResult) => any, reject?: (err: any) => any) {
        return this.execute().then(resolve, reject);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private normalizeSelectCols(cols: string): string {
        if (!cols || cols === '*') return '*';
        // Remove Supabase join syntax: table(cols) → just use the local cols
        // e.g. "*, team_memberships(count)" → "*"
        // e.g. "employee_id, name_encrypted, skills(skill_id, skill_name)" → "employee_id, name_encrypted"
        return cols
            .split(',')
            .map(c => c.trim())
            .filter(c => !c.includes('('))
            .join(', ') || '*';
    }

    private buildWhere(params: any[]): string {
        const parts: string[] = [];

        for (const c of this.conditions) {
            params.push(c.val);
            parts.push(`${this.quoteCol(c.col)} ${c.op} $${params.length}`);
        }

        for (const c of this.neqConditions) {
            params.push(c.val);
            parts.push(`${this.quoteCol(c.col)} != $${params.length}`);
        }

        for (const c of this.isConditions) {
            if (c.val === null) {
                parts.push(`${this.quoteCol(c.col)} IS NULL`);
            } else if (c.val === false) {
                parts.push(`${this.quoteCol(c.col)} IS FALSE`);
            } else if (c.val === true) {
                parts.push(`${this.quoteCol(c.col)} IS TRUE`);
            }
        }

        for (const c of this.inConditions) {
            if (c.vals.length === 0) {
                parts.push('FALSE'); // IN () always false
            } else {
                const placeholders = c.vals.map(v => {
                    params.push(v);
                    return `$${params.length}`;
                });
                parts.push(`${this.quoteCol(c.col)} IN (${placeholders.join(', ')})`);
            }
        }

        return parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
    }

    private quoteCol(col: string): string {
        // If column already quoted or has table prefix, leave it
        if (col.includes('.') || col.startsWith('"')) return col;
        return col;
    }

    private async execute(): Promise<QueryResult> {
        try {
            const params: any[] = [];
            let sql = '';

            if (this.operation === 'select') {
                const where = this.buildWhere(params);
                const order = this.orderCols.length > 0
                    ? `ORDER BY ${this.orderCols.map(o => `${o.col} ${o.asc ? 'ASC' : 'DESC'}`).join(', ')}`
                    : '';
                const limit = this.limitVal != null ? `LIMIT ${this.limitVal}` : '';
                const offset = this.offsetVal != null ? `OFFSET ${this.offsetVal}` : '';
                const countCol = this.withCount ? ', COUNT(*) OVER() AS _total_count' : '';

                sql = `SELECT ${this.selectCols}${countCol} FROM public.${this.tableName} ${where} ${order} ${limit} ${offset}`.trim();

            } else if (this.operation === 'insert') {
                const rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData!];
                const cols = Object.keys(rows[0]);
                const valueSets = rows.map(row => {
                    const placeholders = cols.map(col => {
                        const val = row[col];
                        params.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
                        return `$${params.length}`;
                    });
                    return `(${placeholders.join(', ')})`;
                });
                sql = `INSERT INTO public.${this.tableName} (${cols.join(', ')}) VALUES ${valueSets.join(', ')} RETURNING ${this.returningCols}`;

            } else if (this.operation === 'update') {
                const setCols = Object.keys(this.updateData!);
                const setClause = setCols.map(col => {
                    const val = this.updateData![col];
                    params.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
                    return `${col} = $${params.length}`;
                });
                const where = this.buildWhere(params);
                sql = `UPDATE public.${this.tableName} SET ${setClause.join(', ')} ${where} RETURNING ${this.returningCols}`;

            } else if (this.operation === 'delete') {
                const where = this.buildWhere(params);
                sql = `DELETE FROM public.${this.tableName} ${where} RETURNING *`;
            }

            const result = await pool.query(sql, params);
            const rows = result.rows;

            if (this.isSingle || this.isMaybeSingle) {
                if (rows.length === 0) {
                    if (this.isSingle) {
                        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
                    }
                    return { data: null, error: null };
                }
                const row = { ...rows[0] };
                delete row._total_count;
                return { data: row, error: null };
            }

            const count = rows.length > 0 && rows[0]._total_count != null
                ? parseInt(rows[0]._total_count)
                : rows.length;

            const cleanRows = rows.map(r => { const c = { ...r }; delete c._total_count; return c; });
            return { data: cleanRows, error: null, count };

        } catch (err: any) {
            console.error(`[SupabaseShim] Query error on ${this.tableName}:`, err.message);
            return { data: null, error: { message: err.message, code: err.code } };
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shim Client — matches Supabase client shape used by routes
// ─────────────────────────────────────────────────────────────────────────────

class SupabaseShimClient {
    from(table: string) {
        return new SupabaseQueryBuilder(table);
    }

    // RPC — used by matching engine for vector similarity
    async rpc(fn: string, params: Record<string, any>): Promise<QueryResult> {
        try {
            if (fn === 'match_skills_by_embedding') {
                const { query_embedding, match_company_id, match_threshold = 0.3, match_count = 50 } = params;
                const vector = Array.isArray(query_embedding)
                    ? query_embedding
                    : JSON.parse(String(query_embedding || '[]'));
                const result = await pool.query(
                    `SELECT * FROM public.match_skills_by_embedding($1::vector, $2, $3, $4)`,
                    [`[${vector.join(',')}]`, match_company_id, match_threshold, match_count]
                );
                return { data: result.rows, error: null };
            }

            return { data: null, error: { message: `RPC function '${fn}' not implemented in shim.` } };
        } catch (err: any) {
            return { data: null, error: { message: err.message } };
        }
    }

    /**
     * auth stub — for scripts/routes that call supabaseAdmin.auth.admin.createUser()
     * These calls now delegate to the pool-based user creation in auth.routes.ts.
     * Scripts calling this directly should be updated to use the pool.
     */
    auth = {
        admin: {
            createUser: async (params: any) => {
                // In Neon mode, user creation is done via auth.routes.ts /invite-user
                // This stub correctly populates public.users for backward compat during migration.
                const userId = (await import('crypto')).default.randomUUID();
                const bcrypt = await import('bcrypt');
                const temporaryHash = await bcrypt.hash(params.password || 'TempPassword123!', 12);

                await pool.query(
                    `INSERT INTO public.users (user_id, email, password_hash, company_id, role) VALUES ($1, $2, $3, $4, $5)`,
                    [userId, params.email, temporaryHash, params.user_metadata?.company_id, params.user_metadata?.role || 'employee']
                );

                return {
                    data: { user: { id: userId, email: params.email } },
                    error: null,
                };
            },
            deleteUser: async (_userId: string) => ({ error: null }),
            getUserById: async (userId: string) => {
                const result = await pool.query(
                    'SELECT user_id, email FROM public.users WHERE user_id = $1',
                    [userId]
                );
                const user = result.rows[0] || null;
                return { data: { user }, error: null };
            },
            updateUserById: async (userId: string, updates: any) => {
                if (updates.password) {
                    const bcrypt = await import('bcrypt');
                    const hash = await bcrypt.hash(updates.password, 12);
                    await pool.query('UPDATE public.users SET password_hash = $1 WHERE user_id = $2', [hash, userId]);
                }
                return { error: null };
            },
        },
        resetPasswordForEmail: async (_email: string, _opts?: any) => ({ error: null, data: null }),
        signInWithPassword: async (creds: { email: string; password: string }) => {
            const result = await pool.query('SELECT user_id, email, password_hash FROM public.users WHERE email = $1', [creds.email]);
            if (!result.rows[0]) return { data: null, error: { message: 'User not found' } };
            const bcrypt = await import('bcrypt');
            const valid = await bcrypt.compare(creds.password, result.rows[0].password_hash);
            if (!valid) return { data: null, error: { message: 'Invalid password' } };
            return { data: { user: { id: result.rows[0].user_id, email: result.rows[0].email }, session: null }, error: null };
        },
        getUser: async (_token: string) => ({ data: { user: null }, error: { message: 'Use JWT middleware instead' } }),
        refreshSession: async (_opts: any) => ({ data: null, error: null }),
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// Exports — same names as original supabase.ts so imports don't break
// ─────────────────────────────────────────────────────────────────────────────

/** Admin client (service role) — uses pool directly, bypasses RLS */
export const supabaseAdmin = new SupabaseShimClient();

/** Auth client (anon key) — in Neon, same as admin */
export const supabaseAuth = new SupabaseShimClient();

/** User-scoped client — in Neon, same pool (security enforced in middleware) */
export function createUserScopedClient(_jwt: string): SupabaseShimClient {
    return new SupabaseShimClient();
}

export async function verifySupabaseConnection(): Promise<boolean> {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch {
        return false;
    }
}
