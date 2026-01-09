/**
 * Jest Configuration
 *
 * Reference: https://jestjs.io/docs/configuration
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/scripts/**',
  ],

  // Coverage Threshold
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js', '**/__tests__/**/*.js'],

  // Files to ignore
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/', '/build/'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Verbose output
  verbose: true,

  // Timeout for tests (10 seconds)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],

  // Transform files (if using babel)
  // transform: {
  //   '^.+\\.js$': 'babel-jest',
  // },

  // Module name mapper (for aliasing)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@bot/(.*)$': '<rootDir>/src/bot/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },

  // Watch plugins
  // watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Notify on completion
  notify: false,
  notifyMode: 'failure-change',

  // Collect coverage on changed files only
  // collectCoverageOnlyFrom: undefined,

  // Bail after n failures
  bail: 0,

  // Max workers
  maxWorkers: '50%',
};
