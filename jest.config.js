module.exports = {
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/testDb.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
  coverageDirectory: 'coverage',
};
