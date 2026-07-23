/**
 * 🌿 Boon — Offline Queue Service
 *
 * IndexedDB-backed queue for QR scans captured while offline.
 * Auto-syncs to the backend when connectivity is restored.
 */

const DB_NAME = 'boon-offline'
const DB_VERSION = 1
const STORE_NAME = 'scan-queue'

// ── Types ────────────────────────────────────────────────────────────────

export interface OfflineScan {
  id?: string
  barcode: string
  payload?: any
  scanned_at: string
  created_at: string
  waste_type?: string
  category?: string
  weight_kg?: number
  source_facility?: string
  department?: string
  container_type?: string
  scanned_by?: string
  notes?: string
  gps_lat?: number
  gps_lng?: number
  synced: boolean
  sync_failures: number
}

// ── IndexedDB ────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('synced', 'synced', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
        store.createIndex('barcode', 'barcode', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// ── Queue Operations ─────────────────────────────────────────────────────

export async function enqueueScan(scan: Omit<OfflineScan, 'id' | 'created_at'>): Promise<string> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add({
      ...scan,
      created_at: new Date().toISOString(),
    })

    request.onsuccess = () => resolve(String(request.result))
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getPendingScans(): Promise<OfflineScan[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('synced')
    const request = index.getAll(IDBKeyRange.only(false))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getAllScans(): Promise<OfflineScan[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('created_at')
    const request = index.getAll()

    request.onsuccess = () => {
      const results = request.result as OfflineScan[]
      resolve(results.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function markSynced(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const scan = getRequest.result as OfflineScan
      if (scan) {
        scan.synced = true
        store.put(scan)
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
    tx.oncomplete = () => db.close()
    resolve()
  })
}

export async function incrementSyncFailures(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const scan = getRequest.result as OfflineScan
      if (scan) {
        scan.sync_failures = (scan.sync_failures || 0) + 1
        store.put(scan)
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
    tx.oncomplete = () => db.close()
    resolve()
  })
}

export async function clearQueue(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getUnsyncedCount(): Promise<number> {
  const pending = await getPendingScans()
  return pending.length
}

// ── Sync Service ─────────────────────────────────────────────────────────

export type SyncCallback = (status: {
  type: 'syncing' | 'complete' | 'failed' | 'offline'
  message: string
  count?: number
}) => void

let syncInProgress = false
let syncCallbacks: SyncCallback[] = []

export function onSyncStatus(callback: SyncCallback) {
  syncCallbacks.push(callback)
  return () => {
    syncCallbacks = syncCallbacks.filter(cb => cb !== callback)
  }
}

function notifyCallbacks(status: Parameters<SyncCallback>[0]) {
  syncCallbacks.forEach(cb => cb(status))
}

export async function syncPendingScans(): Promise<{
  synced: number
  failed: number
  errors: string[]
}> {
  if (syncInProgress) return { synced: 0, failed: 0, errors: ['Sync already in progress'] }

  // Check if online
  if (!navigator.onLine) {
    notifyCallbacks({ type: 'offline', message: 'You are offline. Will sync when online.' })
    return { synced: 0, failed: 0, errors: ['Offline'] }
  }

  syncInProgress = true
  notifyCallbacks({ type: 'syncing', message: 'Syncing pending scans...' })

  const { logScan } = await import('./api')
  const pending = await getPendingScans()
  let synced = 0
  let failed = 0
  const errors: string[] = []

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
        gps_lat: scan.gps_lat,
        gps_lng: scan.gps_lng,
      })
      if (scan.id) {
        await markSynced(scan.id)
      }
      synced++
    } catch (err: any) {
      failed++
      if (scan.id) {
        await incrementSyncFailures(scan.id)
      }
      errors.push(err.message || 'Sync failed')
    }
  }

  syncInProgress = false

  if (failed === 0) {
    notifyCallbacks({ type: 'complete', message: `All ${synced} scans synced successfully`, count: synced })
  } else {
    notifyCallbacks({
      type: 'failed',
      message: `${synced} synced, ${failed} failed. Will retry automatically.`,
      count: synced,
    })
  }

  return { synced, failed, errors }
}

// ── Auto-sync on connectivity change ─────────────────────────────────────

export function initAutoSync() {
  window.addEventListener('online', () => {
    console.log('[Boon Offline] Back online — syncing pending scans...')
    syncPendingScans()
  })

  // Also sync periodically every 5 minutes
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingScans()
    }
  }, 5 * 60 * 1000)
}
