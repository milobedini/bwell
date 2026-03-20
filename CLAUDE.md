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

### Current build status

**Done:**
- Auth (register, login, email verification, logout, 401 auto-clear)
- Role system (Patient, Therapist, Admin) with therapist verification
- Therapist-patient relationship (assign/remove clients)
- Assignment system (due dates, recurrence, notes)
- Questionnaire engine (scored MCQ, horizontal pager, auto-save, score bands) — supports PHQ-9, GAD-7, PDSS
- Attempt lifecycle (start → auto-save → submit → view)
- Therapist timeline (paginated patient history, filterable)
- Admin dashboard (stats, therapist verification)
- Onboarding carousel + welcome flow
- Activity Diary (weekly grid, day chips with fill indicators, numeric fields, reflection prompts, editable user note, collapsible weekly summary, slot mood tinting)
- UI component system (StatusChip base, EmptyState component, Pressable buttons with hover/focus/disabled states, colour tokens in tailwind config, web-aligned font scale)
- Admin All Users (search, filtering, sorting, infinite scroll with lazy loading)
- Global Paper dark theme (MD3DarkTheme, dialog surfaces, dark-aware text)

**In progress / partial:** (none currently)

**Not yet built (working down the proposal):**
- 5 Areas Model (interactive CBT cycle: Situation → Thoughts → Emotions → Behaviours → Physical)
- General Goals (goal + current/mid/end ratings 0-10, reflection prompts)
- Weekly Goals (to-do list, tick off, tie to activity diary)
- Thinking Traps (learn traps, identify patterns, reflect)
- Thought Monitoring (log unhelpful thoughts, tag with thinking trap)
- Thought Challenging (structured evidence for/against worksheet)
- Longitudinal Model / Extended CBT Cycle (Beck formulation)
- Belief Change Evidence Table (old belief vs new belief evidence)
- Modifying Unhelpful Beliefs (structured worksheet)
- Psychoeducation presenter (module type enum exists, no UI)
- Exercise presenter (module type enum exists, no UI)
- Self-help program recommendation (suggest programs from questionnaire scores)

## Stack

- **Framework:** Expo SDK 54, React Native 0.81, React 19, expo-router (file-based routing)
- **Language:** TypeScript (strict mode)
- **Styling:** NativeWind (Tailwind CSS) — prefer className over StyleSheet where possible
- **State:** Zustand (client/auth), TanStack React Query (server state)
- **Forms:** Formik + Yup
- **UI:** react-native-paper, @gorhom/bottom-sheet, moti, react-native-reanimated, @shopify/react-native-skia
- **API:** Axios with cookie-based auth (`withCredentials: true`)
- **Types:** Shared types via `@milobedini/shared-types` npm package
- **Backend:** Node/Express + MongoDB (separate repo at `../cbt/`)

## Architecture

- Query defaults (1-hour staleTime, refetchOnWindowFocus/refetchOnReconnect disabled) are centralized in `QueryClient` in `app/_layout.tsx` — only override in hooks when a shorter staleTime is needed
- Use `invalidateQueries` (not `refetchQueries`) in mutation `onSuccess` callbacks for consistency
- Auth state is persisted in AsyncStorage via Zustand middleware; 401 responses auto-clear auth state via the axios interceptor in `api/api.ts`
- Protected routes are guarded in `app/(main)/_layout.tsx` — redirects to login if no user
- Role-based tab visibility uses `href: null` in tab config
- Module types each get their own presenter component in `components/attempts/presenters/` — the `AttemptPresenter` routes to the correct one based on module type
- Each new CBT tool will likely need: a new `ModuleType` enum value, a Mongoose model (BE), a controller (BE), a FE presenter component, and a hook

### Patterns

- **Infinite scroll:** Use `useInfiniteQuery` with `initialPageParam: 1` and `getNextPageParam` from `page`/`totalPages`. Flatten pages via `data.pages.flatMap(p => p.items)`. See `useAllUsers` for reference.
- **Infinite scroll + search:** Use `keepPreviousData` with `useInfiniteQuery` to prevent full-screen flashes on param changes. Use `isLoading` (not `isPending`) for initial full-screen loaders. Guard empty states with `!isFetching && items.length === 0`. See `useAllUsers` + `AllUsersList` for reference.
- **Value debounce:** Use `useDebounce(value, delay)` from `hooks/useDebounce.ts` for search inputs. Distinct from callback-based `useDebouncedCallback` in `utils/debounce.ts`.
- **Filter drawers:** Slide-in from right using `Animated.View` + `useWindowDimensions()`. See `AttemptFilterDrawer` (timeline) and `UserFilterDrawer` (admin users).
- **Paper dark theme:** Global `MD3DarkTheme` is configured in `_layout.tsx` with app color tokens. Dialog backgrounds use `surfaceContainerHigh` / `elevation.level3` (set to `Colors.chip.darkCard`). When adding Paper `TextInput` inside dialogs, set `style={{ backgroundColor: Colors.chip.darkCard }}` to match the dialog surface. Do not use `ThemedText`'s `onLight` prop inside dialogs — they are dark-themed.

## Git Workflow

- Use conventional commits, keep messages concise
- Never include AI co-author references in commit messages
- Before staging, run `npx prettier --write .` to format all files — husky pre-commit hooks check this
- After a successful commit and push, run `npm run publish` to publish an OTA update

## Commands

- `npx eslint --fix .` — auto-fix eslint issues (import sorting, etc.)
- `npx prettier --write .` — format all files
- `npm run lint` — run all validation (expo lint, eslint, prettier check, type check) — use this to validate changes
- `npx expo start` — dev server
- `npm run publish` — OTA update via EAS

## Validation Workflow

1. Run `npx eslint --fix .` to auto-fix eslint issues (import sorting, etc.)
2. Run `npx prettier --write .` to format all files
3. Run `npm run lint` to validate everything passes

## Code Conventions

- Prefer arrow functions and `const`
- Avoid `let`, `forEach` — use `map`, `filter`, `reduce`
- Use `Colors` constants from `constants/Colors.ts` — never hardcode hex values in components
- Use `useWindowDimensions()` hook over static `Dimensions.get()` in components
- Wrap dev-only logging in `if (__DEV__)`

## Custom Skills

- **update-status** — When the user says "update status", "sync claude md", or "update build status", read and follow `.claude/skills/update-status/SKILL.md`
- **visual-test** — Opinionated UI/UX review via simulator screenshots, cross-referenced against the feature's superpowers plan/spec. **Proactively offer** to run after completing feature development from a superpowers plan, before pushing to git, or before creating a PR — any time UI has changed. Uses Maestro for navigation only (temp scripts), does not create persistent test flows.
