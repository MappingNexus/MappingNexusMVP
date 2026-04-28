module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
            diagnostics: false,
            tsconfig: '<rootDir>/tsconfig.test.json',
        }],
    },
    setupFiles: ['<rootDir>/src/test/jest.env.ts'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
};
