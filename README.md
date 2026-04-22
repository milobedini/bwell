# BWell

<p align="center">
  <img src="assets/images/logo.png" alt="BWell Logo" width="120" />
</p>

<p align="center">
  A cross-platform therapy app for delivering structured therapeutic programs to patients, with therapist oversight and admin management.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo_SDK-54-blue?logo=expo" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61dafb?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey" alt="Platform" />
</p>

---

## Overview

BWell connects **patients**, **therapists**, and **admins** in a mental health platform. Therapists assign therapeutic modules (questionnaires, reading content, activity diaries, Five Areas Model, general goals) to patients and track their progress. Admins oversee the system, verify therapists, and monitor platform-wide metrics.

## Features

### Patient

- Personalised dashboard with focus card, effort metrics, upcoming practice, and score trends
- Journey tab with score sparklines and progress history
- Practice tab with active and completed practice items
- Browse programs and modules
- Complete assigned questionnaires, reading content, Five Areas Model (CBT hot cross bun), general goals with re-rating check-ins, and weekly goals with mastery/pleasure ratings and reflection prompts
- View attempt history and detailed practice item submissions

### Therapist

- Triage dashboard with client status buckets (needs attention, completed, inactive), stat pills, and score deltas
- Manage a client list from the patient pool with server-side search and sort
- Assign and remove modules for each client
- Review tab with filter drawer (module type, patient, date range) for patient submissions
- View latest attempt submissions across all clients

### Admin

- IAPT-shaped overview: outcomes triplet (access, recovery, reliable improvement) paired with 90-day movement, lead programme card, and per-programme rows
- Drill into any programme for a tier × triplet breakdown (self-help, CBT, PWP), enrolment and active-work snapshots
- Attention banner and outcomes sparkline surface freshness, recovery suppression, and trends at a glance
- Ops footer and freshness indicators flag stale rollups so seed/backfill gaps are obvious
- Audit log screen with infinite scroll, action/actor filter drawer, outcome-aware rows and expand-in-place context
- Verify new therapist accounts
- Search, filter, and sort all registered users with infinite scroll

## Recent Milestones

- **Admin dashboard overhaul** — IAPT outcomes triplet with 90-day snapshot pairing, lead programme card, per-programme rows drilling into tier × triplet detail screens, care tier breakdown table, attention banner and outcomes sparkline, ops/freshness indicators, and a cursor-paginated audit log with action/actor filter drawer and expand-in-place context (2026-04-21)
- **Weekly Goals module** — new presenter with moment cards, week rail, reflection thread and coach message; tap-anchored Skia bloom on goal completion; reusable `TypewriterText` and `BloomBurst` UI primitives; bloom teal colour tokens (2026-04-20)
- **Jest test coverage expansion** — 47 new test files across components, hooks and utils, global mocks (AsyncStorage, material-design-icons) in `jest.setup.ts`, `clearMocks: true` replacing per-test reset boilerplate, shared `test-utils/` wrappers for React Query and presenter mocks (2026-04-17)
- **Profile redesign** — role-aware dashboard layout with identity header, therapist/client relationship cards, stats strip, iOS-style grouped settings, shared initials utility and new colour tokens (2026-04-16)
- **General Goals module** — goal rating with slider tracks, re-rating check-ins with unified timeline and trend indicators, reflection section, "Check-in" label across all views (2026-04-15)
- **Activity diary redesign** — accordion layout with animated expand/collapse, split save/submit, Reanimated progress ring, mood slider, metric stepper with stale closure fixes, teal glow save indicator (2026-04-10)
- **Five Areas Model** — interactive CBT hot cross bun diagram (Skia), node-expand modal input, stepped edit/review flow, area review cards (2026-04-05)
- **Maestro E2E testing** — login flow with reusable subflows, full pipeline script with BE healthcheck, iOS simulator build with LogBox suppression, testID conventions (2026-04-04)
- **Therapist dashboard UX improvements** — overdue chips, relative dates, progress bars on client detail cards, reason tags on attention cards, week-scoped assignment framing (2026-04-04)
- **Unified practice model** — merged assignments and attempts into a single practice concept, new journey/practice/review tabs, BarSparkline component, server-side client search/sort (2026-04-01)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81, React 19 |
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
    └── profile/         # Role-aware profile dashboard & settings

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
