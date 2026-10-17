#!/usr/bin/env bash
# Source this file, or let other scripts source it:
#   source scripts/android-env.sh

export JAVA_HOME="${JAVA_HOME:-/Users/jupiter/.jdks/jdk-21.0.12.1+1/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/Users/jupiter/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-Cookify_API34}"
