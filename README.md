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

BWell connects **patients**, **therapists**, and **admins** in a mental health platform. Therapists assign therapeutic modules (questionnaires, exercises, psychoeducation) to patients and track their progress. Admins oversee the system, verify therapists, and monitor platform-wide metrics.

## Features

### Patient

- Browse programs and modules
- Complete assigned questionnaires, exercises, and psychoeducation content
- Track active and completed assignments
- View attempt history

### Therapist

- Manage a client list from the patient pool
- Assign and remove modules for each client
- Review patient submissions and progress timelines
- View latest attempt submissions across all clients

### Admin

- Dashboard with user counts, weekly completions, and platform stats
- Verify new therapist accounts
- Browse and filter all registered therapists

## Recent Milestones

- **Query refactor** — restored default refetchOnMount, dropped refetchType workaround (2026-03-19)
- **UI bug fixes** — resolved stale data, layout gaps, row widths, chip styling, therapist note input (2026-03-19)
- **UI/UX polish pass** — StatusChip rewrite, EmptyState component, Pressable buttons, web font alignment, colour tokens (2026-03-18)
- **Activity Diary enhancements** — reflection prompts, editable user note, day chip fill indicators, collapsible weekly summary, slot mood tinting (2026-03-18)

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
| UI Components | React Native Paper, Bottom Sheet, Moti, Reanimated, Skia |
| HTTP | Axios (cookie-based auth) |
| Shared Types | `@milobedini/shared-types` |

## Project Structure

```
app/
├── (auth)/              # Login, signup, email verification
├── (welcome)/           # Onboarding carousel
└── (main)/(tabs)/       # Authenticated tab navigator
    ├── home/            # Role-specific home screens
    ├── assignments/     # View & create assignments
    ├── attempts/        # View attempt history & details
    ├── programs/        # Browse programs & modules
    ├── all-users/       # Admin: manage therapists
    └── profile/         # User profile & logout

api/                     # Axios instance & interceptors
components/              # Shared UI components
hooks/                   # React Query data-fetching hooks
stores/                  # Zustand auth store
constants/               # Colors & typography
types/                   # Enums & local type definitions
utils/                   # Role checks, date helpers, etc.
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
| `npx expo start -c` | Start with cache cleared |
| `npx tsc --noEmit` | Type check |
| `npx eslint .` | Lint |
| `npx prettier --write .` | Format all files |
| `npm run publish` | Publish OTA update via EAS |

## Architecture

- **Auth** is cookie-based (`withCredentials: true`). A 401 interceptor auto-clears the Zustand auth store and redirects to login.
- **Query defaults** (1-hour stale time, refetch on window-focus and reconnect disabled) are centralized in the root layout. Individual hooks override only when fresher data is needed.
- **Route protection** lives in the `(main)/_layout.tsx` guard. Role-based tab visibility uses expo-router's `href: null` pattern to hide tabs per role.
- **Shared types** are published as an npm package (`@milobedini/shared-types`) to keep the frontend and backend in sync.

## License

This project is proprietary and not open source.
