#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

if ! command -v emulator >/dev/null 2>&1; then
  echo "emulator not found under \$ANDROID_HOME=$ANDROID_HOME" >&2
  exit 1
fi

if ! emulator -list-avds | grep -qx "$AVD_NAME"; then
  echo "AVD '$AVD_NAME' not found. Available:" >&2
  emulator -list-avds >&2 || true
  exit 1
fi

# Already running?
if adb devices 2>/dev/null | grep -qE 'emulator-[0-9]+\s+device'; then
  echo "Emulator already running."
  adb devices
  exit 0
fi

echo "Starting AVD: $AVD_NAME"
nohup emulator -avd "$AVD_NAME" -netdelay none -netspeed full >/tmp/cookify-emulator.log 2>&1 &
echo "emulator pid $!"

echo "Waiting for device boot..."
adb wait-for-device
for i in $(seq 1 120); do
  boot=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  if [[ "$boot" == "1" ]]; then
    echo "Boot completed."
    adb devices
    exit 0
  fi
  sleep 2
done
echo "Timed out waiting for boot. See /tmp/cookify-emulator.log" >&2
exit 1
