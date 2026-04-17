import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],

  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'api/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts'
  ],

  // ── Files excluded from coverage ──
  // Constants, types, and config files with no branching logic.
  // Screen files (app/) are covered by Maestro E2E, not Jest.
  // Thin wrappers, static display components, and platform shims.
  coveragePathIgnorePatterns: [
    '/node_modules/',

    // Config, constants, types
    '/constants/',
    '/types/',
    'toastOptions\\.ts',
    'WelcomeConstants\\.ts',
    'fiveAreasLayout\\.ts',
    'defaultScreenOptions\\.tsx',
    'usePickerConstants\\.tsx',

    // Platform shims and framework glue
    'IconSymbol',
    'TabBarBackground',
    'KeyboardAvoidingWrapper',
    'HapticTab',
    'FontsContainer',
    'LoadingScreen',

    // Layout wrappers (<10 lines, no branching)
    'components/Container\\.tsx',
    'components/ContentContainer\\.tsx',
    'ExternalLink',
    'ParallaxScrollView',

    // Static display components
    'brand/Imagery',
    'sign-in/LoginLogo',
    'auth/AuthLink',
    'auth/AuthSheetHandle',
    'auth/AuthVideoBackground'
  ],

  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@milobedini/shared-types)'
  ]
};

export default config;
