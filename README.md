# BWell

<p align="center">
  <img src="assets/images/logo.png" alt="BWell Logo" width="120" />
</p>

<p align="center">
  A cross-platform therapy app for delivering structured therapeutic programs to patients, with therapist oversight and admin management.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo_SDK-55-blue?logo=expo" alt="Expo SDK 55" />
  <img src="https://img.shields.io/badge/React_Native-0.83-61dafb?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey" alt="Platform" />
</p>

---

## Overview

BWell connects **patients**, **therapists**, and **admins** in a mental health platform. Therapists assign therapeutic modules (questionnaires, reading content, activity diaries) to patients and track their progress. Admins oversee the system, verify therapists, and monitor platform-wide metrics.

## Features

### Patient

- Personalised dashboard with focus card, effort metrics, upcoming practice, and score trends
- Journey tab with score sparklines and progress history
- Practice tab with active and completed practice items
- Browse programs and modules
- Complete assigned questionnaires, reading content, and Five Areas Model (CBT hot cross bun)
- View attempt history and detailed practice item submissions

### Therapist

- Triage dashboard with client status buckets (needs attention, completed, inactive), stat pills, and score deltas
- Manage a client list from the patient pool with server-side search and sort
- Assign and remove modules for each client
- Review tab with filter drawer (module type, patient, date range) for patient submissions
- View latest attempt submissions across all clients

### Admin

- Dashboard with user counts, weekly completions, and platform stats
- Verify new therapist accounts
- Search, filter, and sort all registered users with infinite scroll

## Recent Milestones

- **Five Areas Model** — interactive CBT hot cross bun diagram (Skia), node-expand modal input, stepped edit/review flow, area review cards (2026-04-05)
- **Maestro E2E testing** — login flow with reusable subflows, full pipeline script with BE healthcheck, iOS simulator build with LogBox suppression, testID conventions (2026-04-04)
- **Therapist dashboard UX improvements** — overdue chips, relative dates, progress bars on client detail cards, reason tags on attention cards, week-scoped assignment framing (2026-04-04)
- **Unified practice model** — merged assignments and attempts into a single practice concept, new journey/practice/review tabs, BarSparkline component, server-side client search/sort (2026-04-01)
- **Reading module type** — replaced psychoeducation/exercise with unified reading presenter, markdown rendering, scroll progress bar, reader notes (2026-04-01)
- **Destructive action confirmation** — ActionMenu built-in confirmation step for all destructive actions with customisable title, description, and label (2026-03-29)
- **Therapist assignments redesign** — SectionList grouped by patient, sort/filter drawer, edit modal (due date, notes, recurrence), collapsible sections, shared chip styles (2026-03-27)
- **Patient dashboard** — focus card, effort strip, coming up list, Skia sparkline score trends, pull-to-refresh (2026-03-26)
- **Therapist dashboard** — triage buckets with client cards, stat pills, score deltas, assignment dots, progress bars (2026-03-25)
- **Diary keyboard toolbar** — native-style prev/next chevron navigation for numeric fields, keyboard-aware positioning (2026-03-24)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Expo SDK 55, React Native 0.83, React 19 |
| Routing | expo-router (file-based) |
| Language | TypeScript (strict) |
| Styling | NativeWind (Tailwind CSS for RN) |
| Client State | Zustand (persisted to AsyncStorage) |
| Server State | TanStack React Query |
| Forms | Formik + Yup |
| UI Components | React Native Paper, Bottom Sheet, Moti, Reanimated, Skia, Markdown Display |
| HTTP | Axios (cookie-based auth) |
| Shared Types | `@milobedini/shared-types` |

## Project Structure

```
app/
├── (auth)/              # Login, signup, email verification
├── (welcome)/           # Onboarding carousel
└── (main)/(tabs)/       # Authenticated tab navigator
    ├── home/            # "Dashboard" (therapist/admin) / "Home" (patient) + nested views
    ├── journey/         # Patient: score trends & progress history
    ├── practice/        # Patient: active & completed practice items
    ├── patients/        # Therapist: "Clients" tab — client list & assignment management
    ├── review/          # Therapist: review patient submissions
    ├── programs/        # Browse programs & modules
    ├── all-users/       # Admin: search, filter & sort all users
    └── profile/         # User profile & logout

api/                     # Axios instance & interceptors
components/              # Shared UI components
hooks/                   # React Query data-fetching hooks & dashboard aggregation
stores/                  # Zustand auth store
constants/               # Colors & typography
types/                   # Enums & local type definitions
utils/                   # Role checks, date helpers, severity colours, debounce
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) or Android Emulator, or a physical device with [Expo Go](https://expo.dev/go)

### Installation

```bash
npm install
```

### Development

```bash
npx expo start
```

From the dev server, press **i** for iOS simulator, **a** for Android emulator, or **w** for web.

### Scripts

| Command | Description |
| --- | --- |
| `npx expo start` | Start the dev server |
| `npm run restart` | Start with cache cleared |
| `npm run lint` | Run all validation (eslint, prettier, type check) |
| `npx prettier --write .` | Format all files |
| `npm run publish` | Publish OTA update via EAS |
| `npm run publish-web` | Export and deploy web build |
| `npm run update-types` | Reinstall `@milobedini/shared-types` to latest |
| `npm test` | Run all unit/component tests (Jest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run build:ios-sim` | Build dev app for iOS simulator (E2E) |
| `npm run test:e2e` | Run all Maestro E2E flows |
| `npm run test:e2e:studio` | Launch Maestro Studio for interactive flow authoring |
| `npm run test:e2e:full` | Full E2E pipeline (BE + build + Maestro) |

## Testing

| Layer | Tool | Details |
| --- | --- | --- |
| Unit | Jest + `jest-expo` | Utility functions, pure logic — colocated as `*.test.ts` |
| Component | Jest + React Testing Library | Render components, assert behaviour by text/testID — colocated as `*.test.tsx` |
| E2E | Maestro | Full user flows on iOS simulator — flows in `.maestro/flows/`, reusable subflows in `.maestro/subflows/` |
| CI | GitHub Actions | PR validation runs ESLint, Prettier, TypeScript, and Jest on every push to main and every PR |

## Architecture

- **Auth** is cookie-based (`withCredentials: true`). A 401 interceptor auto-clears the Zustand auth store and redirects to login.
- **Query defaults** (1-hour stale time, refetch on window-focus and reconnect disabled) are centralized in the root layout. Individual hooks override only when fresher data is needed.
- **Route protection** lives in the `(main)/_layout.tsx` guard. Role-based tab visibility uses expo-router's `href: null` pattern to hide tabs per role.
- **Shared types** are published as an npm package (`@milobedini/shared-types`) to keep the frontend and backend in sync.

## License

This project is proprietary and not open source.
