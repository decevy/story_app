// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    // Type information for rules such as no-uncalled-signals.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
    },
  },
  {
    // Architecture: dependencies point one way, app -> features -> shared -> core.
    // Features never import each other; move what two features need to shared/ or core/.
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.js'] } },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core', partialMatch: false },
        { type: 'shared', pattern: 'src/app/shared', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/app/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'environments', pattern: 'src/environments', partialMatch: false },
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
              allow: { to: { element: { types: ['core', 'environments'] } } },
            },
            {
              // Environment files are typed with AppConfig.
              from: { element: { type: 'environments' } },
              allow: { to: { element: { type: 'core' } } },
            },
            {
              // Test fixtures build domain types.
              from: { element: { type: 'testing' } },
              allow: { to: { element: { types: ['core', 'testing'] } } },
            },
            {
              // Only specs may use src/testing (fixtures and helpers).
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
    // Copied unchanged from storyapp-web (pure TS); keep them diffable with the original.
    files: [
      'src/app/features/story/composer/passage-composer.ts',
      'src/app/features/story/composer/segment-visuals.ts',
      'src/app/features/story/composer/composer-dom.ts',
      'src/app/features/story/book-fonts.ts',
      'src/app/core/models/*.ts',
    ],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
]);
