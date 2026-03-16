# CLAUDE.md

## Project

bwell — an Expo React Native therapy app (iOS, Android, Web) with role-based access (Patient, Therapist, Admin).

## Stack

- **Framework:** Expo SDK 54, React Native 0.81, React 19, expo-router (file-based routing)
- **Language:** TypeScript (strict mode)
- **Styling:** NativeWind (Tailwind CSS) — prefer className over StyleSheet where possible
- **State:** Zustand (client/auth), TanStack React Query (server state)
- **Forms:** Formik + Yup
- **UI:** react-native-paper, @gorhom/bottom-sheet, moti, react-native-reanimated, @shopify/react-native-skia
- **API:** Axios with cookie-based auth (`withCredentials: true`)
- **Types:** Shared types via `@milobedini/shared-types` npm package

## Architecture

- Query defaults (staleTime, refetch settings) are centralized in `QueryClient` in `app/_layout.tsx` — only override in hooks when a shorter staleTime is needed
- Use `invalidateQueries` (not `refetchQueries`) in mutation `onSuccess` callbacks for consistency
- Auth state is persisted in AsyncStorage via Zustand middleware; 401 responses auto-clear auth state via the axios interceptor in `api/api.ts`
- Protected routes are guarded in `app/(main)/_layout.tsx` — redirects to login if no user
- Role-based tab visibility uses `href: null` in tab config

## Git Workflow

- Solo developer — commit and push directly to `main`
- Use conventional commits, keep messages concise
- Never include AI co-author references in commit messages
- After a successful commit and push, run `npm run publish` to publish an OTA update

## Commands

- `npx tsc --noEmit` — type check
- `npx expo start` — dev server
- `npx eslint .` — lint

## Code Conventions

- Prefer arrow functions and `const`
- Avoid `let`, `forEach` — use `map`, `filter`, `reduce`
- Use `Colors` constants from `constants/Colors.ts` — never hardcode hex values in components
- Use `useWindowDimensions()` hook over static `Dimensions.get()` in components
- Wrap dev-only logging in `if (__DEV__)`
