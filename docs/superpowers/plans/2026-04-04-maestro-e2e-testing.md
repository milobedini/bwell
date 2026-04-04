# Maestro E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Maestro E2E testing with a login flow, local dev tooling, and Maestro Cloud CI on GitHub Actions.

**Architecture:** Bottom sheet accessibility fix enables Maestro element detection on iOS. testIDs on login flow elements provide stable selectors. Maestro flows live in `.maestro/` with a reusable login subflow. CI uploads a development build to Maestro Cloud via GitHub Actions on PRs.

**Tech Stack:** Maestro CLI, Maestro Cloud, Expo development builds (`expo run:ios`), GitHub Actions, `@gorhom/bottom-sheet` accessibility fix.

---

### Task 1: Add `ios.bundleIdentifier` to `app.config.js`

**Files:**
- Modify: `app.config.js:16-18`

- [ ] **Step 1: Add explicit bundle identifier**

In `app.config.js`, add `bundleIdentifier` to the `ios` config so Maestro flows have a stable `appId`:

```js
ios: {
  supportsTablet: true,
  bundleIdentifier: 'com.milobedini.bwell'
},
```

- [ ] **Step 2: Verify config is valid**

Run: `npx expo config --type public | grep bundleIdentifier`
Expected: `"bundleIdentifier": "com.milobedini.bwell"`

- [ ] **Step 3: Commit**

```bash
git add app.config.js
git commit -m "chore: add explicit ios bundleIdentifier for Maestro E2E"
```

---

### Task 2: Fix bottom sheet accessibility for Maestro on iOS

**Files:**
- Modify: `app/(auth)/login.tsx:1-2` (add `Platform` import)
- Modify: `app/(auth)/login.tsx:75-76` (add `accessible` prop)
- Modify: `app/(auth)/signup.tsx:1-2` (add `Platform` import)
- Modify: `app/(auth)/signup.tsx:82-83` (add `accessible` prop)

- [ ] **Step 1: Fix login.tsx**

Add `Platform` to the existing `react-native` import at line 2:

```tsx
import { Platform, Text } from 'react-native';
```

Add the `accessible` prop to `BottomSheetModal` at line 75:

```tsx
<BottomSheetModal
  ref={bottomSheetModalRef}
  accessible={Platform.select({ ios: false })}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  handleComponent={() => <AuthSheetHandle onPress={hideModal} />}
>
```

- [ ] **Step 2: Fix signup.tsx**

Add `Platform` to the existing `react-native` import at line 2:

```tsx
import { Platform, Text } from 'react-native';
```

Add the `accessible` prop to `BottomSheetModal` at line 82:

```tsx
<BottomSheetModal
  ref={bottomSheetModalRef}
  accessible={Platform.select({ ios: false })}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  handleComponent={() => <AuthSheetHandle onPress={hideModal} />}
>
```

- [ ] **Step 3: Validate**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login.tsx app/(auth)/signup.tsx
git commit -m "fix: set accessible=false on iOS BottomSheetModal for Maestro E2E support"
```

---

### Task 3: Add testIDs to login flow elements

**Files:**
- Modify: `components/auth/AuthVideoBackground.tsx:51` (unlock button)
- Modify: `components/auth/AuthSubmitButton.tsx:4-10,13` (add `testID` prop)
- Modify: `components/auth/AuthLink.tsx:6-8,18-19` (add `testID` prop)
- Modify: `app/(auth)/login.tsx:117-148,156,163` (add testIDs to inputs, button, link)
- Modify: `components/home/HomeScreen.tsx:43` (home screen landmark)

- [ ] **Step 1: Add testID to unlock button in AuthVideoBackground**

In `components/auth/AuthVideoBackground.tsx`, add a `testID` prop to the type and the `Pressable`:

Update the type (line 9-14):

```tsx
type AuthVideoBackgroundProps = {
  videoSource: VideoSource;
  heading: string;
  onUnlock: () => void;
  children: ReactNode;
  testID?: string;
};
```

Update the component signature and Pressable (line 16 and 51):

```tsx
const AuthVideoBackground = ({ videoSource, heading, onUnlock, children, testID }: AuthVideoBackgroundProps) => {
```

```tsx
<Pressable onPress={onUnlock} testID={testID}>
```

- [ ] **Step 2: Add testID prop to AuthSubmitButton**

In `components/auth/AuthSubmitButton.tsx`, add `testID` to the props type and the `Pressable`:

```tsx
type AuthSubmitButtonProps = {
  label: string;
  loadingLabel: string;
  isPending: boolean;
  disabled: boolean;
  onPress: () => void;
  testID?: string;
};

const AuthSubmitButton = ({ label, loadingLabel, isPending, disabled, onPress, testID }: AuthSubmitButtonProps) => (
  <Pressable style={{ marginBottom: 16 }} onPress={onPress} disabled={disabled} testID={testID}>
```

- [ ] **Step 3: Add testID prop to AuthLink**

In `components/auth/AuthLink.tsx`, add `testID` to the props type and the outer `Pressable`:

```tsx
type AuthLinkProps = {
  href: string;
  label: string;
  testID?: string;
};

const AuthLink = ({ href, label, testID }: AuthLinkProps) => (
  <View
    style={{
      alignItems: 'center',
      flexDirection: 'row',
      alignSelf: 'center'
    }}
  >
    <Link href={href as '/(auth)/login'} asChild>
      <Pressable testID={testID}>
```

- [ ] **Step 4: Wire testIDs in login.tsx**

In `app/(auth)/login.tsx`, pass testIDs to all interactive elements:

On the `AuthVideoBackground` (line 74):
```tsx
<AuthVideoBackground videoSource={videoSource} heading={`Keep building \nyour momentum`} onUnlock={showModal} testID="login-unlock-button">
```

On the identifier `BottomSheetTextInput` (line 117-131), add `testID`:
```tsx
<BottomSheetTextInput
  testID="login-identifier-input"
  autoCapitalize="none"
  autoCorrect={false}
  autoFocus
  clearButtonMode="while-editing"
  editable={!isPending}
  placeholder="Email or Username"
  returnKeyType="send"
  placeholderTextColor={'black'}
  onSubmitEditing={() => handleSubmit()}
  value={values.identifier}
  onChangeText={handleChange('identifier')}
  onBlur={handleBlur('identifier')}
  className="h-[64px] rounded border-b-[1px] border-b-black"
/>
```

On the password `BottomSheetTextInput` (line 133-148), add `testID`:
```tsx
<BottomSheetTextInput
  testID="login-password-input"
  autoCapitalize="none"
  autoCorrect={false}
  clearButtonMode="while-editing"
  editable={!isPending}
  enablesReturnKeyAutomatically
  placeholder="Password"
  placeholderTextColor={'black'}
  returnKeyType="send"
  onSubmitEditing={() => handleSubmit()}
  secureTextEntry
  value={values.password}
  onChangeText={handleChange('password')}
  onBlur={handleBlur('password')}
  className="h-[64px] rounded border-b-[1px] border-b-black"
/>
```

On `AuthSubmitButton` (line 156):
```tsx
<AuthSubmitButton
  testID="login-submit-button"
  label="Login"
  loadingLabel="Logging in..."
  isPending={isPending}
  disabled={buttonDisabled}
  onPress={() => handleSubmit()}
/>
```

On `AuthLink` (line 163):
```tsx
<AuthLink href="/(auth)/signup" label="Need an account?" testID="login-signup-link" />
```

- [ ] **Step 5: Add home screen landmark testID**

In `components/home/HomeScreen.tsx`, add `testID="home-screen"` to the outermost `View` (line 43):

```tsx
<View className="flex-1 bg-sway-dark" testID="home-screen">
```

- [ ] **Step 6: Validate**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 7: Commit**

```bash
git add components/auth/AuthVideoBackground.tsx components/auth/AuthSubmitButton.tsx components/auth/AuthLink.tsx app/(auth)/login.tsx components/home/HomeScreen.tsx
git commit -m "feat: add testIDs to login flow elements for Maestro E2E"
```

---

### Task 4: Add `.gitignore` entries for native builds and Maestro

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add ios/ and android/ to .gitignore**

Append to the end of `.gitignore`:

```
# Native builds (generated by expo run:ios / expo run:android)
ios/
android/

# Maestro test output
.maestro/test_output/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore native build dirs and Maestro test output"
```

---

### Task 5: Create Maestro config and login flow

**Files:**
- Create: `.maestro/config.yaml`
- Create: `.maestro/flows/auth/login.yaml`
- Create: `.maestro/subflows/login.yaml`

- [ ] **Step 1: Create workspace config**

Create `.maestro/config.yaml`:

```yaml
flows:
  - "flows/**"
executionOrder:
  continueOnFailure: false
platform:
  ios:
    disableAnimations: true
```

- [ ] **Step 2: Create login flow test**

Create `.maestro/flows/auth/login.yaml`:

```yaml
appId: com.milobedini.bwell
tags:
  - smoke
  - auth
env:
  EMAIL: ${EMAIL}
  PASSWORD: ${PASSWORD}
---
# Launch fresh — clears persisted auth state
- launchApp:
    clearState: true

# Wait for welcome screen (generous timeout for Render cold start)
- assertVisible:
    id: "login-unlock-button"
    timeout: 60000

# Open login bottom sheet
- tapOn:
    id: "login-unlock-button"
- waitForAnimationToEnd

# Fill credentials
- tapOn:
    id: "login-identifier-input"
- inputText: ${EMAIL}
- hideKeyboard
- tapOn:
    id: "login-password-input"
- inputText: ${PASSWORD}
- hideKeyboard

# Submit and verify login succeeded
- tapOn:
    id: "login-submit-button"
- assertVisible:
    id: "home-screen"
    timeout: 60000
```

- [ ] **Step 3: Create reusable login subflow**

Create `.maestro/subflows/login.yaml`:

```yaml
appId: com.milobedini.bwell
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

- [ ] **Step 4: Commit**

```bash
git add .maestro/
git commit -m "feat: add Maestro config, login flow, and reusable login subflow"
```

---

### Task 6: Add npm scripts for E2E testing

**Files:**
- Modify: `package.json:6-26` (scripts section)

- [ ] **Step 1: Add E2E scripts**

Add these three scripts to the `scripts` object in `package.json`, after the existing `update-types` script:

```json
"build:ios-sim": "npx expo run:ios",
"test:e2e": "maestro test .maestro/flows/",
"test:e2e:studio": "maestro studio"
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "require('./package.json')"`
Expected: No errors (valid JSON).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm scripts for Maestro E2E testing"
```

---

### Task 7: Create GitHub Actions workflow for Maestro Cloud

**Files:**
- Create: `.github/workflows/maestro-e2e.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/maestro-e2e.yml`:

```yaml
name: Maestro E2E

on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: macos-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build iOS simulator app
        env:
          EXPO_PUBLIC_BACKEND_BASE_URL: ${{ secrets.EXPO_PUBLIC_BACKEND_BASE_URL }}
        run: npx expo run:ios --no-install

      - name: Wake backend (Render free tier cold start)
        run: |
          curl -sf --retry 5 --retry-delay 10 --retry-all-errors \
            "${{ secrets.EXPO_PUBLIC_BACKEND_BASE_URL }}/health" \
            || echo "Backend warm-up attempted"

      - name: Run Maestro Cloud tests
        uses: mobile-dev-inc/action-maestro-cloud@v2
        with:
          api-key: ${{ secrets.MAESTRO_API_KEY }}
          project-id: ${{ secrets.MAESTRO_PROJECT_ID }}
          app-file: ios/build/Build/Products/Debug-iphonesimulator/bwell.app
          env: |
            EMAIL=${{ secrets.MAESTRO_TEST_EMAIL }}
            PASSWORD=${{ secrets.MAESTRO_TEST_PASSWORD }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/maestro-e2e.yml
git commit -m "ci: add Maestro Cloud E2E workflow for PRs"
```

---

### Task 8: Install Maestro CLI and verify locally

This task is manual / interactive — it validates the full local setup works end-to-end.

- [ ] **Step 1: Install Maestro CLI**

Run: `curl -Ls "https://get.maestro.mobile.dev" | bash`

Then verify: `maestro --version`
Expected: A version number (e.g., `1.39.x` or later).

- [ ] **Step 2: Build the development app for iOS simulator**

Run: `npm run build:ios-sim`

This will take several minutes on first run. It compiles native code and installs the app on the booted iOS simulator. If no simulator is booted, Expo will boot one automatically.

Expected: Build succeeds, app launches on simulator.

- [ ] **Step 3: Run the login flow**

Run: `maestro test --env EMAIL=patient1@test.com --env PASSWORD=<actual-password> .maestro/flows/auth/login.yaml`

Expected: Flow runs — app launches, bottom sheet opens, credentials are filled, login succeeds, home screen is visible. Test reports PASSED.

If the flow fails:
- Check `maestro studio` to inspect the element hierarchy and verify testIDs are visible
- If elements inside the bottom sheet are not visible, verify the `accessible` prop fix from Task 2 is applied
- If the app doesn't launch, verify the `bundleIdentifier` matches the `appId` in the flow YAML

- [ ] **Step 4: Run Maestro Studio for debugging (optional)**

Run: `npm run test:e2e:studio`

This opens an interactive browser-based tool. Click on elements to see their testIDs and build flow steps visually. Use this to debug any selector issues.

---

### Task 9: Configure GitHub secrets

This task is manual — done in the GitHub repository settings UI.

- [ ] **Step 1: Create Maestro Cloud account**

Go to [https://cloud.maestro.dev](https://cloud.maestro.dev) and sign up. Create a project for bwell. Note the API key and project ID.

- [ ] **Step 2: Add secrets to GitHub repository**

In the GitHub repo settings (Settings > Secrets and variables > Actions), add:

| Secret name | Value |
|-------------|-------|
| `MAESTRO_API_KEY` | From Maestro Cloud dashboard |
| `MAESTRO_PROJECT_ID` | From Maestro Cloud dashboard |
| `MAESTRO_TEST_EMAIL` | `patient1@test.com` |
| `MAESTRO_TEST_PASSWORD` | The password for the test account |
| `EXPO_PUBLIC_BACKEND_BASE_URL` | Your deployed Render backend URL (e.g., `https://your-app.onrender.com/api`) |

- [ ] **Step 3: Verify by opening a PR**

Create a test branch, push it, and open a PR against `main`. The Maestro E2E workflow should trigger. Check the Actions tab for the workflow run and the Maestro Cloud dashboard for test results.
