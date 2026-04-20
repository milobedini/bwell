// eslint.config.js
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import { configs, parser, plugin } from 'typescript-eslint'; // v7 meta package (parser + plugin + presets)
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default defineConfig([
  // Expo’s base (React Native, React, etc.)
  expoConfig,

  // TypeScript recommended presets (adds sensible defaults)
  ...configs.recommended,

  // React "you might not need an effect" — warns on unnecessary useEffect patterns
  reactYouMightNotNeedAnEffect.configs.recommended,

  // Ignore build output and files with config.cjs
  { ignores: ['dist/**', '.expo/**', '.worktrees/**', 'coverage/**', '**.cjs', '**.config.js'] },

  // Jest test files — expose globals (must appear before main rules for languageOptions)
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'jest.setup.ts', 'test-utils/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {
      'react/display-name': 'off'
    }
  },

  // Your project rules (register plugins here and keep the plugin rules in the same object)
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      // Optional but recommended: set the TS parser explicitly for TS files
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Type-aware linting — required by @typescript-eslint/no-floating-promises
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@typescript-eslint': plugin,
      'simple-import-sort': simpleImportSort,
      tailwindcss
    },
    rules: {
      // General
      'no-undef': 'error',
      'no-console': 'warn',

      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',

      // Tailwind
      'tailwindcss/no-custom-classname': 'off',
      // 'tailwindcss/classnames-order': 'error', // enable if you want strict order

      // Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^\\w', '^@?', '^@frw?\\w'],
            ['^src(/.*|$)'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.(json|png|jpg|jpeg|txt)$'],
            ['^.+\\.(css|scss)$']
          ]
        }
      ],
      'simple-import-sort/exports': 'error',

      // TS-specific rules (must be in the same object as the plugin declaration)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      // Type-aware: helps the "you might not need an effect" plugin infer async calls
      '@typescript-eslint/no-floating-promises': 'warn'
    },
    settings: {
      tailwindcss: {
        callees: ['clsx', 'cn', 'cva']
      }
    }
  },

  // Jest test file rule overrides (must appear after main rules to take precedence)
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'jest.setup.ts', 'test-utils/**/*.{ts,tsx}'],
    rules: {
      // require() is the documented Jest pattern for accessing mock references
      // after jest.mock() factory calls (jest hoisting makes import bindings stale)
      '@typescript-eslint/no-require-imports': 'off',
      // Tests frequently spy on / restore console methods — not actual logging
      'no-console': 'off',
      // Mocked callbacks often have union return types that trip this rule in tests
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
]);
