// eslint.config.js
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import { configs, parser, plugin } from 'typescript-eslint'; // v7 meta package (parser + plugin + presets)
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default defineConfig([
  // Expo’s base (React Native, React, etc.)
  expoConfig,

  // TypeScript recommended presets (adds sensible defaults)
  ...configs.recommended,

  // Ignore build output and files with config.cjs
  { ignores: ['dist/**', '.expo/**', '**.cjs', '**.config.js'] },

  // Your project rules (register plugins here and keep the plugin rules in the same object)
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      // Optional but recommended: set the TS parser explicitly for TS files
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
        // If you use project-aware linting, enable the service:
        // projectService: true,
        // tsconfigRootDir: import.meta.dirname,
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
      ]
    },
    settings: {
      tailwindcss: {
        callees: ['clsx', 'cn', 'cva']
      }
    }
  }
]);
