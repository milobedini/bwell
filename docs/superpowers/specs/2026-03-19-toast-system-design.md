# Toast System Design

**Date:** 2026-03-19
**Status:** Approved

## Problem

The app lacks consistent toast feedback for async actions. Current issues:

- No pending/loading state — users don't know an action is in-flight
- 0 of 14 mutations have toast handling at the hook level
- Ad-hoc toast calls scattered across components with inconsistent patterns
- Success and error toasts are visually identical (same dark background, same border colour)
- Semantic colours from the design system are unused in toasts

## Solution

### Approach: `useMutationWithToast` wrapper hook

A thin wrapper around TanStack Query's `useMutation` that accepts a `toast` config and uses sonner-native's `toast.promise()` to show pending → success → error lifecycle for every mutation.

### `useMutationWithToast` hook

**File:** `hooks/useMutationWithToast.ts`

```ts
type ToastConfig<TData = unknown> = {
  pending: string;
  success: string | ((result: TData) => string);
  error?: string; // fallback — prefers server error message via getServerErrorMessage()
};
```

- Re-exports the same `useMutation` return type — drop-in replacement
- All existing `onSuccess`, `onError`, `onSettled` callbacks are chained, never replaced
- On error, extracts server message via `getServerErrorMessage()`; falls back to `toast.error` string

#### Wrapping strategy

The hook intercepts `mutationFn` at definition time. When `mutateAsync` (or `mutate`) is called, the wrapper:

1. Calls the original `mutationFn(variables)` to get the promise
2. Passes that promise to `toast.promise()` with the configured messages and per-state styles
3. Returns the promise so TanStack Query's lifecycle (`onSuccess`, `onError`, `onSettled`) runs as normal

This means the toast lifecycle is tied to the actual mutation promise — pending shows while in-flight, then auto-transitions to success or error on resolution/rejection. All user-provided callbacks (including `onSettled` used by `useLogout`) execute after toast handling.

#### Silent mode

The wrapper hook returns an additional `mutateSilently` function alongside the standard `mutate` and `mutateAsync`. This bypasses toast handling while preserving all TanStack Query callbacks:

```ts
const { mutate, mutateAsync, mutateSilently } = useMutationWithToast({ ... });

// Normal call — shows pending → success/error toast
mutate(data);

// Silent call — no toast, same mutation lifecycle
mutateSilently(data);
```

This is needed for `useSaveModuleAttempt` auto-save calls (triggered on every page swipe in questionnaires) where a pending toast on each save would be noisy. Manual save actions use `mutate` and still show toasts.

#### Implementation note: string normalisation

sonner-native's `PromiseOptions.success` is typed as `(result: any) => string` (function only). The wrapper must normalise string values: `typeof config.success === 'string' ? () => config.success : config.success`. Same applies to `error` — wrap the fallback logic in a function that calls `getServerErrorMessage(err)` first, falling back to the static string.

#### Icons

Loading state uses sonner-native's default `ActivityIndicator` spinner. Success and error icons use sonner-native's built-in variant icons (checkmark and X). No custom icons needed.

### Type-specific toast styling

Per-state visual differentiation using existing design system colours, applied via `toast.promise()`'s per-state `styles` option on each invocation (not at the global `Toaster` level):

| Type | Border colour | Description text colour | Icon |
|------|--------------|------------------------|------|
| Loading/pending | `sway.bright` (#18cdba, teal) | `sway.darkGrey` (#a6adbb) | Spinner |
| Success | `primary.success` (#76AB70, green) | `sway.darkGrey` (#a6adbb) | Checkmark |
| Error | `primary.error` (#FF6D5E, red-orange) | `sway.lightGrey` (#e0e9f3) | X mark |

Base dark background (`sway.dark`) and SpaceGrotesk fonts remain in the global `Toaster` config. The global `borderColor` is removed from `Toaster` config since per-state styles now handle it.

#### Durations

- Pending: auto-dismisses on promise resolution (no fixed duration)
- Success: 2000ms
- Error: 3500ms

### Toast messages — all 14 mutations

| Hook | Pending | Success | Error (fallback) |
|------|---------|---------|-------------------|
| `useRegister` | Creating account... | Account created | Registration failed |
| `useLogin` | Logging in... | Welcome back | Login failed |
| `useLogout` | Logging out... | Logged out | Logout failed |
| `useVerify` | Verifying email... | Email verified | Verification failed |
| `useUpdateName` | Updating name... | Name updated | Update failed |
| `useAddRemoveTherapist` | Updating therapist... | Therapist updated | Update failed |
| `useAdminVerifyTherapist` | Verifying therapist... | Therapist verified | Verification failed |
| `useStartModuleAttempt` | Starting attempt... | Attempt started | Failed to start attempt |
| `useSaveModuleAttempt` | Saving progress... | Progress saved | Failed to save |
| `useSubmitAttempt` | Submitting... | Submitted successfully | Submission failed |
| `useCreateModule` | Creating module... | Module created | Failed to create module |
| `useCreateAssignment` | Creating assignment... | Assignment created | Failed to create assignment |
| `useUpdateAssignmentStatus` | Updating assignment... | Assignment updated | Update failed |
| `useRemoveAssignment` | Removing assignment... | Assignment removed | Failed to remove assignment |

Error messages prefer the server response (via `getServerErrorMessage()`) over the fallback string. Success messages can be dynamic via `(result: TData) => string` for hooks that need server-provided messages (e.g., `useAddRemoveTherapist`).

## File changes

| File | Change |
|------|--------|
| **New:** `hooks/useMutationWithToast.ts` | Wrapper hook with `toast.promise()`, per-state styling, silent mode |
| **Edit:** `components/toast/toastOptions.ts` | Add per-state style config constants (colours, icons, durations). Keep existing helpers for non-mutation toast needs (e.g., `utils/mail.ts`) |
| **Edit:** `app/_layout.tsx` | Remove `borderColor` from global `Toaster` config (now handled per-state) |
| **Edit:** `hooks/useAuth.ts` | Migrate 5 mutations to `useMutationWithToast` |
| **Edit:** `hooks/useUsers.ts` | Migrate 2 mutations |
| **Edit:** `hooks/useAttempts.ts` | Migrate 3 mutations |
| **Edit:** `hooks/useModules.ts` | Migrate 1 mutation |
| **Edit:** `hooks/useAssignments.ts` | Migrate 3 mutations |

### Component cleanup — remove ad-hoc toast calls

| File | What to remove |
|------|---------------|
| `components/assignments/AssignmentsListTherapist.tsx` | Inline `renderSuccessToast` / `renderErrorToast` in mutation callbacks |
| `components/assignments/AssignmentsListPatient.tsx` | Inline `renderErrorToast` in mutation callback |
| `components/user/TherapistPicker.tsx` | Inline `renderSuccessToast` / `renderErrorToast` in mutation callbacks |
| `components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx` | Inline toast calls in save/submit handlers |
| `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` | Inline toast calls in save/submit handlers |
| `components/ui/fab/useGetFabOptions.tsx` | Try-catch `renderErrorToast` calls |
| `app/(auth)/signup.tsx` | Inline `renderErrorToast` in mutation callback |
| `app/(auth)/login.tsx` | Inline `renderErrorToast` in mutation callback |
| `app/(main)/(tabs)/assignments/add.tsx` | Inline toast calls in mutation callbacks |

## Dependencies

No new dependencies — sonner-native already supports `toast.promise()`, icons, and per-state style overrides.
