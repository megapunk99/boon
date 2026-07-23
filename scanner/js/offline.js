/**
 * 🌿 Boon Mobile Scanner — Offline Queue
 *
 * IndexedDB-backed queue for QR scans captured while offline.
 * Auto-syncs to the backend when connectivity is restored.
 * Works alongside the main API module.
 */

const DB_NAME = 'boon-scanner-offline';
const DB_VERSION = 2;
const STORE_NAME = 'scan_queue';

// ── Open Database ────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('barcode', 'barcode', { unique: false });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ── Queue a scan for later sync ──────────────────────────────────────────
async function enqueueScan(scanData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({
      ...scanData,
      created_at: new Date().toISOString(),
      synced: false,
      sync_failures: 0,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Get all pending (unsynced) scans ─────────────────────────────────────
async function getPendingScans() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Get all scans ────────────────────────────────────────────────────────
async function getAllScans() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ── Mark a scan as synced ────────────────────────────────────────────────
async function markSynced(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const scan = getReq.result;
      if (scan) {
        scan.synced = true;
        store.put(scan);
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => { db.close(); resolve(); };
  });
}

// ── Increment sync failure count ─────────────────────────────────────────
async function incrementFailure(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const scan = getReq.result;
      if (scan) {
        scan.sync_failures = (scan.sync_failures || 0) + 1;
        store.put(scan);
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => { db.close(); resolve(); };
  });
}

// ── Get count of pending/unsynced scans ──────────────────────────────────
async function getPendingCount() {
  const pending = await getPendingScans();
  return pending.length;
}

// ── Sync all pending scans to backend ────────────────────────────────────
let syncInProgress = false;

async function syncPendingScans() {
  if (syncInProgress) return { synced: 0, failed: 0, errors: [] };
  if (!navigator.onLine) {
    showToast('📡 Offline — will sync when connected', 'warning');
    return { synced: 0, failed: 0, errors: ['Offline'] };
  }

  syncInProgress = true;
  const pending = await getPendingScans();
  if (pending.length === 0) {
    syncInProgress = false;
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const scan of pending) {
    try {
      await logScan({
        barcode: scan.barcode,
        waste_type: scan.waste_type || 'unknown',
        category: scan.category || 'yellow',
        weight_kg: scan.weight_kg || 1.0,
        source_facility: scan.source_facility || 'Unknown Facility',
        department: scan.department || 'General Ward',
        container_type: scan.container_type || 'bag',
        scanned_by: scan.scanned_by || 'Scanner Operator',
        notes: scan.notes || `Offline scan synced at ${new Date().toISOString()}`,
      });
      await markSynced(scan.id);
      synced++;
    } catch (err) {
      failed++;
      await incrementFailure(scan.id);
      errors.push(err.message || 'Sync failed');
    }
  }

  syncInProgress = false;

  if (failed === 0 && synced > 0) {
    showToast(`✅ Synced ${synced} offline scan(s)`, 'success');
    if (typeof loadHistory === 'function') loadHistory();
  } else if (failed > 0) {
    showToast(`⚠️ Synced ${synced}, ${failed} failed`, 'warning');
  }

  // Update sync badge
  updateSyncBadge();
  return { synced, failed, errors };
}

// ── Update sync badge in UI ──────────────────────────────────────────────
async function updateSyncBadge() {
  const count = await getPendingCount();
  const badge = document.getElementById('sync-btn');
  const syncStatus = document.getElementById('sync-status');
  const historyBadge = document.getElementById('history-badge');

  if (badge) {
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    const text = document.getElementById('sync-btn-text');
    if (text) text.textContent = `⬆️ Sync (${count})`;
  }

  if (syncStatus) {
    if (count > 0) {
      syncStatus.innerHTML = `<span class="sync-badge">⬆️ ${count} pending</span>`;
    } else {
      syncStatus.textContent = '';
    }
  }

  if (historyBadge) {
    if (count > 0) {
      historyBadge.textContent = String(count);
      historyBadge.classList.remove('hidden');
    } else {
      historyBadge.classList.add('hidden');
    }
  }
}

// ── Auto-sync on connectivity change ─────────────────────────────────────
function initAutoSync() {
  window.addEventListener('online', () => {
    showToast('📡 Back online — syncing...', 'info');
    syncPendingScans();
  });

  // Periodic sync
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingScans();
    }
  }, 5 * 60 * 1000);

  // Check on visibility change (user returns to app)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      syncPendingScans();
    }
  });
}

// ── Make sync functions globally accessible ──────────────────────────────
window.enqueueScan = enqueueScan;
window.syncPending = syncPendingScans;
window.getPendingCount = getPendingCount;
window.updateSyncBadge = updateSyncBadge;
