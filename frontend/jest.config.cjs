module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  setupFiles: ['<rootDir>/tests/setup/polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|mjs|cjs)$': ['babel-jest', { configFile: require.resolve('./babel.config.cjs') }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|@bundled-es-modules|rettime|until-async|strict-event-emitter|@open-draft|headers-polyfill|statuses|outvariant)/)',
  ],
  globals: {
    'import.meta': {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api',
      },
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'cjs'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/index.css',
    '!src/App.css',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};