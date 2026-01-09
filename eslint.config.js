const globals = require('globals');
const pluginJest = require('eslint-plugin-jest');
const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  // Jest Configuration
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
    },
  },
  // General Configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
  prettier,
];
