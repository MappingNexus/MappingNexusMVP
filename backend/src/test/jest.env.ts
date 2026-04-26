process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test-user:test-pass@localhost:5432/test-db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'mappingnexus-jest-secret';
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-placeholder';
process.env.ENCRYPTION_KEK = process.env.ENCRYPTION_KEK || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'jest-google-client-id.apps.googleusercontent.com';
