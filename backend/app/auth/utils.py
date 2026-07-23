"""Boon — Auth Utilities.

Password hashing, JWT token management, and RSA key pair generation
for QR digital certificate signing.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from jose import JWTError, jwt

from app.config import settings

# ── Paths for RSA keys ────────────────────────────────────────────────────
KEYS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "keys"
PRIVATE_KEY_PATH = KEYS_DIR / "qr_private.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "qr_public.pem"

# JWT Configuration
JWT_SECRET = os.environ.get("BOON_JWT_SECRET", "boon-dev-secret-change-in-production!!")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7


# ── Password Hashing (bcrypt) ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with a random salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT Token Management ──────────────────────────────────────────────────

def create_access_token(user_id: str, role: str, expires_delta: int | None = None) -> str:
    """Create a JWT access token for the given user."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token (longer-lived)."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns the payload or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# ── RSA Key Pair for QR Digital Signatures ────────────────────────────────

def _ensure_keys_dir():
    """Create the keys directory if it doesn't exist."""
    KEYS_DIR.mkdir(parents=True, exist_ok=True)


def generate_qr_keypair():
    """Generate a new RSA-2048 key pair for QR code digital signatures.
    
    Returns (private_key_pem, public_key_pem).
    Only generates if keys don't already exist.
    """
    _ensure_keys_dir()

    if PRIVATE_KEY_PATH.exists() and PUBLIC_KEY_PATH.exists():
        # Load existing keys
        private_key_pem = PRIVATE_KEY_PATH.read_bytes()
        public_key_pem = PUBLIC_KEY_PATH.read_bytes()
        return private_key_pem, public_key_pem

    # Generate new RSA-2048 key pair
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )

    # Serialize private key (PKCS#8, PEM)
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Serialize public key (SubjectPublicKeyInfo, PEM)
    public_key_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Save to disk
    PRIVATE_KEY_PATH.write_bytes(private_key_pem)
    PUBLIC_KEY_PATH.write_bytes(public_key_pem)

    print(f"[RSA] Generated new RSA-2048 QR signing key pair at {KEYS_DIR}")
    return private_key_pem, public_key_pem


def get_qr_private_key():
    """Load the QR signing private key."""
    _ensure_keys_dir()
    if not PRIVATE_KEY_PATH.exists():
        generate_qr_keypair()
    return serialization.load_pem_private_key(
        PRIVATE_KEY_PATH.read_bytes(),
        password=None,
        backend=default_backend(),
    )


def get_qr_public_key():
    """Load the QR verification public key."""
    _ensure_keys_dir()
    if not PUBLIC_KEY_PATH.exists():
        generate_qr_keypair()
    return serialization.load_pem_public_key(
        PUBLIC_KEY_PATH.read_bytes(),
        backend=default_backend(),
    )


def sign_qr_payload(payload_bytes: bytes) -> str:
    """Sign a QR payload with the server's RSA private key.
    
    Returns a base64-encoded signature string.
    """
    private_key = get_qr_private_key()
    signature = private_key.sign(
        payload_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    import base64
    return base64.b64encode(signature).decode("utf-8")


def verify_qr_signature(payload_bytes: bytes, signature_b64: str) -> bool:
    """Verify an RSA digital signature on a QR payload.
    
    Returns True if the signature is valid (payload authentic and untampered).
    """
    import base64
    try:
        public_key = get_qr_public_key()
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            payload_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False


def get_qr_public_key_pem() -> str:
    """Get the QR public key as a PEM string for Flutter clients."""
    _ensure_keys_dir()
    if not PUBLIC_KEY_PATH.exists():
        generate_qr_keypair()
    return PUBLIC_KEY_PATH.read_text()


# ── Ensure keys exist on import ───────────────────────────────────────────
generate_qr_keypair()
