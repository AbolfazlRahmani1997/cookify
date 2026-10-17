#!/usr/bin/env bash
# Point the Android WebView at Vite on the Mac (emulator host alias 10.0.2.2).
# Requires: npm run dev (or vite --host) already listening on :5173
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

export CAP_SERVER_URL="${CAP_SERVER_URL:-http://10.0.2.2:5173}"

if ! curl -sf --max-time 2 "http://127.0.0.1:5173/" >/dev/null; then
  echo "Vite is not running on :5173. Start it first:" >&2
  echo "  npm run dev" >&2
  exit 1
fi

cd "$ROOT"
# dist must exist for cap sync even when server.url is used
if [[ ! -d dist ]]; then
  npm run build
fi

npx cap sync android
cd android
./gradlew assembleDebug --no-daemon
mkdir -p "$ROOT/dist-android"
cp -f app/build/outputs/apk/debug/app-debug.apk "$ROOT/dist-android/cookify-debug.apk"
adb wait-for-device
adb install -r "$ROOT/dist-android/cookify-debug.apk"
adb shell am force-stop com.cookify.app
adb shell am start -n com.cookify.app/.MainActivity
echo "Live URL: $CAP_SERVER_URL"
echo "App launched against Vite — keep 'npm run dev' running."
