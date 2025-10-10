/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
};