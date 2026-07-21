/// <reference types="vite/client" />

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Dashboard ───────────────────────────────────────────────────────────
export async function getDashboardStats() {
  return fetchJson<any>('/analytics/dashboard');
}

export async function getGenerationSummary() {
  return fetchJson<any>('/analytics/generation');
}

// ── Waste Items ─────────────────────────────────────────────────────────
export async function getWasteItems(params?: {
  category?: string;
  status?: string;
  facility?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.status) search.set('status', params.status);
  if (params?.facility) search.set('facility', params.facility);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  return fetchJson<any>(`/waste/items?${search}`);
}

export async function getWasteItem(id: string) {
  return fetchJson<any>(`/waste/items/${id}`);
}

export async function getWasteCategories() {
  return fetchJson<any>('/waste/categories');
}

// ── Facilities ──────────────────────────────────────────────────────────
export async function getFacilities() {
  const data = await fetchJson<any>('/waste/facilities');
  return data.facilities;
}

export async function getFacilitySummaries() {
  const data = await fetchJson<any>('/analytics/facilities');
  return data.facilities;
}

// ── Alerts & Routes ─────────────────────────────────────────────────────
export async function getAlerts(resolved?: boolean) {
  const search = resolved !== undefined ? `?resolved=${resolved}` : '';
  const data = await fetchJson<any>(`/waste/alerts${search}`);
  return data.alerts;
}

export async function getRoutes() {
  const data = await fetchJson<any>('/waste/routes');
  return data.routes;
}

// ── Classification ──────────────────────────────────────────────────────
export async function classifyWaste(wasteType: string, imageB64?: string) {
  return fetchJson<any>('/classify/', {
    method: 'POST',
    body: JSON.stringify({ waste_type: wasteType, image_b64: imageB64 || null }),
  });
}

export async function getClassificationCategories() {
  const data = await fetchJson<any>('/classify/categories');
  return data.categories;
}

export async function getTreatmentGuide(category: string) {
  return fetchJson<any>(`/classify/guide/${category}`);
}

// ── Tracking ────────────────────────────────────────────────────────────
export async function traceWaste(barcode: string) {
  return fetchJson<any>(`/tracking/trace/${encodeURIComponent(barcode)}`);
}

export async function getLiveTracking() {
  return fetchJson<any>('/tracking/live');
}

export async function getTrackingStatistics() {
  return fetchJson<any>('/tracking/statistics');
}

// ── Analytics & Predictions ─────────────────────────────────────────────
export async function getPredictions(facilityId: string, days = 7) {
  const data = await fetchJson<any>(
    `/analytics/predictions?facility_id=${facilityId}&days=${days}`
  );
  return data.predictions;
}

export async function getComplianceReport(facility?: string) {
  const search = facility ? `?facility=${encodeURIComponent(facility)}` : '';
  return fetchJson<any>(`/analytics/compliance-report${search}`);
}

// ── ML Models ───────────────────────────────────────────────────────────
export async function getClassifierInfo() {
  return fetchJson<any>('/ml/classifier/info');
}

export async function getPredictorInfo() {
  return fetchJson<any>('/ml/predictor/info');
}

export async function getForecast(
  facility: string,
  dailyKg: number,
  days = 7
) {
  return fetchJson<any>(
    `/ml/predictor/forecast?facility=${encodeURIComponent(facility)}&daily_kg=${dailyKg}&days=${days}`
  );
}

// ── Scanner / QR Code ────────────────────────────────────────────────────
export async function getScannerStats() {
  return fetchJson<any>('/scanner/stats');
}

export async function getScanHistory(limit = 20, offset = 0) {
  const data = await fetchJson<any>(`/scanner/history?limit=${limit}&offset=${offset}`);
  return data;
}

export async function generateQR(data: any) {
  return fetchJson<any>('/scanner/generate-qr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logScan(data: any) {
  return fetchJson<any>('/scanner/log-scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyScannerBarcode(barcode: string) {
  return fetchJson<any>(`/scanner/verify/${encodeURIComponent(barcode)}`);
}

// ── Sāthī Network ────────────────────────────────────────────────────────
export async function getSathiDashboard() {
  return fetchJson<any>('/sathi/dashboard');
}

export async function getBlockchainStats() {
  return fetchJson<any>('/sathi/explorer/stats');
}

export async function searchBlockchain(query: string) {
  return fetchJson<any>(`/sathi/explorer/search?query=${encodeURIComponent(query)}`);
}

export async function exploreChain(barcode: string) {
  return fetchJson<any>(`/sathi/explorer/chain/${encodeURIComponent(barcode)}`);
}

export async function recordHandoff(data: any) {
  return fetchJson<any>('/sathi/handoff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getComplianceOverview() {
  return fetchJson<any>('/sathi/compliance/overview');
}

export async function getFacilityCompliance(facilityId: string) {
  return fetchJson<any>(`/sathi/compliance/facility/${facilityId}`);
}

export async function runAIEnforcement(barcode: string) {
  return fetchJson<any>(`/sathi/ai/enforce?barcode=${encodeURIComponent(barcode)}`, {
    method: 'POST',
  });
}

export async function getMarketplace() {
  return fetchJson<any>('/sathi/marketplace');
}

export async function createMarketplaceListing(data: any) {
  return fetchJson<any>('/sathi/marketplace/list', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function generateCPCBReport(facilityId: string, month?: string) {
  const params = new URLSearchParams({ facility_id: facilityId });
  if (month) params.set('month', month);
  return fetchJson<any>(`/sathi/report/generate?${params}`);
}
