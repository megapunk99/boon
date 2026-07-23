/**
 * 🌿 Boon Mobile Scanner — API Client
 *
 * Handles all communication with the Boon backend system.
 * Uses relative URLs to work seamlessly from any device on the network.
 * Falls back gracefully when offline.
 */

// Use relative path so it works from any host (phone, localhost, etc.)
const API_BASE = '/api/v1';

// ── Timeout wrapper ──────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const { headers: optHeaders, body, method } = options;

    const res = await fetch(`${API_BASE}${path}`, {
      method: method || 'GET',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...optHeaders,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Health Check ─────────────────────────────────────────────────────────
async function checkConnection() {
  try {
    const data = await apiFetch('/health');
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ── Scanner Endpoints ────────────────────────────────────────────────────
async function getScannerStats() {
  return apiFetch('/scanner/stats');
}

async function getScanHistory(limit = 50, offset = 0) {
  const data = await apiFetch(`/scanner/history?limit=${limit}&offset=${offset}`);
  return data;
}

async function logScan(data) {
  return apiFetch('/scanner/log-scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function verifyBarcode(barcode) {
  return apiFetch(`/scanner/verify/${encodeURIComponent(barcode)}`);
}

async function generateQR(data) {
  return apiFetch('/scanner/generate-qr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function getFacilities() {
  try {
    const data = await apiFetch('/waste/facilities');
    return data.facilities || [];
  } catch {
    return [];
  }
}

async function getIndianHospitals() {
  return apiFetch('/scanner/real-data/hospitals');
}
