import {
    decrypt,
    decryptFields,
    encrypt,
    encryptFields,
    hashForDisplay,
} from './encryption.service.js';

const COMPANY_ID = 'company-test';
const COMPANY_SECRET = 'correct horse battery staple';

describe('encryption service', () => {
    it('encrypts and decrypts session-protected ciphertext', async () => {
        // setup
        const plaintext = 'alice@example.com';

        // action
        const ciphertext = await encrypt(plaintext, COMPANY_ID, COMPANY_SECRET);

        // assertion
        expect(ciphertext).toMatch(/^v2:/);
        await expect(decrypt(ciphertext, COMPANY_ID, COMPANY_SECRET)).resolves.toBe(plaintext);
    });

    it('rejects session-protected ciphertext without the company secret', async () => {
        // setup
        const ciphertext = await encrypt('sensitive-value', COMPANY_ID, COMPANY_SECRET);

        // action/assertion
        await expect(decrypt(ciphertext, COMPANY_ID)).rejects.toThrow(
            /Company secret required to decrypt protected data/
        );
    });

    it('still supports legacy company-derived ciphertext', async () => {
        // setup
        const plaintext = 'legacy-value';

        // action
        const ciphertext = await encrypt(plaintext, COMPANY_ID);

        // assertion
        expect(ciphertext).not.toMatch(/^v2:/);
        await expect(decrypt(ciphertext, COMPANY_ID)).resolves.toBe(plaintext);
    });

    it('preserves nulls and recovers plaintext field values', async () => {
        // setup
        const fields = {
            name: 'Alice',
            costPerDay: 1234,
            note: null,
        };

        // action
        const encrypted = await encryptFields(fields, COMPANY_ID, COMPANY_SECRET);
        const decrypted = await decryptFields(encrypted, COMPANY_ID, COMPANY_SECRET);

        // assertion
        expect(encrypted.note).toBeNull();
        expect(decrypted).toEqual({
            name: 'Alice',
            costPerDay: '1234',
            note: null,
        });
    });

    it('hashForDisplay is deterministic and short enough for UI display', () => {
        // setup
        const id = 'employee-123';

        // action
        const first = hashForDisplay(id);
        const second = hashForDisplay(id);

        // assertion
        expect(first).toBe(second);
        expect(first).toHaveLength(12);
    });
});
