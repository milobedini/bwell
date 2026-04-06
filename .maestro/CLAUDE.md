# Maestro E2E Testing

## Flow Architecture

- Top-level flows in `flows/` should be thin orchestrators that compose subflows via `runFlow`
- Reusable sequences (onboarding, login, register) belong in `subflows/`
- This keeps flows DRY and lets future flows reuse common steps (e.g., any flow needing an authenticated user can `runFlow` onboarding + login subflows)

## testID Convention

- Format: `<screen>-<element>-<type>` (e.g., `login-identifier-input`, `signup-unlock-button`)

## Build & Environment

- `npm run build:ios-sim` builds a dev app with `EXPO_PUBLIC_E2E=true` — this suppresses `LogBox` to prevent the debugger banner from blocking Maestro interactions
- `npm run ios`/`npm run android` use `expo run:ios`/`expo run:android` (native builds), same as `build:ios-sim` but without the `EXPO_PUBLIC_E2E=true` flag. For Expo Go dev server, use `npm start`
- Maestro env vars (EMAIL, PASSWORD) live in `.maestro/.env` with `-e KEY=VALUE` format — Maestro reads this via `@.maestro/.env` syntax, NOT from shell env or project `.env`

## Platform Quirks

- `@gorhom/bottom-sheet` requires `accessible={Platform.select({ ios: false })}` on `BottomSheetModal` for Maestro to see child elements on iOS — without this, iOS collapses the entire sheet into one accessibility node
- Maestro `assertVisible` has no `timeout` param — use `extendedWaitUntil` for waits longer than the default 7s
- Prefer tapping the next input to dismiss the keyboard — `hideKeyboard` is unreliable with `BottomSheetTextInput`
- iOS "Save Password?" dialog appears after login — flows dismiss it with a conditional `runFlow` checking for "Not Now"
- `clearState: true` on `launchApp` wipes AsyncStorage, so onboarding runs every time — flows navigate through ready -> carousel -> signup -> login

## CLI Quirks

- `maestro test` does not recurse subdirectories by default — use glob (`flows/**`) or configure `flows:` in `config.yaml`

## CI

- No CI integration yet — Maestro Cloud has no free tier ($250/device/month). E2E runs locally only via `npm run test:e2e`
