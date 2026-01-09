module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
    'prettier', // Must be last to override other configs
  ],
  plugins: ['security', 'jest', 'import'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // ════════════════════════════════════════════════
    // ERROR PREVENTION & CODE QUALITY
    // ════════════════════════════════════════════════
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'warn',

    // ════════════════════════════════════════════════
    // BEST PRACTICES
    // ════════════════════════════════════════════════
    'prefer-template': 'warn',
    'prefer-arrow-callback': 'warn',
    'no-nested-ternary': 'warn',
    'max-depth': ['warn', 4],
    complexity: ['warn', 15],
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    eqeqeq: ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // ════════════════════════════════════════════════
    // ASYNC/AWAIT
    // ════════════════════════════════════════════════
    'no-async-promise-executor': 'error',
    'require-await': 'warn',
    'no-return-await': 'warn',
    'prefer-promise-reject-errors': 'error',

    // ════════════════════════════════════════════════
    // NODE.JS SPECIFIC
    // ════════════════════════════════════════════════
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-require': 'error',
    'node/no-unpublished-require': 'off',
    'node/no-extraneous-require': 'error',
    'node/process-exit-as-throw': 'error',

    // ════════════════════════════════════════════════
    // SECURITY
    // ════════════════════════════════════════════════
    'security/detect-object-injection': 'off', // Too many false positives
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',

    // ════════════════════════════════════════════════
    // JEST (Testing)
    // ════════════════════════════════════════════════
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'jest/expect-expect': 'warn',

    // ════════════════════════════════════════════════
    // IMPORTS
    // ════════════════════════════════════════════════
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'error',
  },
  overrides: [
    {
      // Test files
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      // Scripts
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'node/no-unpublished-require': 'off',
      },
    },
  ],
};
