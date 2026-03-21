# NARBS High-Impact Performance Fixes

**Date:** 2026-03-21
**Scope:** 5 high-impact items from NARBS performance audit (14/25 overall score)
**Approach:** Single feature branch, 4 sequential commits

---

## Context

A NARBS (Network, Assets, Rendering, Bundle, SSR/Initial Load) performance audit identified 16 recommendations across three priority tiers. This spec covers the 5 high-impact items only.

**Audit scores:** Network 3/5, Assets 2/5, Rendering 3/5, Bundle 4/5, Initial Load 2/5.

---

## 1. Lazy Tabs

**Problem:** All 6 tab screens mount on first render, even tabs hidden via `href: null` for role-based visibility. This loads components, hooks, and queries for screens the user hasn't visited.

**Fix:** Add `lazy={true}` to the `<Tabs>` navigator in `app/(main)/(tabs)/_layout.tsx`. This defers mounting of `all-users`, `assignments`, `attempts`, `programs`, and `profile` until first focused. The `home` tab renders immediately as the default route.

**Files:** `app/(main)/(tabs)/_layout.tsx`

---

## 2. React.memo + useCallback on FlatList Components

**Problem:** Minimal `React.memo` usage across the codebase (only `DayChip` and `NumericField` in the diary presenter). Most FlatList item components re-render on every parent update. Six FlatLists use inline `renderItem` arrow functions, creating new function references each render and breaking VirtualizedList optimizations.

**Fix — React.memo:** Wrap list item components in `React.memo`:

- `components/admin/UserListItem.tsx`
- `components/attempts/presenters/questionnaires/QuestionSlide.tsx`
- `components/module/ModulesList.tsx` — extract inline item markup to a named `ModuleListItem` component, then memo

Note: `DayChip.tsx` already uses `memo()` — no change needed there.

Pattern: For files using default exports, wrap with `export default React.memo(ComponentName)`. For named exports, wrap inline: `export const Foo = memo(...)`.

**Fix — useCallback extraction:** Move inline `renderItem` closures to stable `useCallback` references:

- `components/attempts/PatientAttempts.tsx` — also wrap `handleAttemptPress` in `useCallback` with `[router]` dependency (the ref is stable)
- `components/assignments/AssignmentsListPatient.tsx`
- `components/assignments/AssignmentsListTherapist.tsx` — extract inline renderItem to a separate `AssignmentListItemTherapist` component wrapped in `React.memo`, passing `menuVisible` and `onToggleMenu` as props. This avoids `menuFor` state invalidating the entire list's renderItem callback.
- `components/attempts/TherapistLatestAttempts.tsx`
- `components/module/ModulesList.tsx`

Note: `ActivityDiaryPresenter.tsx` already extracts `renderSlot` to a `useCallback` — no change needed there.

For each file: move the inline `renderItem={({ item, index }) => { ... }}` to a `const renderItem = useCallback(...)` with the correct dependency array. Any `onPress` handlers passed into items should also be wrapped in `useCallback` if not already stable.

These two fixes are done together as one commit — `React.memo` without stable callbacks is wasted effort.

---

## 3. expo-image Migration

**Problem:** `expo-image` is installed (v3.0.11) but unused. All 7+ image components use raw `Image`/`ImageBackground` from `react-native`, missing out on expo-image's caching, format negotiation, and modern API.

**Fix:** Replace all `Image`/`ImageBackground` imports with `Image` from `expo-image`:

- `components/brand/Imagery.tsx` (BWellIcon, BWellLogo)
- `components/sign-in/LoginLogo.tsx`
- `app/(welcome)/ready.tsx`
- `components/home/HomeScreen.tsx`
- `app/(main)/(tabs)/_layout.tsx` (tab bar icons)
- `components/ThemedButton.tsx` (PrimaryButton logo)
- `components/welcome/Item.tsx` (ImageBackground replacement)

**Prop mapping:**

- `resizeMode="cover"` → `contentFit="cover"` (as a prop, not a style property)
- `resizeMode="contain"` → `contentFit="contain"` (as a prop, not a style property)
- Where `resizeMode` appears inside a `style` object or `StyleSheet.create` (e.g., `LoginLogo.tsx`, `ready.tsx`), extract it to the `contentFit` prop — it is not a style property on expo-image
- `ImageBackground` (in `Item.tsx`) → expo-image `Image` with absolute positioning behind content, or `View` wrapper with image as sibling
- Explicit `style` dimensions preserved where they exist
- No placeholder/blurhash for bundled assets — establishes the API pattern for when remote images are added later

**Type import changes:**

- `Imagery.tsx`: replace `ImageProps` from `react-native` with `ImageProps` from `expo-image`
- `Item.tsx`: replace `ImageSourcePropType` from `react-native` with `ImageSource` from `expo-image`

**Direct `width`/`height` props:** expo-image `Image` does not accept `width` and `height` as top-level props (unlike RN `Image`). Remove direct `width`/`height` props and ensure dimensions are set via `style` only:

- `Imagery.tsx`: `BWellIcon`/`BWellLogo` pass `width`/`height` as props — remove, keep in `style`
- `_layout.tsx` (tabs): tab icon `Image` passes `width={size * 2}` / `height={size * 2}` — move to `style`

---

## 4. Enable Hermes Engine

**Problem:** Hermes may already be the default engine on Expo SDK 54 with New Architecture, but it is not explicitly pinned in `app.config.js`.

**Pre-implementation check:** Before implementing, confirm whether Hermes is already active by checking `global.HermesInternal` in the dev console or Metro bundler output. If already active, this commit explicitly pins the config for documentation purposes. If not active, this is a genuine performance improvement (~15-20% faster JS parsing, lower memory).

**Fix:** Add `jsEngine: 'hermes'` at the top level of the Expo config in `app.config.js`. This applies to both iOS and Android.

**Done last** in the branch so the commit is trivially revertible if runtime issues surface.

**Post-merge smoke test required:** Auth flow, questionnaire pager, activity diary, tab navigation — to catch any `Date`/`Intl` edge cases introduced by Hermes.

**Files:** `app.config.js`

---

## Commit Sequence

| Order | Commit | Files touched |
|-------|--------|---------------|
| 1 | `perf: add lazy loading to tab navigator` | `_layout.tsx` (tabs) |
| 2 | `perf: add React.memo and useCallback to FlatList components` | 10 component files |
| 3 | `perf: migrate Image to expo-image` | 7 component files |
| 4 | `perf: enable Hermes engine` | `app.config.js` |

---

## Out of Scope

- Medium-impact items (cache hydration, prefetching, optimistic updates, keepPreviousData on timeline, drawer animation migration)
- Low-impact items (blurhash placeholders, Skia/Lottie alternatives, named exports migration, gcTime config)
- Welcome carousel image compression (WebP conversion)
