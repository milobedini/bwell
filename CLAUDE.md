# CLAUDE.md

## Project

bwell — an Expo React Native therapy app (iOS, Android, Web) with role-based access (Patient, Therapist, Admin). A CBT (Cognitive Behavioural Therapy) companion that supports self-help, therapist-guided CBT, and PWP-guided workflows.

## Product Vision

The app has three tiers (from `docs/proposal.pdf`):

1. **Self-help** — Patient picks a program independently, self-monitors with questionnaires, works through CBT tools unguided
2. **Guided by CBT therapist** (priority) — Full CBT program where therapist assigns homework, reviews patient work weekly. Tools: PHQ-9, Activity Diary, 5 Areas Model, General/Weekly Goals, Thinking Traps, Thought Monitoring, Thought Challenging, Longitudinal Model, Belief Change Evidence Table, Modifying Unhelpful Beliefs
3. **Guided by PWP therapist** — Subset of CBT tools (behavioural focus), therapist reviews homework. Shares Activity Diary, 5 Areas Model, Goals with tier 2 but omits cognitive tools (thinking traps, thought challenging, etc.)

### Programs planned

- **Primary:** Depression, Generalised Anxiety (GAD-7), Panic Disorder (PDSS), OCD, Health Anxiety, Stress, Phobias, PTSD, Agoraphobia, Social Anxiety
- **Additional:** Sleep, Assertiveness, ACT

## Behavioural Guidelines

These bias toward caution over speed. For trivial tasks, use judgement.

- **Surface confusion early** — if uncertain, state assumptions explicitly. If multiple interpretations exist, present them rather than picking silently. Push back when a simpler approach exists.
- **Minimum code, nothing speculative** — no features beyond what was asked, no abstractions for single-use code, no error handling for impossible scenarios. If 200 lines could be 50, rewrite.
- **Surgical changes** — don't "improve" adjacent code, comments, or formatting. Match existing style. Remove only imports/variables/functions that your changes made unused; mention (don't delete) pre-existing dead code. Every changed line should trace directly to the request.
- **Goal-driven execution** — transform tasks into verifiable goals (e.g. "fix the bug" becomes "write a test that reproduces it, then make it pass"). For multi-step tasks, state a brief plan with a verification check per step.

## Stack

- **Framework:** Expo SDK 54, React Native 0.81.5, React 19.1, expo-router (file-based routing)
- **Language:** TypeScript (strict mode)
- **Styling:** NativeWind (Tailwind CSS) — prefer className over StyleSheet where possible
- **State:** Zustand (client/auth), TanStack React Query (server state)
- **Forms:** Formik + Yup
- **UI:** react-native-paper, @gorhom/bottom-sheet, moti, react-native-reanimated, @shopify/react-native-skia, expo-image, react-native-markdown-display
- **JS Engine:** Hermes (explicitly enabled in app.config.js)
- **API:** Axios with cookie-based auth (`withCredentials: true`)
- **Types:** Shared types via `@milobedini/shared-types` npm package — all API/model types must live here, never in FE code
- **Backend:** Node/Express + MongoDB (separate repo at `../cbt/`)
- **Installing packages:** Use `npx expo install <pkg> --dev` for Expo-managed packages (`expo-*`, `jest-expo`, `react-native`, etc.) — it pins SDK-compatible versions. Use `npm install` for third-party packages with no Expo coupling (`axios`, `zustand`, `clsx`, etc.)

## Architecture

### Directory Structure

- `app/` — expo-router pages (`(auth)/`, `(main)/`, `(welcome)/`)
- `app/(main)/(tabs)/` — authenticated tab navigator: `home/`, `journey/`, `practice/`, `patients/`, `review/`, `programs/`, `all-users/`, `profile/`
- `components/` — shared and feature-specific components
- `components/attempts/presenters/` — module-type presenter components (questionnaires, diary, five-areas, reading, general-goals)
- `hooks/` — custom React hooks (data fetching, mutations)
- `api/` — Axios instance and API helpers
- `constants/` — Colors, shared constants
- `stores/` — Zustand stores
- `types/` — local TypeScript types
- `utils/` — helper functions (date formatting, severity colours, role checks, debounce, shared chip styles, module icons, initials)

- Query defaults (1-hour staleTime, refetchOnWindowFocus/refetchOnReconnect disabled) are centralized in `QueryClient` in `app/_layout.tsx` — only override in hooks when a shorter staleTime is needed
- Use `invalidateQueries` (not `refetchQueries`) in mutation `onSuccess` callbacks for consistency
- Auth state is persisted in AsyncStorage via Zustand middleware; 401 responses auto-clear auth state via the axios interceptor in `api/api.ts`
- Protected routes are guarded in `app/(main)/_layout.tsx` — redirects to login if no user
- Role-based tab visibility uses `href: null` in tab config
- Module types each get their own presenter component in `components/attempts/presenters/` — the `AttemptPresenter` routes to the correct one based on module type
- Each new CBT tool will likely need: a new `ModuleType` enum value, a Mongoose model (BE), a controller (BE), a FE presenter component, and a hook
- **Shared types workflow:** All API response types, model interfaces, and response shapes must be defined in the BE shared-types package (`@milobedini/shared-types`), not in FE code. When making changes that affect types: (1) update the shared-types package in `../cbt/`, (2) publish to npm, (3) run `npm run update-types` in the FE. Local FE enums (or `as const` objects) that mirror shared string-union types are permitted when they provide runtime constants for comparisons — these prevent magic strings and enable safe refactoring. Keep them in `types/types.ts` and ensure values stay in sync with the shared-types contract.

### Patterns

- UI patterns (Pressable, ThemedText, FlatList, images, action menus, Paper theme, lazy tabs) are documented in `.claude/rules/figma-design-system.md`
- **Infinite scroll:** Use `useInfiniteQuery` with `initialPageParam: 1` and `getNextPageParam` from `page`/`totalPages`. Flatten pages via `data.pages.flatMap(p => p.items)`. See `useAllUsers` for reference.
- **Infinite scroll + search:** Use `keepPreviousData` with `useInfiniteQuery` to prevent full-screen flashes on param changes. Use `isLoading` (not `isPending`) for initial full-screen loaders. Guard empty states with `!isFetching && items.length === 0`. See `useAllUsers` + `AllUsersList` for reference.
- **Value debounce:** Use `useDebounce(value, delay)` from `hooks/useDebounce.ts` for search inputs. Distinct from callback-based `useDebouncedCallback` in `utils/debounce.ts`.
- **Filter drawers:** Slide-in from right using `Animated.View` + `useWindowDimensions()`. See `AttemptFilterDrawer` (timeline), `UserFilterDrawer` (admin users), and `ReviewFilterDrawer` (therapist review). Shared chip styles extracted to `utils/chipStyles.ts`.
- **Destructive action confirmation:** `ActionMenu` has a built-in confirmation step for destructive actions. Set `variant: 'destructive'` on an action item and optionally provide `confirmTitle`, `confirmDescription`, and `confirmLabel` props for custom confirmation UI.
- **Cross-tab navigation with back button:** When navigating from one tab to a nested screen in another tab's stack (e.g. dashboard → client detail), use `<Link push withAnchor asChild>` instead of `router.push`. The `withAnchor` prop forces the target stack's `initialRouteName` to load first, ensuring a proper back button. Requires `export const unstable_settings = { initialRouteName: 'index' }` in the target stack's layout file. See `ClientCard.tsx` → `patients/[id]` for reference. Docs: <https://docs.expo.dev/router/basics/navigation/>

## Git Workflow

- Use conventional commits, keep messages concise
- Never include AI co-author references in commit messages
- Pre-commit hook runs `lint-staged` (ESLint fix + Prettier on staged files only)
- Pre-push hook runs `tsc --noEmit` (type check)
- After a successful commit and push, run `npm run publish` to publish an OTA update

## Commands

- `npx eslint --fix .` — auto-fix eslint issues (import sorting, etc.)
- `npx prettier --write .` — format all files
- `npm run lint` — run all validation (expo lint, eslint, prettier check, type check) — use this to validate changes
- `npx expo start` — dev server
- `npm run restart` — dev server with cache clear
- `npm run clean` — full clean reinstall (rm node_modules, npm ci, expo install --fix)
- `npm run update-types` — reinstall `@milobedini/shared-types` to pick up latest version
- `npm run publish` — OTA update via EAS
- `npm run publish-web` — export and deploy web build
- `npm run build:ios-sim` — build dev app for iOS simulator (required for Maestro, sets `EXPO_PUBLIC_E2E=true`)
- `npm test` — run all unit/component tests (Jest)
- `npm run test:watch` — run tests in watch mode
- `npm run test:coverage` — run tests with coverage report
- `npm run test:e2e` — run all Maestro E2E flows
- `npm run test:e2e:studio` — launch Maestro Studio for interactive flow authoring
- `npm run test:e2e:full` — full pipeline: starts BE if needed, builds iOS sim app, runs all Maestro flows
- `npm run upgrade` — upgrade to latest stable Expo SDK and fix all dependencies

## Validation Workflow

- **On commit:** Husky pre-commit hook runs `lint-staged` (ESLint fix + Prettier on staged files) — no manual step needed
- **On push:** Husky pre-push hook runs `tsc --noEmit` — catches type errors before CI
- **On PR / push to main:** CI runs full `npm run lint` + `npm test`
- `npm run lint` is available for a full manual sweep when needed but is not the primary workflow

## Web Debugging

- Use the **Playwright MCP server** to debug web-platform issues — navigate to `localhost`, take screenshots, read console errors, and inspect the DOM directly
- Start the dev server with `npx expo start --web --port 8082`, then use Playwright to browse `http://localhost:8082`
- Clean up `.playwright-mcp/` artifacts when done — do not commit them

## Code Conventions

- Prefer arrow functions and `const`
- Avoid `let`, `forEach` — use `map`, `filter`, `reduce`
- Use `Colors` constants from `constants/Colors.ts` — never hardcode hex values in components
- Use `useWindowDimensions()` hook over static `Dimensions.get()` in components
- Wrap dev-only logging in `if (__DEV__)`
- Keep sorting, filtering, and pagination logic on the backend (`../cbt/`) — the FE should pass query parameters to the API and render results, not re-sort or filter client-side
- **Keyboard handling:** Every screen or modal with text inputs must account for the software keyboard. Use `KeyboardAwareScrollView` from `react-native-keyboard-controller` for scrollable forms (it automatically scrolls focused inputs into view with native performance). `KeyboardProvider` is already wrapped in `app/_layout.tsx`. For non-scrollable screens, use `KeyboardAvoidingView` with `behavior="padding"` on iOS. For bottom sheets, rely on `@gorhom/bottom-sheet`'s built-in keyboard handling. Set `blurOnSubmit` and `returnKeyType="done"` on multiline `TextInput`s so the return key dismisses the keyboard rather than inserting a newline. Never let the keyboard obscure inputs or submit buttons. Test on iOS where keyboard behaviour is most aggressive.
- **Virtualised lists:** Use `FlatList` or `SectionList` for dynamic or potentially long lists (API data, search results, timelines). Use `ScrollView` only for short, fixed-length content where all items fit comfortably in memory (e.g. a form, a settings screen, a handful of cards). If the list has more than ~20 items or is driven by paginated data, it must be virtualised. Never render a dynamic-length array of components inside a plain `ScrollView`.
- **Known issues:** When you spot a pattern that needs fixing but is out of scope for the current task (e.g. duplicated code, missing abstractions, tech debt), leave a `// TODO:` comment in the code explaining what needs to change and why — don't silently skip it

## Design System

- Figma-to-code rules, colour tokens, typography, component inventory, and layout patterns are documented in `.claude/rules/figma-design-system.md` — this file is auto-loaded as context for every conversation and should be kept in sync with the codebase via the `update-status` skill.

## Unit & Component Testing (Jest)

- **Runner:** Jest with `jest-expo` preset, `@testing-library/react-native` for component tests
- Colocate test files next to the code they test: `Component.test.tsx`, `util.test.ts`
- Test behaviour, not implementation — query by text/testID, not internal state
- Use `jest.useFakeTimers()` + `jest.setSystemTime()` for time-dependent logic — always restore via `afterEach(() => jest.useRealTimers())`, not inline cleanup
- RN style props are arrays — use `expect.arrayContaining([expect.objectContaining(...)])` for style assertions
- **Shared test utilities** live in `test-utils/` — use `createQueryClientWrapper()` for hook tests that need a `QueryClientProvider`, `mockQueryResult()` to build mock `UseQueryResult` objects, and `presenterMocks.ts` for shared presenter hook test mocks (expo-router, expo-haptics, sonner-native, toastOptions, useAttempts)
- `jest.setup.ts` provides global mocks (AsyncStorage, `@react-native-vector-icons/material-design-icons`) and polyfills Node's native `ReadableStream` (workaround for Expo's streams polyfill until SDK 55) — add new global mocks there, not per-file
- `clearMocks: true` is set in `jest.config.ts`, so Jest auto-resets all mocks between tests — do not add per-test `beforeEach(() => jest.clearAllMocks())` blocks
- Avoid `as` type casts in test data — build mock objects that satisfy the real types with sensible defaults and accept `Partial<T>` overrides so tests only specify the fields they care about. Casts hide mismatches between test data and the actual API contract; if the type doesn't fit, fix the defaults, not the type
- **Mock references after `jest.mock()` factories:** Use `require()` to get a reference to the mocked module — this is the documented Jest pattern because `jest.mock()` hoisting makes ES import bindings stale. `@typescript-eslint/no-require-imports` is disabled for test files in `eslint.config.mjs`. Example: `jest.mock('./useUsers', () => ({ useIsLoggedIn: jest.fn() })); const { useIsLoggedIn } = require('./useUsers');`
- When a mock only needs a fixed return value (never changes between tests), a direct factory is fine: `jest.mock('./useUsers', () => ({ useIsLoggedIn: () => true }))`
- **Coverage:** `npm run test:coverage` reports on **all** source files (via `collectCoverageFrom` in `jest.config.ts`), not just files imported by tests. Use this to see true project coverage. The `coverage/` output directory is gitignored. `coveragePathIgnorePatterns` in the same file excludes files that don't benefit from unit tests: constants/types, platform shims, thin layout wrappers, and static display components.

## CI (GitHub Actions)

- PR validation workflow (`.github/workflows/pr-validation.yml`) runs on every push to main and every PR: ESLint, Prettier, TypeScript, and Jest tests
- This is the merge gatekeeper — pre-commit hooks are a convenience, CI is the enforcement layer

## E2E Testing (Maestro)

- Maestro flows live in `.maestro/flows/`, reusable subflows in `.maestro/subflows/`
- **Always create or update Maestro E2E flows** when implementing new features or changing existing features that affect user-facing behavior — E2E coverage should grow with the app
- Detailed authoring guidance (testID conventions, platform quirks, CLI quirks, env vars) lives in `.maestro/CLAUDE.md`

## Code Review

- When scoring code review issues, include all issues scoring **50 or above** (not just 80+)

## Custom Skills

- **update-status** — When the user says "update status", "sync claude md", or "update build status", read and follow `.claude/skills/update-status/SKILL.md`
- **visual-test** — Opinionated UI/UX review via simulator screenshots, cross-referenced against the feature's superpowers plan/spec. **Proactively offer** to run after completing feature development from a superpowers plan, before pushing to git, or before creating a PR — any time UI has changed. Uses Maestro for navigation only (temp scripts), does not create persistent test flows.
- **product-manager** — When the user says "pm", "prioritise", "what should we build", "what's next", "roadmap", or "mvp", invoke the `product-manager` skill. PM briefs are stored in `docs/pm/` as dated markdown files (e.g., `docs/pm/2026-03-24.md`). Each brief captures current state, unfinished work, MVP status, MoSCoW prioritisation, and recommendations.
- **test-audit** — When the user says "test audit", "what needs testing", "add tests", or "test coverage". Scans the codebase (or recently changed files), classifies files by test priority using a testing trophy philosophy (integration > unit > E2E), presents a prioritized table, then writes and verifies tests for approved items. Proactively offer after completing a feature.
