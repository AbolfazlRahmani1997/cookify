#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

cd "$ROOT"
npm run build
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon
OUT="$ROOT/dist-android"
mkdir -p "$OUT"
cp -f app/build/outputs/apk/debug/app-debug.apk "$OUT/cookify-debug.apk"
echo "APK ready: $OUT/cookify-debug.apk"
