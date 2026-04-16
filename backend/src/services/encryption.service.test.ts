import assert from 'node:assert/strict';
import test from 'node:test';
import {
    decrypt,
    decryptFields,
    encrypt,
    encryptFields,
    hashForDisplay,
} from './encryption.service.js';

const COMPANY_ID = 'company-test';
const COMPANY_SECRET = 'correct horse battery staple';

test('encrypt and decrypt round-trip session-protected ciphertext', async () => {
    const ciphertext = await encrypt('alice@example.com', COMPANY_ID, COMPANY_SECRET);

    assert.match(ciphertext, /^v2:/);
    assert.equal(
        await decrypt(ciphertext, COMPANY_ID, COMPANY_SECRET),
        'alice@example.com'
    );
});

test('decrypt rejects session-protected ciphertext without the company secret', async () => {
    const ciphertext = await encrypt('sensitive-value', COMPANY_ID, COMPANY_SECRET);

    await assert.rejects(
        () => decrypt(ciphertext, COMPANY_ID),
        /Company secret required to decrypt protected data/
    );
});

test('encrypt and decrypt still support legacy company-derived ciphertext', async () => {
    const ciphertext = await encrypt('legacy-value', COMPANY_ID);

    assert.doesNotMatch(ciphertext, /^v2:/);
    assert.equal(await decrypt(ciphertext, COMPANY_ID), 'legacy-value');
});

test('encryptFields and decryptFields preserve nulls and recover plaintext values', async () => {
    const encrypted = await encryptFields(
        {
            name: 'Alice',
            costPerDay: 1234,
            note: null,
        },
        COMPANY_ID,
        COMPANY_SECRET
    );

    assert.equal(encrypted.note, null);

    const decrypted = await decryptFields(encrypted, COMPANY_ID, COMPANY_SECRET);

    assert.deepEqual(decrypted, {
        name: 'Alice',
        costPerDay: '1234',
        note: null,
    });
});

test('hashForDisplay is deterministic and short enough for UI display', () => {
    const first = hashForDisplay('employee-123');
    const second = hashForDisplay('employee-123');

    assert.equal(first, second);
    assert.equal(first.length, 12);
});