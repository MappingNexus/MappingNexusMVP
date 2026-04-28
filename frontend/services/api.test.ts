import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as api from './api.ts';
import type { UserProfile } from '../types';

class MemoryStorage {
    private store = new Map<string, string>();

    clear() {
        this.store.clear();
    }

    getItem(key: string) {
        return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number) {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string) {
        this.store.delete(key);
    }

    setItem(key: string, value: string) {
        this.store.set(key, String(value));
    }

    get length() {
        return this.store.size;
    }
}

const user: UserProfile = {
    id: 'user-1',
    email: 'hr@example.com',
    role: 'hr',
    companyId: 'company-1',
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

function installBrowserMocks() {
    const storage = new MemoryStorage();

    (globalThis as any).localStorage = storage;
    (globalThis as any).window = {
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        location: { href: '' },
        setTimeout: globalThis.setTimeout.bind(globalThis),
    };

    return storage;
}

beforeEach(() => {
    installBrowserMocks();
    (globalThis as any).fetch = async () => jsonResponse({ success: true });
    api.clearSession();
});

test('getErrorMessage returns the API message when present', () => {
    assert.equal(api.getErrorMessage({ message: 'Concrete error' }, 'Fallback'), 'Concrete error');
    assert.equal(api.getErrorMessage({ success: false }, 'Fallback'), 'Fallback');
});

test('login stores the session and user on success', async () => {
    (globalThis as any).fetch = async (_url: string, init?: RequestInit) => {
        assert.equal(init?.method, 'POST');
        assert.match(String(init?.body), /"email":"hr@example.com"/);

        return jsonResponse({
            success: true,
            session: {
                access_token: 'access-token',
                refresh_token: 'refresh-token',
            },
            user,
        });
    };

    const result = await api.login('hr@example.com', 'password');

    assert.equal(result.success, true);
    assert.equal(api.getToken(), 'access-token');
    assert.deepEqual(api.getUser(), user);
});

test('auth-exempt routes do not trigger token refresh on 401 responses', async () => {
    const calls: string[] = [];

    (globalThis as any).fetch = async (url: string) => {
        calls.push(new URL(url).pathname);
        return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
    };

    const result = await api.getInviteStatus();

    assert.deepEqual(calls, ['/api/auth/invite-status']);
    assert.equal(result.success, false);
    assert.equal(result.message, 'Unauthorized');
});

test('authenticated routes refresh an expired token and retry once', async () => {
    api.setSession(
        {
            access_token: 'expired-access-token',
            refresh_token: 'refresh-token-1',
        },
        user
    );

    const calls: string[] = [];

    (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        const headers = init?.headers as Record<string, string> | undefined;
        calls.push(path);

        if (path === '/api/auth/me' && calls.filter(call => call === path).length === 1) {
            assert.equal(headers?.Authorization, 'Bearer expired-access-token');
            return jsonResponse({ success: false, message: 'Invalid or expired token.' }, 401);
        }

        if (path === '/api/auth/refresh') {
            return jsonResponse({
                success: true,
                session: {
                    access_token: 'fresh-access-token',
                    refresh_token: 'refresh-token-2',
                },
            });
        }

        if (path === '/api/auth/me') {
            assert.equal(headers?.Authorization, 'Bearer fresh-access-token');
            return jsonResponse({ success: true, user });
        }

        throw new Error(`Unexpected request path: ${path}`);
    };

    const result = await api.getMe();

    assert.deepEqual(calls, ['/api/auth/me', '/api/auth/refresh', '/api/auth/me']);
    assert.equal(result.success, true);
    assert.equal(api.getToken(), 'fresh-access-token');
});

test('network aborts are normalized into timeout failures', async () => {
    (globalThis as any).fetch = async () => {
        const error = new Error('aborted');
        (error as Error & { name: string }).name = 'AbortError';
        throw error;
    };

    const result = await api.getProjects() as {
        success: boolean;
        status?: number;
        message?: string;
    };

    assert.equal(result.success, false);
    assert.equal(result.status, 408);
    assert.equal(result.message, 'The request timed out. Please try again.');
});
