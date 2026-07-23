#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Boon Scanner — Keystore Setup Script
# ═══════════════════════════════════════════════════════════════════
# Run AFTER `flutter create --platforms android` to configure
# release signing in the generated android/ directory.
#
# Usage:
#   cd mobile/
#   bash keystore/setup_keystore.sh
# ═══════════════════════════════════════════════════════════════════

set -e

KEYSTORE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$KEYSTORE_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "=== Keystore Setup ==="
echo "  Project: $PROJECT_DIR"
echo "  Keystore: $KEYSTORE_DIR"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────
if [ ! -d "android" ]; then
    echo "[FAIL] android/ directory not found."
    echo "       Run 'flutter create --platforms android .' first."
    exit 1
fi

if [ ! -f "$KEYSTORE_DIR/boon-release-keystore.p12" ]; then
    echo "[WARN] Keystore file not found at:"
    echo "       $KEYSTORE_DIR/boon-release-keystore.p12"
    echo "       Run 'bash keystore/generate_keystore.sh' to create it."
    echo "       Falling back to debug signing."
    exit 0
fi

# ── 1. Copy keystore to android/app/ ─────────────────────────────────────
echo "Step 1: Copying keystore to android/app/..."
cp "$KEYSTORE_DIR/boon-release-keystore.p12" android/app/boon-release-keystore.p12
echo "[OK]  Keystore copied"

# ── 2. Copy key.properties to android/ ───────────────────────────────────
echo "Step 2: Copying key.properties to android/..."
cp "$KEYSTORE_DIR/key.properties" android/key.properties
echo "[OK]  key.properties copied"

# ── 3. Patch android/app/build.gradle ────────────────────────────────────
echo "Step 3: Patching android/app/build.gradle for release signing..."

APP_BUILD_GRADLE="android/app/build.gradle"

if grep -q "signingConfigs" "$APP_BUILD_GRADLE" 2>/dev/null; then
    echo "[OK]  signingConfigs already present — skipping patch"
else
    echo "       Appending signingConfigs and release keystore config..."

    # Use Python with a quoted heredoc ('PYEOF') to prevent bash from
    # expanding $ variables inside the Python code.
    export GRADLE_FILE="$APP_BUILD_GRADLE"

    python3 << 'PYEOF'
import os

gradle_file = os.environ['GRADLE_FILE']

with open(gradle_file, 'r') as f:
    content = f.read()

# Add keystore properties loader at the top of the android block
# (after 'apply plugin' lines)
loader = '''
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
'''

if 'def keystoreProperties' not in content:
    content = content.replace(
        "apply plugin: 'kotlin-android'",
        "apply plugin: 'kotlin-android'" + loader
    )
    print("[OK]  Added keystore properties loader")

# Add signingConfigs block before buildTypes
signing_block = '''
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
'''

if 'signingConfigs {' not in content:
    content = content.replace('buildTypes {', signing_block + '\n    buildTypes {')
    print("[OK]  Added signingConfigs.release block")

# Switch release build type from debug to release signing
if 'signingConfigs.debug' in content:
    content = content.replace(
        'signingConfig = signingConfigs.debug',
        'signingConfig = signingConfigs.release'
    )
    print("[OK]  Switched release build type to use release signing config")

with open(gradle_file, 'w') as f:
    f.write(content)

print("[OK]  build.gradle patched successfully")
PYEOF

fi

echo ""
echo "=== Keystore setup complete ==="
echo "  Release APK signing is now configured."
echo "  Run 'flutter build apk --release' to build a signed APK."
echo ""
