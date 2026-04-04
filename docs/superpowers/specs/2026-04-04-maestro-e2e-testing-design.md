# Maestro E2E Testing — Design Spec

## Goal

Add Maestro E2E testing to bwell with a single login flow as the first test, local dev tooling via Maestro Studio, and CI via Maestro Cloud on GitHub Actions.

## Approach

Hybrid: local Maestro for authoring/debugging flows + Maestro Cloud (free tier) for CI on pull requests.

## 1. Bottom Sheet Accessibility Fix

`@gorhom/bottom-sheet` v5 sets `accessible={true}` by default on the sheet container, which collapses the entire subtree into a single accessibility node on iOS. Maestro cannot see or interact with any child elements.

**Fix:** Add `accessible={Platform.select({ ios: false })}` to `BottomSheetModal` in:
- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`

Do NOT set `accessible={false}` on Android — it breaks TalkBack.

**References:**
- [gorhom/react-native-bottom-sheet #1753](https://github.com/gorhom/react-native-bottom-sheet/issues/1753)
- [mobile-dev-inc/maestro #1493](https://github.com/mobile-dev-inc/maestro/issues/1493)
- [software-mansion/react-native-reanimated #6648](https://github.com/software-mansion/react-native-reanimated/issues/6648)

## 2. testID Strategy

**Convention:** `<screen>-<element>-<type>` — predictable, greppable, no magic strings.

**Login flow testIDs to add:**

| Element | testID | File |
|---------|--------|------|
| Unlock/open sheet button | `login-unlock-button` | `login.tsx` |
| Email/username input | `login-identifier-input` | `login.tsx` |
| Password input | `login-password-input` | `login.tsx` |
| Submit button | `login-submit-button` | `login.tsx` |
| Signup link | `login-signup-link` | `login.tsx` |
| Home screen landmark | `home-screen` | `app/(main)/(tabs)/home/index.tsx` |

**Going forward:** All new interactive elements should include a `testID` following this convention.

## 3. Maestro Directory Structure

```
.maestro/
  config.yaml
  flows/
    auth/
      login.yaml
  subflows/
    login.yaml
```

### `config.yaml`

```yaml
flows:
  - "flows/**"
executionOrder:
  continueOnFailure: false
platform:
  ios:
    disableAnimations: true
```

### `flows/auth/login.yaml` — Full Login Test

```yaml
appId: com.milobedini.bwell
tags:
  - smoke
  - auth
env:
  EMAIL: ${EMAIL}
  PASSWORD: ${PASSWORD}
---
- launchApp:
    clearState: true
- assertVisible:
    id: "login-unlock-button"
    timeout: 60000
- tapOn:
    id: "login-unlock-button"
- waitForAnimationToEnd
- tapOn:
    id: "login-identifier-input"
- inputText: ${EMAIL}
- hideKeyboard
- tapOn:
    id: "login-password-input"
- inputText: ${PASSWORD}
- hideKeyboard
- tapOn:
    id: "login-submit-button"
- assertVisible:
    id: "home-screen"
    timeout: 60000
```

### `subflows/login.yaml` — Reusable Login Sequence

Same steps as above but designed to be called from other flows:

```yaml
appId: com.milobedini.bwell
env:
  EMAIL: ${EMAIL}
  PASSWORD: ${PASSWORD}
---
- launchApp:
    clearState: true
- tapOn:
    id: "login-unlock-button"
- waitForAnimationToEnd
- tapOn:
    id: "login-identifier-input"
- inputText: ${EMAIL}
- hideKeyboard
- tapOn:
    id: "login-password-input"
- inputText: ${PASSWORD}
- hideKeyboard
- tapOn:
    id: "login-submit-button"
- assertVisible:
    id: "home-screen"
    timeout: 60000
```

**Usage from other flows:**
```yaml
- runFlow:
    file: subflows/login.yaml
    env:
      EMAIL: "therapist1@test.com"
      PASSWORD: ${PASSWORD}
```

## 4. Development Build

Maestro needs a standalone `.app` binary — cannot target Expo Go reliably.

**Changes:**
- Set explicit `ios.bundleIdentifier: "com.milobedini.bwell"` in `app.config.js`
- Run `npx expo run:ios` to build for iOS simulator
- Ensure `ios/` is in `.gitignore` (generated native project, not committed)

**npm scripts to add to `package.json`:**

```json
{
  "build:ios-sim": "npx expo run:ios",
  "test:e2e": "maestro test .maestro/flows/",
  "test:e2e:studio": "maestro studio"
}
```

**Local workflow:**
1. `npm run build:ios-sim` — build once (incremental after first build)
2. `npm run test:e2e:studio` — author/debug flows interactively
3. `npm run test:e2e` — run all flows

## 5. CI — GitHub Actions + Maestro Cloud

**File:** `.github/workflows/maestro-e2e.yml`

**Trigger:** Pull requests to `main`.

**Job:**
1. Checkout code
2. Setup Node 20, `npm ci`
3. Build iOS simulator `.app` via `npx expo run:ios` (requires `macos-latest` runner)
4. Upload `.app` + `.maestro/` to Maestro Cloud via `mobile-dev-inc/action-maestro-cloud@v2`

**GitHub secrets required:**

| Secret | Purpose |
|--------|---------|
| `MAESTRO_API_KEY` | Maestro Cloud authentication |
| `MAESTRO_PROJECT_ID` | Maestro Cloud project identifier |
| `MAESTRO_TEST_EMAIL` | Test account email (e.g., `patient1@test.com`) |
| `MAESTRO_TEST_PASSWORD` | Test account password |
| `EXPO_PUBLIC_BACKEND_BASE_URL` | Deployed backend URL (baked into build) |

**Workflow outline:**

```yaml
name: Maestro E2E

on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Build iOS simulator app
        env:
          EXPO_PUBLIC_BACKEND_BASE_URL: ${{ secrets.EXPO_PUBLIC_BACKEND_BASE_URL }}
        run: npx expo run:ios --no-install
      - name: Wake backend (Render free tier cold start)
        run: |
          curl -sf --retry 5 --retry-delay 10 --retry-all-errors "${{ secrets.EXPO_PUBLIC_BACKEND_BASE_URL }}/health" || echo "Backend warm-up failed, continuing anyway"
      - uses: mobile-dev-inc/action-maestro-cloud@v2
        with:
          api-key: ${{ secrets.MAESTRO_API_KEY }}
          project-id: ${{ secrets.MAESTRO_PROJECT_ID }}
          app-file: ios/build/Build/Products/Debug-iphonesimulator/bwell.app
          env: |
            EMAIL=${{ secrets.MAESTRO_TEST_EMAIL }}
            PASSWORD=${{ secrets.MAESTRO_TEST_PASSWORD }}
```

**Free tier:** ~100 flow runs/month. PR-only trigger keeps usage manageable.

## 6. Render Cold Start Handling

The backend is hosted on Render's free tier, which sleeps after inactivity. First request can take 30-60s for cold start.

**Two-layer mitigation:**
1. **CI warm-up step:** `curl` with retries hits the backend health endpoint before Maestro runs, waking the instance while the app is still building/installing
2. **Generous flow timeouts:** `assertVisible` timeouts set to 60s on steps that depend on API responses (initial app load, post-login navigation). Maestro polls until visible, so this just extends the window — it won't slow down passing tests

Locally this is a non-issue since the backend is typically already warm from development.

## 7. Environment & Credentials

- Passwords are never hardcoded in flow YAML files
- Locally: pass via `maestro test --env EMAIL=patient1@test.com --env PASSWORD=xxx .maestro/flows/`
- CI: injected via GitHub secrets into the Maestro Cloud action
- Backend URL: baked into the `.app` build via `EXPO_PUBLIC_BACKEND_BASE_URL` env var
- Test accounts: `patient1@test.com`, `therapist1@test.com`, `admin1@test.com` (pre-existing on deployed backend)

## 8. Out of Scope

- Additional flows beyond login — added incrementally after this foundation works
- Android Maestro testing — iOS simulator first
- Web E2E — Playwright (already available via MCP) handles web
- Unit/integration tests (Jest) — separate initiative
- EAS Build profiles — local `expo run:ios` for now
- Manual screenshot steps in flows — Maestro Cloud captures screenshots on failure automatically
