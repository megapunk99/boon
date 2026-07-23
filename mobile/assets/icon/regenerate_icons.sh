#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Boon Scanner — App Icon Regeneration Script
# ═══════════════════════════════════════════════════════════════════════════════
# Regenerates all mipmap PNGs from the source icon.
#
# Two methods (in order of preference):
#   1. flutter pub run flutter_launcher_icons  (requires Flutter SDK)
#   2. python generate_icon.py                 (requires Python + Pillow)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "─── Regenerating App Icons ───────────────────────────────────────"

# Method 1: Flutter (preferred)
if command -v flutter &> /dev/null; then
    echo "[1/2] Flutter SDK found — using flutter_launcher_icons..."
    cd "$SCRIPT_DIR/../.."
    flutter pub get 2>/dev/null || true
    flutter pub run flutter_launcher_icons
    echo "[OK] Icons regenerated via Flutter."
    exit 0
fi

# Method 2: Python (fallback)
echo "[1/2] Flutter SDK not available — using Python generator..."
if python3 -c "from PIL import Image; print('ok')" &> /dev/null; then
    python3 generate_icon.py
    echo "[OK] Icons regenerated via Python."
elif python -c "from PIL import Image; print('ok')" &> /dev/null; then
    python generate_icon.py
    echo "[OK] Icons regenerated via Python."
else
    echo "[WARN] Neither Flutter nor Python Pillow available."
    echo "       Skipping icon regeneration — using committed PNGs."
    exit 0
fi
