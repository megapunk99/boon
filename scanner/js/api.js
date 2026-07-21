/**
 * 🌿 Boon Scanner — API Client
 *
 * Handles all communication with the Boon backend system.
 * Falls back gracefully when offline.
 */

const API_BASE = 'http://localhost:8000/api/v1';

/**
 * Generic fetch wrapper with error handling and timeout.
 */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    // Extract only what we need to avoid ...options overwriting headers/signal
    const { headers: optHeaders, body, method } = options;
    
    const res = await fetch(`${API_BASE}${path}`, {
      method,
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

/**
 * Check backend connectivity.
 */
export async function checkConnection() {
  try {
    const data = await apiFetch('/health');
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Generate a QR code for a new waste item.
 */
export async function generateQR(data) {
  return apiFetch('/scanner/generate-qr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log a scanned waste item to the Boon system.
 */
export async function logScan(data) {
  return apiFetch('/scanner/log-scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Verify a barcode/QR code against the Boon system.
 */
export async function verifyBarcode(barcode) {
  return apiFetch(`/scanner/verify/${encodeURIComponent(barcode)}`);
}

/**
 * Get scan history.
 */
export async function getScanHistory(limit = 20, offset = 0) {
  return apiFetch(`/scanner/history?limit=${limit}&offset=${offset}`);
}

/**
 * Get scanner statistics.
 */
export async function getScannerStats() {
  return apiFetch('/scanner/stats');
}

/**
 * Get real Indian BMW data from CPCB.
 */
export async function getRealIndiaData() {
  return apiFetch('/scanner/real-data');
}

/**
 * Get Indian hospitals list.
 */
export async function getIndianHospitals() {
  return apiFetch('/scanner/real-data/hospitals');
}

/**
 * Get segregation guide per BMW Rules 2016.
 */
export async function getSegregationGuide() {
  return apiFetch('/scanner/real-data/segregation-guide');
}

/**
 * Trace a waste item in the main Boon system.
 */
export async function traceWaste(barcode) {
  return apiFetch(`/tracking/trace/${encodeURIComponent(barcode)}`);
}
