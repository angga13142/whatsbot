module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/services/**/*.js',
    // Exclude Phase 2 files (not yet tested)
    '!src/services/notificationService.js',
    '!src/services/reportService.js',
    '!src/services/categoryService.js',
    '!src/services/currencyService.js',
    '!src/services/attachmentService.js',
    '!src/services/tagService.js',
    '!src/services/recurringTransactionService.js',
    '!src/services/reportBuilderService.js',
    '!src/services/chartGeneratorService.js',
    '!src/services/dashboardService.js',
    '!src/services/visualAnalyticsService.js',
    '!src/utils/currencyConverter.js',
    '!src/utils/fileHandler.js',
    '!src/utils/reportExporter.js',
    '!src/utils/reportFormatter.js',
    '!src/utils/dateRangeHelper.js',
    '!src/utils/colorPalette.js',
    '!src/utils/chartBuilder.js',
    '!src/utils/imageGenerator.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests
  forceExit: true,
};
