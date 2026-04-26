import { PoolClient } from 'pg';
import { pool } from '../config/db.js';

type Queryable = Pick<PoolClient, 'query'>;

export async function revokeAllSessionsForUser(
    userId: string,
    client: Queryable = pool
): Promise<number> {
    const result = await client.query(
        `UPDATE public.refresh_token_sessions
         SET revoked = true
         WHERE user_id = $1
           AND revoked = false`,
        [userId]
    );

    await client.query(
        `UPDATE public.users
         SET token_version = token_version + 1
         WHERE user_id = $1`,
        [userId]
    );

    return result.rowCount ?? 0;
}

export const revokeAllActiveSessionsForUser = revokeAllSessionsForUser;
export const forceLogoutUserSessions = revokeAllSessionsForUser;
