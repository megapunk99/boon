#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Firebase CI Setup
# ═══════════════════════════════════════════════════════════════════════════════
# This script ensures the Flutter app can build in CI even when Firebase
# is not configured (i.e. no real google-services.json or Firebase project).
#
# When Firebase IS configured, the crash-reporting features work normally.
# When it ISN'T, the CrashlyticsService gracefully falls back to a no-op logger.
#
# Usage:
#   bash firebase_ci_setup.sh            # Auto-detect and prepare
#   bash firebase_ci_setup.sh --force    # Regenerate placeholder files
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "─── Firebase CI Setup ──────────────────────────────────────────"

FORCE=${1:-}

# ── 1. Check whether google-services.json exists ──────────────────────────
if [ -f "android/app/google-services.json" ] && [ -z "$FORCE" ]; then
  echo "[OK] google-services.json found — Firebase is configured."
  echo "     Crashlytics will work in release builds."

  # Apply the Google Services plugin in app/build.gradle if not already applied
  if grep -q "com.google.gms.google-services" android/app/build.gradle; then
    echo "[OK] Google Services plugin already applied in app/build.gradle."
  else
    echo "     Applying Google Services plugin..."
    sed -i 's/id "com.google.gms.google-services" version "4.4.2" apply false/id "com.google.gms.google-services" version "4.4.2"/' android/app/build.gradle
    echo "[OK] Plugin applied."
  fi
else
  echo "[WARN] google-services.json not found — Firebase NOT configured."
  echo "       Crashlytics will fall back to a no-op logger (no crashes reported)."
  echo ""
  echo "       To configure Firebase:"
  echo "         flutterfire configure --project=YOUR_PROJECT_ID"
  echo ""

  # Ensure the Google Services plugin is NOT applied (would cause build error)
  # We use `apply false` so Gradle doesn't fail when google-services.json is missing
  if grep -q 'id "com.google.gms.google-services" version' android/app/build.gradle; then
    # Make sure it says 'apply false'
    if grep -q 'apply false' <(grep 'com.google.gms.google-services' android/app/build.gradle); then
      echo "[OK] Google Services plugin set to apply=false — build will not fail."
    else
      echo "     Setting Google Services plugin to apply=false..."
      sed -i 's/id "com.google.gms.google-services" version "4.4.2"/id "com.google.gms.google-services" version "4.4.2" apply false/' android/app/build.gradle
      echo "[OK] Plugin set to apply=false."
    fi
  fi
fi

echo "────────────────────────────────────────────────────────────────"
echo "Done."
