/**
 * 🌿 Boon Scanner — Biomedical Waste QR Scanner & Logger
 *
 * Main application module that ties together scanning, QR generation,
 * data logging, and the user interface.
 */

import { checkConnection, logScan, verifyBarcode, getScanHistory, getScannerStats, getIndianHospitals } from './api.js';
import { QRScanner } from './scanner.js';
import { generateWasteQR, downloadQRCode, printQRCode } from './generator.js';

// ── State ────────────────────────────────────────────────────────────────
const state = {
  connected: false,
  scanning: false,
  currentTab: 'scan',
  hospitals: [],
  scanHistory: [],
  stats: null,
  lastResult: null,
  lastGeneratedQR: null,
  scanner: null,
};

// ── DOM References ───────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Toast System ─────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = $('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.prepend(el);
    return el;
  })();

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Tab System ───────────────────────────────────────────────────────────
function switchTab(tabId) {
  state.currentTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // Tab-specific logic
  if (tabId === 'scan') {
    startScanner();
  } else {
    stopScanner();
  }

  if (tabId === 'history') {
    loadHistory();
  }
  if (tabId === 'generate') {
    loadHospitalsDropdown();
  }
}

// ── Camera Scanner ──────────────────────────────────────────────────────
async function startScanner() {
  const videoEl = $('scanner-video');
  const placeholder = $('scanner-placeholder');
  const frame = $('scanner-frame');
  const resultEl = $('scan-result');
  const statusText = $('scanner-status');

  if (state.scanning) return;

  if (!state.scanner) {
    state.scanner = new QRScanner({
      videoElement: videoEl,
      onResult: handleScanResult,
      onError: (err) => {
        showToast(err.message, 'warning');
        statusText.textContent = 'Camera unavailable — use manual entry';
        placeholder.classList.remove('hidden');
        videoEl.classList.add('hidden');
      },
    });
  }

  const available = await QRScanner.isCameraAvailable();
  if (available) {
    const started = await state.scanner.start();
    if (started) {
      state.scanning = true;
      placeholder.classList.add('hidden');
      videoEl.classList.remove('hidden');
      if (frame) frame.classList.remove('hidden');
      statusText.textContent = 'Point camera at a QR code';
      showToast('Camera active — scanning for QR codes', 'success');
    }
  } else {
    placeholder.classList.remove('hidden');
    videoEl.classList.add('hidden');
    statusText.textContent = 'No camera found';
  }
}

function stopScanner() {
  if (state.scanner) {
    state.scanner.stop();
  }
  state.scanning = false;
}

function handleScanResult(result) {
  const parsed = state.scanner.parseQRPayload(result.rawValue);
  
  state.lastResult = parsed;
  showToast(`QR Code detected: ${parsed.barcode}`, 'success');

  // Auto-verify if connected
  if (state.connected) {
    verifyBarcode(parsed.barcode).then(verifyResult => {
      displayScanResult(parsed, verifyResult);
    }).catch(() => {
      displayScanResult(parsed, null);
    });
  } else {
    displayScanResult(parsed, null);
  }

  // Auto-switch to result view or show in modal
  updateRecentScan(parsed);
}

function displayScanResult(parsed, verifyResult) {
  const resultEl = $('scan-result');
  const content = resultEl.querySelector('.scan-result-content');

  const isVerified = verifyResult?.verified;
  const statusBadge = isVerified
    ? '<span class="badge badge-green">✓ Verified in Boon</span>'
    : '<span class="badge badge-yellow">Unverified</span>';

  content.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold">Scan Result</span>
      ${statusBadge}
    </div>
    <div class="scan-result-item">
      <span class="scan-result-label">Barcode</span>
      <span class="scan-result-value font-mono">${parsed.barcode}</span>
    </div>
    <div class="scan-result-item">
      <span class="scan-result-label">Category</span>
      <span class="scan-result-value">${parsed.category || 'Unknown'}</span>
    </div>
    <div class="scan-result-item">
      <span class="scan-result-label">Waste Type</span>
      <span class="scan-result-value">${(parsed.wasteType || parsed.raw?.waste_type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
    </div>
    ${parsed.source ? `<div class="scan-result-item">
      <span class="scan-result-label">Source</span>
      <span class="scan-result-value">${parsed.source}</span>
    </div>` : ''}
    ${parsed.weightKg ? `<div class="scan-result-item">
      <span class="scan-result-label">Weight</span>
      <span class="scan-result-value">${parsed.weightKg} kg</span>
    </div>` : ''}
  `;

  resultEl.classList.remove('hidden');
}

function updateRecentScan(parsed) {
  const list = $('recent-scans');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <div class="history-icon" style="background: rgba(16,185,129,0.15);">
      📷
    </div>
    <div class="history-info">
      <div class="history-title">${parsed.barcode}</div>
      <div class="history-meta">
        <span>${parsed.category || 'Unknown'}</span>
        <span class="dot"></span>
        <span>Just now</span>
      </div>
    </div>
  `;

  list.prepend(item);
  if (list.children.length > 5) {
    list.lastChild.remove();
  }
}

// ── Manual Barcode Entry ────────────────────────────────────────────────
async function handleManualBarcode() {
  const input = $('manual-barcode');
  const barcode = input.value.trim();
  if (!barcode) {
    showToast('Please enter a barcode', 'warning');
    return;
  }

  input.value = '';
  const placeholder = $('scanner-placeholder');

  // Show scanning feedback
  placeholder.classList.remove('hidden');
  placeholder.innerHTML = `
    <div class="loading-spinner lg"></div>
    <p>Verifying barcode...</p>
  `;

  try {
    const result = await verifyBarcode(barcode);
    placeholder.classList.add('hidden');
    handleScanResult({
      rawValue: JSON.stringify({
        barcode,
        type: 'biomedical_waste',
        waste_type: result.waste_type || 'unknown',
        category: result.category || 'unknown',
        source: result.source || 'Unknown',
      }),
    });
  } catch (err) {
    // Unknown barcode — offer to register
    placeholder.innerHTML = `
      <div class="placeholder-icon">❓</div>
      <p>Barcode not found in system</p>
      <button onclick="switchTab('generate')" class="btn btn-primary btn-sm mt-2">
        Register New Item
      </button>
    `;
    showToast('Barcode not found — register as new item', 'warning');
  }
}

// ── QR Code Generation ──────────────────────────────────────────────────
async function handleGenerateQR() {
  const form = $('generate-form');
  const data = {
    waste_type: form.querySelector('#gen-waste-type').value,
    category: form.querySelector('#gen-category').value,
    source_facility: form.querySelector('#gen-facility').value,
    department: form.querySelector('#gen-department').value || 'General',
    weight_kg: parseFloat(form.querySelector('#gen-weight').value) || 1.0,
    container_type: form.querySelector('#gen-container').value,
    handler_name: form.querySelector('#gen-handler').value || 'Scanner Operator',
  };

  if (!data.waste_type || !data.category || !data.source_facility) {
    showToast('Please fill in waste type, category, and facility', 'warning');
    return;
  }

  // Show loading
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating...';

  try {
    const result = await generateWasteQR(data);
    state.lastGeneratedQR = result;

    // Display QR code
    const display = $('qr-display');
    const img = display.querySelector('.qr-image');
    const info = display.querySelector('.qr-info');

    img.src = result.qr_data_url;
    img.classList.remove('hidden');

    info.innerHTML = `
      <div class="flex items-center gap-2 mt-3">
        <span class="badge badge-green">✓ Generated</span>
        <span class="text-xs text-muted font-mono">${result.barcode}</span>
      </div>
      <div class="data-preview mt-2">
        <dt>Barcode</dt>
        <dd class="font-mono">${result.barcode}</dd>
        <dt>Category</dt>
        <dd>${data.category}</dd>
        <dt>Waste</dt>
        <dd>${data.waste_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</dd>
        <dt>Weight</dt>
        <dd>${data.weight_kg} kg</dd>
        <dt>Department</dt>
        <dd>${data.department}</dd>
      </div>
    `;

    display.classList.remove('hidden');
    showToast(`QR Code generated: ${result.barcode}`, 'success');

    // Auto-log to system
    try {
      await logScan({
        barcode: result.barcode,
        waste_type: data.waste_type,
        category: data.category,
        weight_kg: data.weight_kg,
        source_facility: data.source_facility,
        department: data.department,
        container_type: data.container_type,
        scanned_by: data.handler_name,
        notes: 'Generated via Boon Scanner app',
      });
      showToast('Item synced to Boon system ✅', 'success');
      loadStats();
    } catch (err) {
      showToast('QR generated but sync pending — backend may be offline', 'warning');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ── History ─────────────────────────────────────────────────────────────
async function loadHistory() {
  const list = $('history-list');
  if (!list) return;

  list.innerHTML = '<div class="flex justify-center py-8"><span class="loading-spinner lg"></span></div>';

  try {
    const data = await getScanHistory(20, 0);
    state.scanHistory = data.items || [];

    if (state.scanHistory.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No scans yet</h3>
          <p>Scan or generate your first QR code to see history here</p>
        </div>
      `;
      return;
    }

    list.innerHTML = state.scanHistory.map(item => {
      const catColors = { yellow: '#FFD700', red: '#FF4444', white: '#E0E0E0', blue: '#4488FF' };
      const catColor = catColors[item.category] || '#666';
      return `
        <div class="history-item">
          <div class="history-icon" style="background: ${catColor}22;">
            <span style="font-size:14px;">${item.category === 'yellow' ? '🟡' : item.category === 'red' ? '🔴' : item.category === 'white' ? '⚪' : '🔵'}</span>
          </div>
          <div class="history-info">
            <div class="history-title">${item.barcode}</div>
            <div class="history-meta">
              <span>${item.source_facility}</span>
              <span class="dot"></span>
              <span>${item.waste_type.replace(/_/g, ' ').slice(0, 20)}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs text-muted">${item.weight_kg} kg</span>
            <div class="text-xs text-muted mt-1">${new Date(item.scanned_at).toLocaleTimeString()}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔌</div>
        <h3>Connection Error</h3>
        <p>Could not load scan history. Make sure the backend is running.</p>
      </div>
    `;
  }
}

// ── Stats ───────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const data = await getScannerStats();
    state.stats = data;

    $('stat-total').textContent = data.total_scans || 0;
    $('stat-today').textContent = data.today_scans || 0;
    $('stat-weight').textContent = `${data.total_weight_kg || 0} kg`;
    $('stat-barcodes').textContent = data.unique_barcodes || 0;

    // Update connection status
    state.connected = true;
    $('status-dot').className = 'status-dot online';
    $('status-text').textContent = 'Connected to Boon';
  } catch {
    state.connected = false;
    $('status-dot').className = 'status-dot offline';
    $('status-text').textContent = 'Offline — scans stored locally';
  }
}

// ── Hospital Dropdown ───────────────────────────────────────────────────
async function loadHospitalsDropdown() {
  const select = $('gen-facility');
  if (!select || select.options.length > 1) return;

  try {
    const data = await getIndianHospitals();
    state.hospitals = data.hospitals || [];
    state.hospitals.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.name;
      opt.textContent = `${h.name} (${h.city}, ${h.state})`;
      select.appendChild(opt);
    });
  } catch {
    // Use local fallback list
    const fallback = ['AIIMS New Delhi', 'Fortis Memorial Gurugram', 'Apollo Chennai', 'Tata Memorial Mumbai', 'NIMHANS Bangalore', 'CMC Vellore', 'PGIMER Chandigarh', 'Medanta Medicity'];
    fallback.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  }
}

// ── QR Code Actions ─────────────────────────────────────────────────────
window.handlePrintQR = function() {
  if (state.lastGeneratedQR) {
    printQRCode(state.lastGeneratedQR.qr_data_url, state.lastGeneratedQR.barcode);
  }
};

window.handleDownloadQR = function() {
  if (state.lastGeneratedQR) {
    downloadQRCode(state.lastGeneratedQR.qr_data_url, `boon-${state.lastGeneratedQR.barcode}.png`);
    showToast('QR code downloaded', 'success');
  }
};

window.handleManualScan = handleManualBarcode;

/**
 * Set up click handlers on category chips to sync with the hidden select.
 */
function setupCategoryChips() {
  const chips = document.querySelectorAll('.category-chip');
  const select = document.getElementById('gen-category');
  if (!chips.length || !select) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      // Update the hidden select value
      select.value = cat;
      // Update visual state — remove selected from all, add to clicked
      chips.forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = 'transparent';
      });
      chip.classList.add('selected');
      chip.style.borderColor = cat === 'yellow' ? '#34d399' : cat === 'red' ? '#FF4444' : cat === 'white' ? '#94a3b8' : '#4488FF';
    });
  });

  // Filter waste type options by selected category
  const wasteTypeSelect = document.getElementById('gen-waste-type');
  if (select && wasteTypeSelect) {
    const filterByCategory = () => {
      const cat = select.value;
      const optGroups = wasteTypeSelect.querySelectorAll('optgroup');
      optGroups.forEach(group => {
        group.style.display = group.label.toLowerCase().includes(cat) ? '' : 'none';
      });
    };
    select.addEventListener('change', filterByCategory);
    filterByCategory(); // Run on init
  }
}

// ── Initialization ───────────────────────────────────────────────────────
async function init() {
  // Set up tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Initialize category chips
  setupCategoryChips();

  // Manual barcode entry
  $('manual-barcode')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleManualBarcode();
  });

  // Generate form
  $('generate-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenerateQR();
  });

  // Backend health check
  const isConnected = await checkConnection();
  state.connected = isConnected;
  $('status-dot').className = isConnected ? 'status-dot online' : 'status-dot offline';
  $('status-text').textContent = isConnected ? 'Connected to Boon' : 'Offline';

  // Load initial data
  loadStats();
  
  if (state.currentTab === 'scan') {
    startScanner();
  }
  if (state.currentTab === 'generate') {
    loadHospitalsDropdown();
  }

  // Periodic connection check
  setInterval(loadStats, 15000);

  console.log('🌿 Boon Scanner initialized');
  showToast('Boon Scanner ready' + (isConnected ? ' — connected to Boon system' : ' — offline mode'), isConnected ? 'success' : 'warning');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose switchTab globally for inline onclick
window.switchTab = switchTab;
