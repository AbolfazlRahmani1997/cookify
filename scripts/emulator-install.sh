#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

APK="${1:-$ROOT/dist-android/cookify-debug.apk}"

if [[ ! -f "$APK" ]]; then
  echo "APK not found: $APK" >&2
  echo "Build first with: npm run android:apk" >&2
  exit 1
fi

adb wait-for-device
adb install -r "$APK"
echo "Installed: $APK"
adb shell monkey -p com.cookify.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
