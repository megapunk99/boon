/**
 * 🌿 Boon Mobile Scanner — Main Application
 *
 * Ties together camera scanning, manual entry, QR generation,
 * history viewing, and offline support for the mobile PWA.
 */

// ── State ────────────────────────────────────────────────────────────────
window.state = {
  connected: false,
  scanning: false,
  currentTab: 'scan',
  hospitals: [],
  recentScans: [],
  stats: null,
  lastResult: null,
  lastGeneratedQR: null,
  sessionCount: 0,
};

// ── DOM Shortcuts ────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Toast System ─────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = $('toast-container');
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
window.showToast = showToast;

// ── Tab System ───────────────────────────────────────────────────────────
function switchTab(tabId) {
  window.state.currentTab = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
    btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
  });

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
    loadFacilityDropdown('gen-facility');
  }
  if (tabId === 'manual') {
    loadFacilityDropdown('manual-facility');
  }

  // Update FAB visibility
  const fab = $('fab-scan');
  if (fab) {
    fab.classList.toggle('hidden', tabId === 'scan');
  }
}
window.switchTab = switchTab;

// ── Camera Scanner ──────────────────────────────────────────────────────
async function startScanner() {
  const videoEl = $('scanner-video');
  const placeholder = $('scanner-placeholder');
  const frame = $('scanner-frame');
  const loading = $('scanner-loading');
  const statusText = $('scanner-status');

  if (window.state.scanning) return;

  // Check camera availability
  const available = await QRScanner.isCameraAvailable();
  if (!available) {
    placeholder.innerHTML = `
      <div class="placeholder-icon">📱</div>
      <p>No camera found on this device</p>
      <p class="text-xs text-muted mt-1">Use Manual Entry tab instead</p>
    `;
    placeholder.classList.remove('hidden');
    videoEl.classList.add('hidden');
    statusText.textContent = 'No camera available';
    return;
  }

  if (!window.state._scanner) {
    window.state._scanner = new QRScanner({
      videoElement: videoEl,
      onResult: handleScanResult,
      onError: (err) => {
        showToast(err.message, 'warning');
        statusText.textContent = 'Camera error — use manual entry';
        placeholder.classList.remove('hidden');
        videoEl.classList.add('hidden');
        frame.classList.add('hidden');
      },
    });
  }

  if (loading) loading.classList.remove('hidden');
  statusText.textContent = 'Starting camera...';

  const started = await window.state._scanner.start();
  if (loading) loading.classList.add('hidden');

  if (started) {
    window.state.scanning = true;
    placeholder.classList.add('hidden');
    videoEl.classList.remove('hidden');
    frame.classList.remove('hidden');
    statusText.textContent = '📷 Point camera at a QR code';
    showToast('📷 Scanner active', 'success');
    updateScanControls();
  } else {
    placeholder.innerHTML = `
      <div class="placeholder-icon">🚫</div>
      <p>Camera access denied</p>
      <p class="text-xs text-muted mt-1">Grant camera permission and try again</p>
      <button class="btn btn-primary btn-sm mt-2" onclick="startScanner()">Retry</button>
    `;
    placeholder.classList.remove('hidden');
    videoEl.classList.add('hidden');
    statusText.textContent = 'Camera permission denied';
  }
}
window.startScanner = startScanner;

function stopScanner() {
  if (window.state._scanner) {
    window.state._scanner.stop();
  }
  window.state.scanning = false;
  updateScanControls();

  const statusText = $('scanner-status');
  if (statusText) statusText.textContent = 'Scanner stopped';
}
window.stopScanner = stopScanner;

function updateScanControls() {
  const statusText = $('scanner-status');
  if (!statusText) return;

  if (window.state.scanning) {
    statusText.textContent = '📷 Point camera at a QR code';
  } else {
    statusText.textContent = 'Tap start to enable camera';
  }
}

// ── Handle QR Scan Result ────────────────────────────────────────────────
function handleScanResult(result) {
  const parsed = window.state._scanner.parseQRPayload(result.rawValue);
  window.state.lastResult = parsed;
  window.state.sessionCount++;

  // Flash effect
  const flash = document.createElement('div');
  flash.className = 'flash-overlay';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 200);

  showToast(`📸 QR Code: ${parsed.barcode}`, 'success');

  // Auto-log if enabled
  const autoLog = $('auto-log-toggle')?.checked;
  if (autoLog) {
    autoLogScan(parsed);
  }

  // Display result
  displayScanResult(parsed);
  addRecentScan(parsed);

  // Vibrate on mobile
  if (navigator.vibrate) navigator.vibrate(100);
}
window.handleScanResult = handleScanResult;

function displayScanResult(parsed) {
  const resultEl = $('scan-result');
  const content = resultEl.querySelector('.scan-result-content');
  const logBtn = $('log-scan-btn');

  content.innerHTML = `
    <div class="scan-result-item">
      <span class="scan-result-label">Barcode</span>
      <span class="scan-result-value font-mono text-boon">${parsed.barcode}</span>
    </div>
    <div class="scan-result-item">
      <span class="scan-result-label">Category</span>
      <span class="scan-result-value">${parsed.category || 'Unknown'}</span>
    </div>
    <div class="scan-result-item">
      <span class="scan-result-label">Waste Type</span>
      <span class="scan-result-value">${(parsed.wasteType || parsed.raw?.waste_type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}</span>
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

  logBtn.textContent = '📥 Log to System';
  logBtn.disabled = false;
  resultEl.classList.remove('hidden');

  // Scroll to result
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearScanResult() {
  window.state.lastResult = null;
  $('scan-result').classList.add('hidden');
}
window.clearScanResult = clearScanResult;

// ── Auto-log scan ────────────────────────────────────────────────────────
async function autoLogScan(parsed) {
  const barcode = parsed.barcode;
  const payload = parsed.raw || {};

  const logData = {
    barcode: barcode,
    waste_type: payload.waste_type || 'general_biomedical',
    category: payload.category || 'yellow',
    weight_kg: payload.weight_kg || 1.0,
    source_facility: payload.source || payload.source_facility || 'Unknown Facility',
    department: payload.department || 'General Ward',
    container_type: payload.container || 'bag',
    scanned_by: 'Mobile Scanner',
    notes: `Scanned via Boon Mobile Scanner at ${new Date().toISOString()}`,
  };

  try {
    await logScan(logData);
    updateLogButton(true);
    reloadStats();
    showToast(`✅ Logged: ${barcode}`, 'success');
  } catch (err) {
    // Offline — save to queue
    if (!navigator.onLine || err.message?.includes('fetch') || err.message?.includes('Abort')) {
      await enqueueScan(logData);
      updateSyncBadge();
      updateLogButton(true);
      showToast(`📦 Queued for sync: ${barcode}`, 'info');
    } else {
      updateLogButton(false, err.message);
      showToast(`❌ Log failed: ${err.message}`, 'error');
    }
  }
}

// ── Manual log of current scan result ────────────────────────────────────
async function logCurrentScan() {
  const parsed = window.state.lastResult;
  if (!parsed) return;

  const btn = $('log-scan-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Logging...';

  await autoLogScan(parsed);
}
window.logCurrentScan = logCurrentScan;

function updateLogButton(success, errorMsg) {
  const btn = $('log-scan-btn');
  if (!btn) return;
  if (success) {
    btn.textContent = '✅ Logged';
    btn.disabled = true;
  } else {
    btn.textContent = `❌ Failed${errorMsg ? ': ' + errorMsg.slice(0, 30) : ''}`;
    btn.disabled = false;
  }
}

// ── Quick barcode from scan tab ──────────────────────────────────────────
async function handleQuickBarcode() {
  const input = $('quick-barcode-input');
  const barcode = input.value.trim();
  if (!barcode) {
    showToast('Please enter a barcode', 'warning');
    return;
  }
  input.value = '';

  const parsed = {
    barcode: barcode,
    category: 'yellow',
    isBoonQR: false,
    raw: null,
  };
  window.state.lastResult = parsed;
  displayScanResult(parsed);
  addRecentScan(parsed);

  const autoLog = $('auto-log-toggle')?.checked;
  if (autoLog) {
    await autoLogScan(parsed);
  }
}
window.handleQuickBarcode = handleQuickBarcode;

// ── Recent Scans List ────────────────────────────────────────────────────
function addRecentScan(parsed) {
  const list = $('recent-scans');
  const count = $('recent-count');
  if (!list) return;

  // Remove empty state
  const empty = list.querySelector('.empty-state');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'history-item mb-2';
  item.innerHTML = `
    <div class="history-icon" style="background:rgba(16,185,129,0.15);">📷</div>
    <div class="history-info">
      <div class="history-title font-mono">${parsed.barcode}</div>
      <div class="history-meta">
        <span>${parsed.category || 'Unknown'}</span>
        <span class="dot"></span>
        <span>Just now</span>
      </div>
    </div>
  `;
  item.onclick = () => {
    if (parsed.barcode && window.state.connected) {
      window.open(`/sathi?barcode=${parsed.barcode}`, '_blank');
    }
  };

  list.prepend(item);
  window.state.recentScans.unshift(parsed);
  if (list.children.length > 10) list.lastChild.remove();
  if (count) count.textContent = String(list.children.length);
}

// ── Manual Log Submission ────────────────────────────────────────────────
async function handleManualLog() {
  const barcode = $('manual-barcode').value.trim();
  if (!barcode) {
    showToast('Please enter a barcode', 'warning');
    return;
  }

  const btn = $('manual-log-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Logging...';

  const data = {
    barcode: barcode,
    waste_type: $('manual-waste-type').value,
    category: getSelectedCategory('manual'),
    weight_kg: parseFloat($('manual-weight').value) || 1.0,
    source_facility: $('manual-facility').value || 'Unknown Facility',
    department: $('manual-department').value,
    container_type: $('manual-container').value,
    scanned_by: $('manual-scanned-by').value || 'Mobile Scanner',
    notes: $('manual-notes').value || `Manually logged via Boon Mobile Scanner`,
  };

  try {
    await logScan(data);
    showToast(`✅ Logged: ${barcode}`, 'success');
    $('manual-barcode').value = '';
    $('manual-notes').value = '';
    reloadStats();
    if (typeof loadHistory === 'function') loadHistory();
  } catch (err) {
    if (!navigator.onLine || err.message?.includes('fetch') || err.message?.includes('Abort')) {
      await enqueueScan(data);
      updateSyncBadge();
      showToast(`📦 Queued for sync: ${barcode}`, 'info');
    } else {
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  btn.disabled = false;
  btn.innerHTML = '📥 Log to System';
}
window.handleManualLog = handleManualLog;

// ── History ──────────────────────────────────────────────────────────────
async function loadHistory() {
  const list = $('history-list');
  const total = $('history-total');
  if (!list) return;

  list.innerHTML = '<div class="flex justify-center py-8"><span class="loading-spinner lg"></span></div>';

  try {
    const data = await getScanHistory(50, 0);
    const items = data.items || [];

    if (total) total.textContent = `${data.total || items.length} scans`;

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-lg">📋</div>
          <h3>No scans yet</h3>
          <p>Scan a QR code or use manual entry to begin</p>
        </div>
      `;
      return;
    }

    list.innerHTML = items.map(item => {
      const catColor = item.category === 'yellow' ? '#FFD700' :
                       item.category === 'red' ? '#FF4444' :
                       item.category === 'white' ? '#E0E0E0' :
                       item.category === 'blue' ? '#4488FF' : '#666';
      const catEmoji = item.category === 'yellow' ? '🟡' :
                       item.category === 'red' ? '🔴' :
                       item.category === 'white' ? '⚪' :
                       item.category === 'blue' ? '🔵' : '⚪';
      const time = item.scanned_at ? new Date(item.scanned_at).toLocaleString() : '';
      return `
        <div class="history-item mb-2" onclick="window.open('/sathi?barcode=${encodeURIComponent(item.barcode)}','_blank')">
          <div class="history-icon" style="background:${catColor}22;">
            <span style="font-size:16px;">${catEmoji}</span>
          </div>
          <div class="history-info">
            <div class="history-title font-mono">${item.barcode}</div>
            <div class="history-meta">
              <span>${item.source_facility?.slice(0, 20)}</span>
              <span class="dot"></span>
              <span>${(item.waste_type || '').replace(/_/g, ' ').slice(0, 15)}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-bold">${item.weight_kg} kg</span>
            <div class="text-xs text-muted">${time}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-lg">🔌</div>
        <h3>Connection Error</h3>
        <p>Could not load history. Check backend connection.</p>
        <button class="btn btn-primary btn-sm mt-2" onclick="loadHistory()">Retry</button>
      </div>
    `;
  }
}
window.loadHistory = loadHistory;

// ── Stats ────────────────────────────────────────────────────────────────
async function reloadStats() {
  try {
    const data = await getScannerStats();
    window.state.stats = data;
    window.state.connected = true;
    updateConnectionStatus(true);
  } catch {
    window.state.connected = false;
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(connected) {
  const dot = $('status-dot');
  const text = $('status-text');
  if (!dot || !text) return;

  if (connected) {
    dot.className = 'status-dot online';
    text.textContent = 'Connected to Boon';
  } else {
    dot.className = 'status-dot offline';
    text.textContent = 'Offline — scans stored locally';
  }
}

// ── Category Chip Selection ──────────────────────────────────────────────
function getSelectedCategory(prefix) {
  const chips = document.querySelectorAll(`#${prefix}-category-chips .category-chip`);
  const selected = chips.querySelector('.selected');
  return selected ? selected.dataset.cat : 'yellow';
}

function setupCategoryChips(prefix) {
  const chips = document.querySelectorAll(`#${prefix}-category-chips .category-chip`);
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = 'transparent';
      });
      chip.classList.add('selected');
      chip.style.borderColor = '#34d399';
    });
  });
}

// ── Facility Dropdown ────────────────────────────────────────────────────
async function loadFacilityDropdown(selectId) {
  const select = $(selectId);
  if (!select || select.options.length > 1) return;

  try {
    const data = await getIndianHospitals();
    const hospitals = data.hospitals || [];
    hospitals.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.name;
      opt.textContent = `${h.name} (${h.city}, ${h.state})`;
      select.appendChild(opt);
    });
  } catch {
    // Fallback facilities
    const fallback = [
      'AIIMS New Delhi', 'Fortis Memorial Gurugram', 'Apollo Chennai',
      'Tata Memorial Mumbai', 'NIMHANS Bangalore', 'CMC Vellore',
      'PGIMER Chandigarh', 'Medanta Medicity', 'KEM Hospital Mumbai',
      'Sir Ganga Ram Hospital Delhi',
    ];
    fallback.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  }
}

// ── Generate QR Form ────────────────────────────────────────────────────
async function handleGenerateQR(e) {
  e.preventDefault();

  const data = {
    waste_type: $('gen-waste-type').value,
    category: getSelectedCategory('gen'),
    source_facility: $('gen-facility').value,
    department: $('gen-department').value || 'General',
    weight_kg: parseFloat($('gen-weight').value) || 1.0,
    container_type: $('gen-container').value,
    handler_name: $('gen-handler').value || 'Mobile Scanner',
  };

  if (!data.waste_type || !data.category || !data.source_facility) {
    showToast('Please fill in waste type, category, and facility', 'warning');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Generating...';

  try {
    const result = await generateQR(data);
    window.state.lastGeneratedQR = result;

    const display = $('qr-display');
    const img = $('qr-image');
    const info = display.querySelector('.qr-info');

    img.src = result.qr_data_url;
    img.classList.remove('hidden');

    info.innerHTML = `
      <div class="flex items-center gap-2 mt-3">
        <span class="badge badge-green">✅ Generated</span>
        <span class="text-xs text-muted font-mono">${result.barcode}</span>
      </div>
      <div class="data-preview mt-2">
        <dt>Barcode</dt>
        <dd class="font-mono text-boon">${result.barcode}</dd>
        <dt>Category</dt>
        <dd>${data.category}</dd>
        <dt>Waste</dt>
        <dd>${data.waste_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</dd>
        <dt>Weight</dt>
        <dd>${data.weight_kg} kg</dd>
        <dt>Blockchain</dt>
        <dd>${result.blockchain_registered ? '✅ Registered' : '⚠️ Skipped'}</dd>
      </div>
    `;

    display.classList.remove('hidden');
    showToast(`✅ QR Generated: ${result.barcode}`, 'success');

    // Auto-log
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
        notes: 'Generated via Boon Mobile Scanner',
      });
      showToast('✅ Item synced to Boon', 'success');
      reloadStats();
    } catch {
      // OK if auto-log fails
    }
  } catch (err) {
    showToast(err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = originalText;
}
window.handleGenerateQR = handleGenerateQR;

// ── QR Actions ───────────────────────────────────────────────────────────
function handleDownloadQR() {
  if (window.state.lastGeneratedQR) {
    const link = document.createElement('a');
    link.download = `boon-${window.state.lastGeneratedQR.barcode}.png`;
    link.href = window.state.lastGeneratedQR.qr_data_url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ QR code downloaded', 'success');
  }
}
window.handleDownloadQR = handleDownloadQR;

function handlePrintQR() {
  if (!window.state.lastGeneratedQR) return;
  const w = window.open('', '_blank', 'width=400,height=400');
  if (!w) return;
  w.document.write(`
    <!DOCTYPE html><html><head><title>Boon QR Label</title>
    <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#fff;}img{width:220px;height:220px;image-rendering:pixelated;margin:20px;}h3{font-size:16px;color:#333;}.meta{font-size:10px;color:#999;margin-top:8px;}</style></head>
    <body><img src="${window.state.lastGeneratedQR.qr_data_url}" alt="QR"/><h3>${window.state.lastGeneratedQR.barcode}</h3><p class="meta">Boon Biomedical Waste • ${new Date().toLocaleDateString()}</p>
    <script>window.onload=()=>{window.print();window.close()};<\/script></body></html>
  `);
  w.document.close();
}
window.handlePrintQR = handlePrintQR;

// ── Initialization ───────────────────────────────────────────────────────
async function init() {
  showToast('🌿 Boon Scanner loading...', 'info');

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Setup category chips
  setupCategoryChips('manual');
  setupCategoryChips('gen');

  // Manual barcode enter key
  $('manual-barcode')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleManualLog();
  });

  // Quick barcode enter key
  $('quick-barcode-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleQuickBarcode();
  });

  // Generate form submit
  $('generate-form')?.addEventListener('submit', handleGenerateQR);

  // Check backend connectivity
  const isConnected = await checkConnection();
  window.state.connected = isConnected;
  updateConnectionStatus(isConnected);

  // Initial data load
  reloadStats();
  loadFacilityDropdown('manual-facility');
  loadFacilityDropdown('gen-facility');

  // Auto-start scanner if on scan tab
  if (window.state.currentTab === 'scan') {
    startScanner();
  }

  // Check offline queue
  try {
    const count = await getPendingCount();
    if (count > 0) {
      updateSyncBadge();
      showToast(`📦 ${count} offline scan(s) pending sync`, 'info');
      if (navigator.onLine) {
        syncPendingScans();
      }
    }
  } catch {
    // Offline queue not available
  }

  // Initialize auto-sync
  initAutoSync();

  // Periodic connection check
  setInterval(reloadStats, 30000);

  console.log('🌿 Boon Mobile Scanner initialized');
  showToast(isConnected ? '✅ Connected to Boon system' : '📡 Offline mode', isConnected ? 'success' : 'warning');
}

// ── Start ────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
