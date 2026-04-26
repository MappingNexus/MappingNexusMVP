import { PoolClient } from 'pg';
import { pool } from '../config/db.js';

type Queryable = Pick<PoolClient, 'query'>;

export async function revokeAllActiveSessionsForUser(
    userId: string,
    client: Queryable = pool
): Promise<number> {
    const result = await client.query(
        `UPDATE public.refresh_token_sessions
         SET revoked = true
         WHERE user_id = $1
           AND revoked = false
           AND expires_at > now()`,
        [userId]
    );

    return result.rowCount ?? 0;
}

export const forceLogoutUserSessions = revokeAllActiveSessionsForUser;
