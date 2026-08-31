import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/config-helpers';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(dirname);
export const gitignorePath = path.resolve(projectRoot, '.gitignore');

export default defineConfig([
  globalIgnores(['.agents/**', '.claude/**', '.continue/**']),
  includeIgnoreFile(gitignorePath),
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,

  plugins.react,
  plugins.reactHooks,
  plugins.reactA11y,
  ...configs.react.recommended,

  plugins.typescriptEslint,
  ...configs.base.typescript,
  ...configs.react.typescript,
  rules.typescript.typescriptEslintStrict,

  reactRefreshPlugin.configs.vite,

  eslintPluginPrettierRecommended,

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.jest,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
        }),
      ],
    },
    rules: {
      'class-methods-use-this': 'off',
      'no-restricted-syntax': 'off',
      'no-promise-executor-return': 'off',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['state', 'acc'],
        },
      ],
      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],

      'import-x/order': 'off',
      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'error',
      'import-x/no-named-as-default': 'off',
      'import-x/prefer-default-export': 'off',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/no-unstable-nested-components': [
        'error',
        {
          propNamePattern: '{*Content,*Renderer,*Component}',
        },
      ],
      'react/require-default-props': [
        // 'error',
        'off',
        {
          classes: 'ignore',
          functions: 'ignore',
          ignoreFunctionalComponents: true,
        },
      ],
    },
  },

  {
    files: plugins.typescriptEslint.files,
    rules: {
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/method-signature-style': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
        },
      ],
    },
  },

  {
    files: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-named-exports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: ['type-export', 'value-export', 'unknown'],
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: ['type-import', 'value-import', 'unknown'],
        },
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 0,
          fallbackSort: {
            type: 'type-import-first',
            order: 'asc',
          },
          tsconfig: {
            rootDir: '.',
            filename: 'tsconfig.app.json',
          },
          groups: [
            // Builtins
            'builtin',
            { newlinesBetween: 1 },
            // Externals
            'vite',
            'vitejs',
            'vite-plugin',
            'react',
            'tauri',
            'react-router',
            'zustand',
            'unhead',
            'i18n',
            'tailwindcss',
            'next-themes',
            'heroui',
            'react-icons',
            'external',
            { newlinesBetween: 1 },
            // Internals
            'tsconfig-path',
            'subpath',
            // FSD-related
            'fsd-app',
            'fsd-pages',
            'fsd-widgets',
            'fsd-features',
            'fsd-entities',
            'fsd-shared',
            // Other internals
            'internal',
            'index',
            'sibling',
            'parent',
            { newlinesBetween: 1 },
            // Styles
            'side-effect-style',
            'style',
            { newlinesBetween: 1 },
            // Unknown
            'unknown',
          ],
          customGroups: [
            {
              groupName: 'vite',
              elementNamePattern: '^vite$',
            },
            {
              groupName: 'vitejs',
              elementNamePattern: '^@vitejs.*',
            },
            {
              groupName: 'vite-plugin',
              elementNamePattern: '^vite-plugin.*',
            },
            {
              groupName: 'react',
              elementNamePattern: '^react(-dom)?$',
            },
            {
              groupName: 'tauri',
              elementNamePattern: '^@tauri-apps.*',
            },
            {
              groupName: 'react-router',
              elementNamePattern: '^react-router(-dom)?$',
            },
            {
              groupName: 'zustand',
              elementNamePattern: '^zustand.*',
            },
            {
              groupName: 'unhead',
              elementNamePattern: '^@unhead.*',
            },
            {
              groupName: 'i18n',
              elementNamePattern: '^(react-)?i18next$',
            },
            {
              groupName: 'tailwindcss',
              elementNamePattern: '^@tailwindcss.*',
            },
            {
              groupName: 'next-themes',
              elementNamePattern: '^next-themes$',
            },
            {
              groupName: 'heroui',
              elementNamePattern: '^@heroui.*',
            },
            {
              groupName: 'react-icons',
              elementNamePattern: '^react-icons.*',
            },

            // FSD-related
            {
              groupName: 'fsd-app',
              elementNamePattern: '^@/app(/.*)?$',
            },
            {
              groupName: 'fsd-pages',
              elementNamePattern: '^@/pages(/.*)?$',
            },
            {
              groupName: 'fsd-widgets',
              elementNamePattern: '^@/widgets(/.*)?$',
            },
            {
              groupName: 'fsd-features',
              elementNamePattern: '^@/features(/.*)?$',
            },
            {
              groupName: 'fsd-entities',
              elementNamePattern: '^@/entities(/.*)?$',
            },
            {
              groupName: 'fsd-shared',
              elementNamePattern: '^@/shared(/.*)?$',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['scripts/**/*.?([cm])[jt]s'],
    rules: {
      'no-console': 'off',
    },
  },
]);
