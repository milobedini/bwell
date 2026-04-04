#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BE_DIR="$(cd "$(dirname "$0")/../../cbt" && pwd)"
BE_PORT=3000
BE_PID=""

cleanup() {
  if [ -n "$BE_PID" ]; then
    echo "Stopping backend (PID $BE_PID)..."
    kill "$BE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# 1. Ensure backend is running
if curl -s --max-time 2 "http://localhost:$BE_PORT" >/dev/null 2>&1; then
  echo "✓ Backend already running on port $BE_PORT"
else
  if [ ! -d "$BE_DIR" ]; then
    echo "✗ Backend directory not found at $BE_DIR"
    exit 1
  fi
  echo "Starting backend from $BE_DIR..."
  (cd "$BE_DIR" && npm run dev &)
  BE_PID=$!

  # Wait for backend to be ready (up to 30s)
  for i in $(seq 1 30); do
    if curl -s --max-time 2 "http://localhost:$BE_PORT" >/dev/null 2>&1; then
      echo "✓ Backend ready on port $BE_PORT"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "✗ Backend failed to start within 30s"
      exit 1
    fi
    sleep 1
  done
fi

# 2. Kill any existing Metro bundler on 8081
if lsof -ti :8081 >/dev/null 2>&1; then
  echo "Killing existing process on port 8081..."
  lsof -ti :8081 | xargs kill 2>/dev/null || true
  sleep 1
fi

# 3. Build iOS simulator app with E2E flag
echo "Building iOS simulator app..."
EXPO_PUBLIC_E2E=true npx expo run:ios

# 4. Disable iOS password autofill on the simulator to prevent Strong Password dialogs
BOOTED_DEVICE=$(xcrun simctl list devices booted -j | python3 -c "
import json,sys
data=json.load(sys.stdin)
for runtime,devices in data['devices'].items():
    for d in devices:
        if d['state']=='Booted':
            print(d['udid'])
            sys.exit()
" 2>/dev/null)
if [ -n "$BOOTED_DEVICE" ]; then
  PLIST="$HOME/Library/Developer/CoreSimulator/Devices/$BOOTED_DEVICE/data/Library/UserConfigurationProfiles/EffectiveUserSettings.plist"
  if [ -f "$PLIST" ]; then
    plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO "$PLIST"
    echo "✓ Disabled password autofill on simulator $BOOTED_DEVICE"
  fi
fi

# 5. Clean up E2E test users from previous runs
echo "Cleaning up E2E test users..."
curl -s -X DELETE "http://localhost:$BE_PORT/api/test/cleanup" \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-register@test.com"}' || true

# 6. Run Maestro E2E tests (env vars from .maestro/.env)
echo "Running Maestro E2E tests..."
maestro test @"$SCRIPT_DIR/.maestro/.env" "$SCRIPT_DIR/.maestro/flows/**"
