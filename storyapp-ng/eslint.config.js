// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

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
    // Copied unchanged from storyapp-web (pure TS); keep them diffable with the original.
    files: [
      'src/app/composer/passage-composer.ts',
      'src/app/composer/segment-visuals.ts',
      'src/app/composer/composer-dom.ts',
      'src/app/story/book-fonts.ts',
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
