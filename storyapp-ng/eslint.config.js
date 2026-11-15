// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sa', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'sa', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',

      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // `${count}` and `${id}` in URLs and messages are fine.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Angular classes (components, services) are extended by the framework, not by us.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Logging goes through Logger (core/logging); see the override for logger.ts and main.ts.
      'no-console': 'error',

      // Cross-area imports use the path aliases; relative imports stay inside one area.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(\\.\\./)+(app/)?(core|shared|features)/',
              message: 'Import other areas through @core/, @shared/ or @features/.',
            },
            {
              regex: '^(\\.\\./)+testing/',
              message: 'Import test fixtures and helpers through @testing/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/core/logging/logger.ts', 'src/main.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Specs use vitest mocks and partial fakes; these rules fight that more than they help.
    files: ['**/*.spec.ts', 'src/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Fakes mirror async APIs without awaiting anything.
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // Architecture: dependencies point one way, app -> features -> shared -> core.
    // Features never import each other; move what two features need to shared/ or core/.
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: 'tsconfig.json' },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core', partialMatch: false },
        { type: 'shared', pattern: 'src/app/shared', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/app/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'testing', pattern: 'src/testing', partialMatch: false },
      ],
      'boundaries/files': [{ pattern: '**/*.spec.ts', category: 'test' }],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { type: 'core' } } },
            },
            {
              // Test fixtures and fakes build domain types and fake core services.
              from: { element: { type: 'testing' } },
              allow: { to: { element: { types: ['core', 'testing'] } } },
            },
            {
              // Only specs may use src/testing (fixtures, fakes and helpers).
              from: { file: { categories: 'test' } },
              allow: { to: { element: { type: 'testing' } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { types: ['core', 'shared'] } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: ['core', 'shared'] } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: { feature: '{{ from.element.captured.feature }}' },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
    },
  },
  prettier,
]);
