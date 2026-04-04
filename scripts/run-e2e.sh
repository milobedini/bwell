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

# 4. Run Maestro E2E tests (env vars from .maestro/.env)
echo "Running Maestro E2E tests..."
maestro test @"$SCRIPT_DIR/.maestro/.env" "$SCRIPT_DIR/.maestro/flows/**"
