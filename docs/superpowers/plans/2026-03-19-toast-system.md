# Toast System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pending-to-success/error toast lifecycle to all 14 mutations with type-specific styling, using a reusable `useMutationWithToast` wrapper hook.

**Architecture:** A thin wrapper around TanStack Query's `useMutation` intercepts `mutationFn` and manages toast lifecycle manually via `toast.loading()` → `toast.success()`/`toast.error()` with explicit durations and per-state styling. All existing component-level ad-hoc toast calls are removed.

**Tech Stack:** sonner-native, TanStack Query `useMutation`, TypeScript strict mode, NativeWind/Tailwind

**Spec:** `docs/superpowers/specs/2026-03-19-toast-system-design.md`

---

## File Structure

| File | Responsibility |
| --- | --- |
| **Create:** `hooks/useMutationWithToast.ts` | Wrapper hook: accepts `ToastConfig`, manages toast.loading → toast.success/error lifecycle, returns `mutateSilently` alongside standard API |
| **Edit:** `components/toast/toastOptions.ts` | Add `TOAST_STYLES` and `TOAST_DURATIONS` config (per-state border colours, description text colours, durations). Keep existing helpers for non-mutation use (`utils/mail.ts`) |
| **Edit:** `app/_layout.tsx` | Remove `borderColor` and `borderWidth` from global `Toaster` config |
| **Edit:** `hooks/useAuth.ts` | Migrate 5 mutations |
| **Edit:** `hooks/useUsers.ts` | Migrate 2 mutations |
| **Edit:** `hooks/useAttempts.ts` | Migrate 3 mutations |
| **Edit:** `hooks/useModules.ts` | Migrate 1 mutation |
| **Edit:** `hooks/useAssignments.ts` | Migrate 3 mutations |
| **Cleanup:** 9 component files | Remove ad-hoc toast imports and calls |

---

### Task 1: Add per-state toast style config

**Files:**
- Modify: `components/toast/toastOptions.ts`

- [ ] **Step 1: Add the `TOAST_STYLES` and `TOAST_DURATIONS` constants**

Add the per-state style config to `components/toast/toastOptions.ts`, above the existing helpers. These are imported by `useMutationWithToast` to style each toast state.

```ts
import { Colors } from '@/constants/Colors';
import type { TextStyle, ViewStyle } from 'react-native';

type StateStyle = {
  toast: ViewStyle;
  description: TextStyle;
};

export const TOAST_STYLES: Record<'loading' | 'success' | 'error', StateStyle> = {
  loading: {
    toast: { borderColor: Colors.sway.bright, borderWidth: 1 },
    description: { color: Colors.sway.darkGrey }
  },
  success: {
    toast: { borderColor: Colors.primary.success, borderWidth: 1 },
    description: { color: Colors.sway.darkGrey }
  },
  error: {
    toast: { borderColor: Colors.primary.error, borderWidth: 1 },
    description: { color: Colors.sway.lightGrey }
  }
};

export const TOAST_DURATIONS = {
  success: 2000,
  error: 3500
} as const;
```

Keep the existing `renderSuccessToast`, `renderCustomErrorToast`, and `renderErrorToast` helpers — they are still used by `utils/mail.ts` and `useGetFabOptions.tsx` (email error).

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `toastOptions.ts`

- [ ] **Step 3: Commit**

```bash
git add components/toast/toastOptions.ts
git commit -m "feat(toast): add per-state style config for toast types"
```

---

### Task 2: Remove global borderColor from Toaster config

**Files:**
- Modify: `app/_layout.tsx:38-56`

- [ ] **Step 1: Remove `borderColor` and `borderWidth` from the global `Toaster` `toastOptions.style`**

In `app/_layout.tsx`, update the `Toaster` component. Remove the `borderColor` and `borderWidth` properties from the `style` object since per-state styles now handle borders:

```tsx
<Toaster
  position="top-center"
  offset={60}
  toastOptions={{
    style: {
      backgroundColor: Colors.sway.dark
    },
    titleStyle: {
      color: Colors.primary.white,
      fontFamily: 'SpaceGrotesk-SemiBold'
    },
    descriptionStyle: {
      color: Colors.sway.darkGrey,
      fontFamily: 'SpaceGrotesk-Regular'
    }
  }}
/>
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `_layout.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "refactor(toast): remove global border from Toaster config"
```

---

### Task 3: Create `useMutationWithToast` hook

**Files:**
- Create: `hooks/useMutationWithToast.ts`

- [ ] **Step 1: Create the hook file**

Create `hooks/useMutationWithToast.ts`. Uses manual `toast.loading()` → `toast.success()`/`toast.error()` (not `toast.promise()`) so we can control durations per-state.

```ts
import { useCallback, useRef } from 'react';
import { getServerErrorMessage } from '@/utils/axiosErrorString';
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';

export type ToastConfig<TData = unknown> = {
  pending: string;
  success: string | ((result: TData) => string);
  error?: string;
};

type UseMutationWithToastResult<TData, TError, TVariables, TContext> = UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> & {
  mutateSilently: UseMutationResult<TData, TError, TVariables, TContext>['mutate'];
};

export const useMutationWithToast = <TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    toast: ToastConfig<TData>;
  }
): UseMutationWithToastResult<TData, TError, TVariables, TContext> => {
  const { toast: toastConfig, mutationFn, ...rest } = options;
  const silentRef = useRef(false);

  const wrappedMutationFn = mutationFn
    ? async (variables: TVariables): Promise<TData> => {
        const isSilent = silentRef.current;
        silentRef.current = false;

        const toastId = isSilent ? undefined : toast.loading(toastConfig.pending, { styles: TOAST_STYLES.loading });

        try {
          const result = await mutationFn(variables);
          const successMsg =
            typeof toastConfig.success === 'function' ? toastConfig.success(result) : toastConfig.success;

          if (toastId !== undefined) {
            toast.success(successMsg, {
              id: toastId,
              duration: TOAST_DURATIONS.success,
              styles: TOAST_STYLES.success
            });
          }

          return result;
        } catch (err) {
          const errorMsg = getServerErrorMessage(err);

          if (toastId !== undefined) {
            toast.error(errorMsg, {
              id: toastId,
              duration: TOAST_DURATIONS.error,
              styles: TOAST_STYLES.error
            });
          }

          throw err;
        }
      }
    : undefined;

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    mutationFn: wrappedMutationFn
  });

  const mutateSilently: typeof mutation.mutate = useCallback(
    (variables, mutateOptions) => {
      silentRef.current = true;
      mutation.mutate(variables, mutateOptions);
    },
    [mutation.mutate]
  );

  return { ...mutation, mutateSilently };
};
```

**Key design decisions:**
- Uses `toast.loading()` → `toast.success()`/`toast.error()` with the same `id` to transition the toast in-place (not `toast.promise()` which doesn't support per-state durations)
- `silentRef` is read and reset synchronously inside `wrappedMutationFn` before any await, so there's no race between concurrent calls
- `useCallback` depends on `mutation.mutate` (stable reference from TanStack Query), not the full `mutation` object
- All user-provided `onSuccess`/`onError`/`onSettled` callbacks are preserved — they live in `...rest` and execute via TanStack Query's lifecycle as normal
- The `try/catch` re-throws the error so TanStack Query's `onError`/`onSettled` still fire

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `useMutationWithToast.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/useMutationWithToast.ts
git commit -m "feat(toast): add useMutationWithToast wrapper hook"
```

---

### Task 4: Migrate auth mutations

**Files:**
- Modify: `hooks/useAuth.ts:1-75`

- [ ] **Step 1: Update imports**

Replace the `useMutation` import with `useMutationWithToast`:

```ts
import { useMutationWithToast } from './useMutationWithToast';
```

Remove `useMutation` from the `@tanstack/react-query` import (keep `useQueryClient`).

- [ ] **Step 2: Migrate all 5 mutations**

Replace each `useMutation` call with `useMutationWithToast`, adding the `toast` config. All existing `onSuccess`/`onSettled` callbacks stay unchanged.

**useRegister:**
```ts
export const useRegister = () => {
  return useMutationWithToast<AuthResponse, AxiosError, RegisterInput>({
    mutationFn: async (body) => {
      const { data } = await api.post('/register', body);
      return data;
    },
    toast: { pending: 'Creating account...', success: 'Account created', error: 'Registration failed' }
  });
};
```

**useLogin:**
```ts
export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutationWithToast<AuthResponse, AxiosError, LoginInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/login', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    },
    toast: { pending: 'Logging in...', success: 'Welcome back', error: 'Login failed' }
  });
};
```

**useLogout:**
```ts
export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutationWithToast<{ message: string }, AxiosError>({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>('/logout');
      return data;
    },
    onSettled: () => {
      queryClient.clear();
      clearUser();
    },
    toast: { pending: 'Logging out...', success: 'Logged out', error: 'Logout failed' }
  });
};
```

**useVerify:**
```ts
export const useVerify = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutationWithToast<AuthResponse, AxiosError, VerifyInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/verify-email', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    },
    toast: { pending: 'Verifying email...', success: 'Email verified', error: 'Verification failed' }
  });
};
```

**useUpdateName:**
```ts
export const useUpdateName = () => {
  const queryClient = useQueryClient();
  return useMutationWithToast<AuthResponse, AxiosError, UpdateNameInput>({
    mutationFn: async (body) => {
      const { data } = await api.put<AuthResponse>('/update-name', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    toast: { pending: 'Updating name...', success: 'Name updated', error: 'Update failed' }
  });
};
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `useAuth.ts`

- [ ] **Step 4: Commit**

```bash
git add hooks/useAuth.ts
git commit -m "feat(toast): migrate auth mutations to useMutationWithToast"
```

---

### Task 5: Migrate user mutations

**Files:**
- Modify: `hooks/useUsers.ts:175-206`

- [ ] **Step 1: Update imports**

Add import for `useMutationWithToast`. Remove `useMutation` from the `@tanstack/react-query` import (keep `useQuery`, `useQueryClient`, `UseQueryResult`).

```ts
import { useMutationWithToast } from './useMutationWithToast';
```

- [ ] **Step 2: Migrate both mutations**

**useAddRemoveTherapist** — uses dynamic success message from server:
```ts
export const useAddRemoveTherapist = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<AddRemoveTherapistResponse, AxiosError, AddRemoveTherapistInput>({
    mutationFn: async (clientData): Promise<AddRemoveTherapistResponse> => {
      const { data } = await api.post<AddRemoveTherapistResponse>('/user/assign', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    toast: {
      pending: 'Updating therapist...',
      success: (res) => res.message,
      error: 'Update failed'
    }
  });
};
```

**useAdminVerifyTherapist:**
```ts
export const useAdminVerifyTherapist = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<VerifyTherapistResponse, AxiosError, VerifyTherapistInput>({
    mutationFn: async (therapistId): Promise<VerifyTherapistResponse> => {
      const { data } = await api.post<VerifyTherapistResponse>('/user/verify', therapistId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    toast: { pending: 'Verifying therapist...', success: 'Therapist verified', error: 'Verification failed' }
  });
};
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add hooks/useUsers.ts
git commit -m "feat(toast): migrate user mutations to useMutationWithToast"
```

---

### Task 6: Migrate attempt mutations

**Files:**
- Modify: `hooks/useAttempts.ts:160-215`

- [ ] **Step 1: Update imports**

Add import for `useMutationWithToast`. Remove `useMutation` from the `@tanstack/react-query` import (keep `useInfiniteQuery`, `useQuery`, `useQueryClient`, `InfiniteData`).

```ts
import { useMutationWithToast } from './useMutationWithToast';
```

- [ ] **Step 2: Migrate all 3 mutations**

**useStartModuleAttempt:**
```ts
export const useStartModuleAttempt = () => {
  const qc = useQueryClient();
  type StartAttemptInput = { moduleId: string; assignmentId?: string };

  return useMutationWithToast<StartAttemptResponse, AxiosError, StartAttemptInput>({
    mutationFn: async ({ moduleId, assignmentId }): Promise<StartAttemptResponse> => {
      const { data } = await api.post<StartAttemptResponse>(
        `modules/${moduleId}/attempts`,
        assignmentId ? { assignmentId } : {}
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    toast: { pending: 'Starting attempt...', success: 'Attempt started', error: 'Failed to start attempt' }
  });
};
```

**useSaveModuleAttempt** — this hook exposes `mutateSilently` for auto-save:
```ts
export const useSaveModuleAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<SaveProgressResponse, AxiosError, SaveProgressInput>({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    toast: { pending: 'Saving progress...', success: 'Progress saved', error: 'Failed to save' }
  });
};
```

**useSubmitAttempt:**
```ts
export const useSubmitAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<SubmitAttemptResponse, AxiosError, SubmitAttemptInput>({
    mutationFn: async (responses): Promise<SubmitAttemptResponse> => {
      const { data } = await api.post<SubmitAttemptResponse>(`attempts/${attemptId}/submit`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
    },
    toast: { pending: 'Submitting...', success: 'Submitted successfully', error: 'Submission failed' }
  });
};
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add hooks/useAttempts.ts
git commit -m "feat(toast): migrate attempt mutations to useMutationWithToast"
```

---

### Task 7: Migrate module and assignment mutations

**Files:**
- Modify: `hooks/useModules.ts:74-83`
- Modify: `hooks/useAssignments.ts:43-90`

- [ ] **Step 1: Update imports in both files**

In `hooks/useModules.ts`: add `useMutationWithToast` import, remove `useMutation` from the `@tanstack/react-query` import (keep `useQuery`, `useQueryClient`, `UseQueryResult`).

In `hooks/useAssignments.ts`: add `useMutationWithToast` import, remove `useMutation` from the `@tanstack/react-query` import (keep `useQuery`, `useQueryClient`).

- [ ] **Step 2: Migrate useCreateModule**

```ts
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<Module, AxiosError, CreateModuleInput>({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    toast: { pending: 'Creating module...', success: 'Module created', error: 'Failed to create module' }
  });
};
```

- [ ] **Step 3: Migrate all 3 assignment mutations**

**useCreateAssignment:**
```ts
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<CreateAssignmentResponse, AxiosError, CreateAssignmentInput>({
    mutationFn: async (assignmentData): Promise<CreateAssignmentResponse> => {
      const { data } = await api.post<CreateAssignmentResponse>('/assignments', assignmentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    toast: { pending: 'Creating assignment...', success: 'Assignment created', error: 'Failed to create assignment' }
  });
};
```

**useUpdateAssignmentStatus:**
```ts
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutationWithToast<UpdateAssignmentStatusResponse, AxiosError, UpdateAssignmentStatusInput>({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`assignments/${assignmentId}`, status);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    toast: { pending: 'Updating assignment...', success: 'Assignment updated', error: 'Update failed' }
  });
};
```

**useRemoveAssignment:**
```ts
export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<BasicMutationResponse, AxiosError, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }): Promise<BasicMutationResponse> => {
      const { data } = await api.delete<BasicMutationResponse>(`assignments/${assignmentId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    toast: { pending: 'Removing assignment...', success: 'Assignment removed', error: 'Failed to remove assignment' }
  });
};
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add hooks/useModules.ts hooks/useAssignments.ts
git commit -m "feat(toast): migrate module and assignment mutations to useMutationWithToast"
```

---

### Task 8: Clean up ad-hoc toast calls in components

**Files:**
- Modify: `components/assignments/AssignmentsListTherapist.tsx`
- Modify: `components/assignments/AssignmentsListPatient.tsx`
- Modify: `components/user/TherapistPicker.tsx`
- Modify: `components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx`
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`
- Modify: `components/ui/fab/useGetFabOptions.tsx`
- Modify: `app/(auth)/signup.tsx`
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(main)/(tabs)/assignments/add.tsx`

- [ ] **Step 1: Remove ad-hoc toast imports and calls**

For each file: remove the `import { renderSuccessToast, renderErrorToast, ... } from '..../toastOptions'` line and remove inline toast calls from `.mutate()` callbacks. **Keep all non-toast logic in those callbacks.**

**File-by-file specifics:**

**`app/(auth)/login.tsx:109`** — Remove `onError: (err) => renderErrorToast(err)` from the `.mutate()` call-site. The hook now handles errors.

**`app/(auth)/signup.tsx:123`** — Same as login — remove `onError: (err) => renderErrorToast(err)` from `.mutate()` call-site.

**`components/assignments/AssignmentsListTherapist.tsx:34-36`** — Remove `onError` toast and `onSuccess` toast from `.mutate()` callbacks. If any non-toast logic exists in those callbacks, keep it.

**`components/assignments/AssignmentsListPatient.tsx:39`** — Remove `renderErrorToast(err)` call. If inside a callback with other logic, keep the other logic.

**`components/user/TherapistPicker.tsx:27-28`** — Remove `onSuccess: (res) => renderSuccessToast(res.message)` and `onError: (err) => renderErrorToast(err)`. The hook now uses `(res) => res.message` for dynamic success messages.

**`app/(main)/(tabs)/assignments/add.tsx:87,90`** — Remove `renderSuccessToast('Created assignment')` and `onError: (err) => renderErrorToast(err)`. Keep any router navigation in `onSuccess`.

**`components/ui/fab/useGetFabOptions.tsx`** — Two distinct patterns:
1. **Lines 38-44 (mutation callback):** Remove `renderSuccessToast(data.message)` and `renderErrorToast(err)`. **Keep `closeMenu()` in both `onSuccess` and `onError`:**
   ```ts
   {
     onSuccess: () => closeMenu(),
     onError: () => closeMenu()
   }
   ```
2. **Line 59 (try-catch in `handleEmail`):** **Keep this `renderErrorToast(error)` call** — it covers `pickClientAndCompose()` which is NOT a mutation, so it's not handled by the hook wrapper. Also keep the `renderErrorToast` import for this usage.

**`QuestionnairePresenter.tsx`** — Three distinct call patterns:
1. **Line 103 (auto-save on page swipe):** This is an auto-save. Switch to `mutateSilently`:
   ```ts
   // Before:
   saveAttempt({ answers: currentAnswersArray() }, { onError: (err) => renderErrorToast(err) });
   // After:
   saveAttempt.mutateSilently({ answers: currentAnswersArray() });
   ```
   Note: The `saveAttempt` destructured from the hook needs to expose `mutateSilently`. Since `useSaveModuleAttempt` returns the full `useMutationWithToast` result, access it via the hook's return value. The component may need to destructure differently — e.g., use `const saveAttemptMutation = useSaveModuleAttempt(attemptId)` instead of `const { mutate: saveAttempt } = ...`. Then call `saveAttemptMutation.mutateSilently(...)` for auto-save and `saveAttemptMutation.mutate(...)` for intentional saves.

2. **Lines 169-183 (handleSubmit — intentional save-then-submit):** This is NOT auto-save. Use regular `mutate`. Remove toast calls but **keep the chained onSuccess that triggers submitAttempt, and the router.back() in the submit onSuccess:**
   ```ts
   const handleSubmit = useCallback(() => {
     if (mode !== 'edit') return router.back();

     saveAttemptMutation.mutate(
       { answers: currentAnswersArray() },
       {
         onSuccess: () => {
           submitAttemptMutation.mutate(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
             onSuccess: () => router.back()
           });
         }
       }
     );
   }, [mode, saveAttemptMutation, submitAttemptMutation, currentAnswersArray, assignmentId, router]);
   ```

**`ActivityDiaryPresenter.tsx`** — Four distinct call patterns:
1. **Lines 193-201 (`saveDirty` — auto-save on blur/navigate away):** This is auto-save. Switch to `mutateSilently` but **keep the `onSuccess` that clears dirty state:**
   ```ts
   const saveDirty = useCallback(() => {
     if (!dirtyKeys.size && !noteDirty) return;
     saveAttemptMutation.mutateSilently(buildSavePayload(), {
       onSuccess: () => {
         setDirtyKeys(new Set());
         setNoteDirty(false);
       }
     });
   }, [dirtyKeys, noteDirty, buildSavePayload, saveAttemptMutation]);
   ```

2. **Lines 450-457 (Save & Exit button — intentional save):** Use regular `mutate`. Remove `onError` toast, **keep `onSuccess` with dirty state clear + `router.back()`:**
   ```ts
   saveAttemptMutation.mutate(buildSavePayload(), {
     onSuccess: () => {
       setDirtyKeys(new Set());
       setNoteDirty(false);
       router.back();
     }
   });
   ```

3. **Lines 465-471 (Submit button — `afterSave`):** Use regular `mutate` for submit. Remove `onError` toast and `renderSuccessToast`. **Keep `router.back()` in onSuccess:**
   ```ts
   const afterSave = () =>
     submitAttemptMutation.mutate(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
       onSuccess: () => router.back()
     });
   ```

4. **Lines 474-481 (save-before-submit flow):** Use regular `mutate`. Remove `onError` toast, **keep `onSuccess` with dirty clear + `afterSave()`:**
   ```ts
   saveAttemptMutation.mutate(buildSavePayload(), {
     onSuccess: () => {
       setDirtyKeys(new Set());
       setNoteDirty(false);
       afterSave();
     }
   });
   ```

- [ ] **Step 2: Verify no unused imports remain**

Run: `npx eslint --fix .`
Then: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/assignments/AssignmentsListTherapist.tsx components/assignments/AssignmentsListPatient.tsx components/user/TherapistPicker.tsx components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx components/attempts/presenters/diary/ActivityDiaryPresenter.tsx components/ui/fab/useGetFabOptions.tsx app/(auth)/signup.tsx app/(auth)/login.tsx "app/(main)/(tabs)/assignments/add.tsx"
git commit -m "refactor(toast): remove ad-hoc toast calls from components"
```

---

### Task 9: Final validation

- [ ] **Step 1: Run full lint validation**

Run: `npx eslint --fix . && npx prettier --write . && npm run lint`
Expected: All checks pass

- [ ] **Step 2: Verify app starts without errors**

Run: `npx expo start` and confirm no runtime errors on load.

- [ ] **Step 3: Commit any formatting fixes**

```bash
git add -A
git commit -m "chore: format after toast system migration"
```
