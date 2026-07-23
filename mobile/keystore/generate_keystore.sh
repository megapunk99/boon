#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Boon Scanner — Release Keystore Generator
# ═══════════════════════════════════════════════════════════════════
# Generates a PKCS12 keystore for signing release APK builds.
# Requires OpenSSL or Java keytool.
#
# Usage:
#   bash keystore/generate_keystore.sh
# ═══════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEYSTORE_PATH="$SCRIPT_DIR/boon-release-keystore.p12"

echo "=== Boon Scanner Keystore Generator ==="
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────
if command -v openssl &> /dev/null; then
    echo "[OK]  Found OpenSSL: $(openssl version)"
    GENERATOR="openssl"
elif command -v keytool &> /dev/null; then
    echo "[OK]  Found keytool: $(keytool -version 2>&1 | head -1)"
    GENERATOR="keytool"
else
    echo "[FAIL] Neither OpenSSL nor Java keytool found."
    echo "       Install OpenSSL or JDK 17+ to generate a keystore."
    exit 1
fi

# ── Generate keystore ────────────────────────────────────────────────────
ALIAS="boon"
STORE_PASS="boon2024"
KEY_PASS="boon2024"
VALIDITY_DAYS=10950  # 30 years

if [ "$GENERATOR" = "openssl" ]; then
    echo ""
    echo "Generating RSA 2048-bit key and self-signed certificate..."

    # Create temp files
    TMP_KEY=$(mktemp)
    TMP_CERT=$(mktemp)

    # Use MSYS_NO_PATHCONV for Git Bash on Windows
    MSYS_NO_PATHCONV=1 openssl req \
        -x509 \
        -newkey rsa:2048 \
        -keyout "$TMP_KEY" \
        -out "$TMP_CERT" \
        -days "$VALIDITY_DAYS" \
        -nodes \
        -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=Boon/OU=Dev/CN=Boon Scanner"

    # Package into PKCS12 keystore
    MSYS_NO_PATHCONV=1 openssl pkcs12 \
        -export \
        -in "$TMP_CERT" \
        -inkey "$TMP_KEY" \
        -out "$KEYSTORE_PATH" \
        -name "$ALIAS" \
        -passout "pass:$STORE_PASS"

    # Clean up temp files
    rm -f "$TMP_KEY" "$TMP_CERT"

else
    echo ""
    echo "Generating keystore with keytool..."

    keytool -genkey \
        -v \
        -keystore "$KEYSTORE_PATH" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity "$VALIDITY_DAYS" \
        -storetype PKCS12 \
        -storepass "$STORE_PASS" \
        -keypass "$KEY_PASS" \
        -dname "CN=Boon Scanner, OU=Dev, O=Boon, L=Mumbai, ST=Maharashtra, C=IN"
fi

echo ""
echo "[OK]  Keystore created: $KEYSTORE_PATH"
SIZE=$(stat -c%s "$KEYSTORE_PATH" 2>/dev/null || stat -f%z "$KEYSTORE_PATH" 2>/dev/null || wc -c < "$KEYSTORE_PATH" 2>/dev/null)
echo "      Size: $((SIZE / 1024)) KB"
echo ""
echo "  Alias:      $ALIAS"
echo "  Password:   $STORE_PASS"
echo "  Format:     PKCS12"
echo "  Valid for:  $((VALIDITY_DAYS / 365)) years"
echo ""
echo "==> key.properties has been configured with these credentials."
echo "==> Run 'bash keystore/setup_keystore.sh' to integrate into your build."
echo ""
