"""Boon — QR Digital Certificate Service.

Provides cryptographic signing and verification for QR codes using
RSA-2048 digital signatures (PSS padding + SHA-256).

When a QR code is generated:
  1. The payload is hashed and signed with the server's RSA private key
  2. The signature (base64) is embedded in the QR data
  3. The public key is available at /auth/public-key

When a QR code is scanned (Flutter app):
  1. The app extracts the payload and signature from the QR data
  2. It verifies the signature using the server's public key
  3. If valid = authentic, untampered QR from the Boon system
  4. If invalid = copied/manipulated/fake QR code
"""

import base64
import hashlib
import json
from datetime import datetime

from app.auth.utils import sign_qr_payload, verify_qr_signature


def sign_qr_data(payload: dict) -> dict:
    """Sign a QR payload dict and return the signed version.
    
    Adds three security fields to the payload:
      - qr_signature: RSA digital signature (base64)
      - qr_created_at: ISO timestamp of signing
      - qr_hash: SHA-256 hash of the payload (integrity check)
    
    Returns the enriched payload.
    """
    # Normalize payload for signing
    payload["qr_created_at"] = datetime.now().isoformat()
    
    # Create a canonical JSON string for signing
    payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    payload_bytes = payload_json.encode("utf-8")
    
    # Compute SHA-256 hash for quick integrity check
    payload_hash = hashlib.sha256(payload_bytes).hexdigest()
    payload["qr_hash"] = payload_hash
    
    # RSA sign the payload
    # Re-serialize with the hash included
    payload_json_signed = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    payload_bytes_signed = payload_json_signed.encode("utf-8")
    signature = sign_qr_payload(payload_bytes_signed)
    payload["qr_signature"] = signature
    
    return payload


def verify_qr_data(qr_data: str | dict) -> dict:
    """Verify the authenticity and integrity of a QR code's data.
    
    Args:
        qr_data: Either a JSON string or a parsed dict from a QR code
        
    Returns:
        dict with:
          - verified: True if signature is valid and data is untampered
          - tampered: True if signature is invalid (data was modified)
          - expired: True if QR has expired (older than 365 days)
          - message: Human-readable result
          - payload: The original payload data (if verified)
          - public_key: The public key PEM (for client-side verification)
    """
    # Parse if string
    if isinstance(qr_data, str):
        try:
            payload = json.loads(qr_data)
        except json.JSONDecodeError:
            return {
                "verified": False,
                "tampered": True,
                "expired": False,
                "message": "Invalid QR data: not valid JSON.",
                "payload": None,
            }
    else:
        payload = qr_data
    
    # Check if QR has signature
    signature = payload.pop("qr_signature", None)
    if not signature:
        return {
            "verified": False,
            "tampered": True,
            "expired": False,
            "message": "No digital signature found. This QR is not from the Boon system.",
            "payload": payload,
        }
    
    # Check expiration (1 year)
    created_at_str = payload.get("qr_created_at")
    if created_at_str:
        try:
            created_at = datetime.fromisoformat(created_at_str)
            days_old = (datetime.now() - created_at).days
            if days_old > 365:
                return {
                    "verified": False,
                    "tampered": False,
                    "expired": True,
                    "days_old": days_old,
                    "message": f"QR code has expired ({days_old} days old). Please generate a new one.",
                    "payload": payload,
                }
        except (ValueError, TypeError):
            pass
    
    # Serialize remaining payload for verification
    payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    payload_bytes = payload_json.encode("utf-8")
    
    # Verify the RSA signature
    is_valid = verify_qr_signature(payload_bytes, signature)
    
    if is_valid:
        return {
            "verified": True,
            "tampered": False,
            "expired": False,
            "message": "[OK] QR code verified. Authentic and untampered.",
            "payload": payload,
        }
    else:
        return {
            "verified": False,
            "tampered": True,
            "expired": False,
            "message": "[FAIL] QR code TAMPERED or COPY. The signature does not match the data.",
            "payload": payload,
        }
