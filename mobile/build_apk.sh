#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Boon Mobile Scanner — APK Build Script
# ═══════════════════════════════════════════════════════════════════
# Requirements:
#   1. Flutter SDK 3.2+ (install from https://docs.flutter.dev/get-started/install)
#   2. Java JDK 17+  (install from https://adoptium.net/)
#   3. Android SDK   (install Android Studio or command-line tools)
#
# Usage:
#   chmod +x build_apk.sh
#   ./build_apk.sh           # Build debug APK
#   ./build_apk.sh release   # Build release APK (requires keystore)
# ═══════════════════════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║    🌿 Boon Mobile Scanner — APK Builder          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check prerequisites ──────────────────────────────────────
echo "🔍 Checking prerequisites..."

# Check Flutter
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter SDK not found!"
    echo "   Install from: https://docs.flutter.dev/get-started/install"
    exit 1
fi
echo "   ✅ Flutter: $(flutter --version 2>/dev/null | head -1)"

# Check Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found!"
    echo "   Install JDK 17+ from: https://adoptium.net/"
    exit 1
fi
JAVA_VER=$(java -version 2>&1 | head -1 | grep -oP '\d+' | head -1)
if [ "$JAVA_VER" -lt 17 ]; then
    echo "❌ Java version $JAVA_VER detected. JDK 17+ required."
    exit 1
fi
echo "   ✅ Java: $(java -version 2>&1 | head -1)"

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  Android SDK not found in environment variables."
    echo "   Set ANDROID_HOME or ANDROID_SDK_ROOT to your SDK path."
    echo "   Continuing anyway — flutter may auto-detect it..."
else
    echo "   ✅ Android SDK: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
fi

echo ""

# ── Step 2: Navigate to the mobile directory ─────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Step 3: Create platform scaffolding if missing ───────────────────
if [ ! -d "android" ]; then
    echo "🏗️  Creating Android platform scaffolding..."
    # Generate platform projects in a temp directory and copy android/ over
    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"
    flutter create --offline --project-name boon_scanner --org com.boon --platforms android .
    cp -r android "$SCRIPT_DIR/"
    cd "$SCRIPT_DIR"
    rm -rf "$TMP_DIR"
    echo "   ✅ Android scaffolding created"
else
    echo "   ✅ Android scaffolding already exists"
fi

# Create empty placeholder directories for any future assets
mkdir -p assets

echo ""

# ── Step 4: Install dependencies ─────────────────────────────────────
echo "📦 Installing Flutter dependencies..."
flutter pub get
echo ""

# ── Step 5: Setup release keystore ───────────────────────────────────
if [ -f "keystore/boon-release-keystore.p12" ]; then
    echo "🔑 Setting up release keystore..."
    bash keystore/setup_keystore.sh
    echo ""
else
    echo "   ℹ️  No keystore found — release builds will use debug signing"
fi

# ── Step 6: Analyze code ─────────────────────────────────────────────
echo "🔎 Analyzing code..."
flutter analyze || echo "   ⚠️  Analysis completed with warnings"
echo ""

# ── Step 7: Determine build mode ─────────────────────────────────────
BUILD_MODE="${1:-debug}"

if [ "$BUILD_MODE" = "release" ]; then
    echo "🏗️  Building RELEASE APK..."
    if [ -f "android/key.properties" ]; then
        echo "   🔐 Signed with release keystore"
    else
        echo "   ⚠️  No keystore — building unsigned (debug signing)"
    fi
    flutter build apk --release
    APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
else
    echo "🏗️  Building DEBUG APK..."
    flutter build apk --debug
    APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"
fi

echo ""

# ── Step 7: Verify build ─────────────────────────────────────────────
if [ -f "$APK_PATH" ]; then
    SIZE=$(stat -c%s "$APK_PATH" 2>/dev/null || stat -f%z "$APK_PATH" 2>/dev/null)
    echo "══════════════════════════════════════════════════"
    echo "  ✅ BUILD SUCCESSFUL!"
    echo "  📱 APK: $APK_PATH"
    echo "  📦 Size: $((SIZE/1024/1024)) MB"
    echo "══════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "  1. Connect your Android phone via USB"
    echo "  2. Enable Developer Options & USB Debugging"
    echo "  3. Install: flutter install"
    echo "  4. Or share the APK file directly"
else
    echo "❌ Build failed — APK not found at $APK_PATH"
    exit 1
fi
