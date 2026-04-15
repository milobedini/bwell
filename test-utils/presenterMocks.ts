/**
 * Shared mock references for attempt-presenter hook tests.
 *
 * Because jest.mock() hoists factory functions, only variables prefixed
 * with `mock` (case-insensitive) can be referenced inside them. All
 * exports here follow that convention.
 *
 * Usage:
 *   const mocks = mockCreatePresenterRefs();
 *   jest.mock('expo-haptics', () => mockHaptics);
 *   jest.mock('@/hooks/useAttempts', () => ({ useSaveModuleAttempt: () => ({ mutateSilently: mocks.saveSilently, ... }) }));
 */

export type PresenterMocks = {
  router: { back: jest.Mock };
  saveMutate: jest.Mock;
  saveSilently: jest.Mock;
  submitMutate: jest.Mock;
};

/** Create fresh mock references. Call once at module scope in each test file. */
export const mockCreatePresenterRefs = (): PresenterMocks => ({
  router: { back: jest.fn() },
  saveMutate: jest.fn(),
  saveSilently: jest.fn(),
  submitMutate: jest.fn()
});

// ── Static mock shapes (no per-test references needed) ──
// Variable names use `mock` prefix so babel allows them inside jest.mock() factories.

export const mockHaptics = {
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' }
};

export const mockSonner = {
  toast: { loading: jest.fn(), success: jest.fn(), error: jest.fn() }
};

export const mockToastOptions = {
  TOAST_DURATIONS: { error: 3000 },
  TOAST_STYLES: { error: {} }
};
