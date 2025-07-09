// eslint.config.js
import expoConfig from 'eslint-config-expo/flat.js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      tailwindcss
    },
    rules: {
      'no-undef': 'error',
      'react/react-in-jsx-scope': 'off',
      'tailwindcss/no-custom-classname': 'off',

      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^\\w', '^@?', '^@frw?\\w'],
            ['^src(/.*|$)'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.?(json|png|jpg|jpeg|txt)$'],
            ['^.+\\.?(css|scss)$']
          ]
        }
      ],
      'simple-import-sort/exports': 'error',
      'tailwindcss/classnames-order': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      camelcase: [2]
    }
  }
]);
