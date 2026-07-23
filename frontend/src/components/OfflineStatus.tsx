import { useEffect, useState } from 'react'
import { WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageProvider'
import { getUnsyncedCount, syncPendingScans, initAutoSync, onSyncStatus } from '../services/offline'

type SyncState = 'idle' | 'offline' | 'syncing' | 'complete' | 'failed'

export default function OfflineStatus() {
  const { t } = useLanguage()
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Initialize auto-sync
    initAutoSync()

    // Update pending count
    const updateCount = async () => {
      const count = await getUnsyncedCount()
      setPendingCount(count)
    }
    updateCount()

    // Listen for sync status
    const unsub = onSyncStatus((status) => {
      switch (status.type) {
        case 'syncing':
          setSyncState('syncing')
          break
        case 'complete':
          setSyncState('complete')
          setPendingCount(0)
          setTimeout(() => setSyncState('idle'), 3000)
          break
        case 'failed':
          setSyncState('failed')
          setTimeout(() => setSyncState('idle'), 5000)
          break
        case 'offline':
          setSyncState('offline')
          break
      }
    })

    // Online/offline events
    const goOnline = async () => {
      setOnline(true)
      const count = await getUnsyncedCount()
      if (count > 0) {
        syncPendingScans()
      }
      setTimeout(() => setOnline(true), 100)
    }
    const goOffline = () => {
      setOnline(false)
      setSyncState('offline')
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    // Periodic count update
    const interval = setInterval(async () => {
      const count = await getUnsyncedCount()
      setPendingCount(count)
    }, 10000)

    return () => {
      unsub()
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    if (!navigator.onLine) return
    setSyncState('syncing')
    await syncPendingScans()
  }

  if (dismissed && online && pendingCount === 0) return null

  return (
    <div className={`fixed bottom-4 left-4 z-40 ${syncState === 'syncing' || pendingCount > 0 || !online ? 'animate-in' : ''}`}>
      {/* Offline Banner */}
      {!online && (
        <div className="card p-3 border-yellow-500/30 bg-yellow-500/5 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-xs text-yellow-300">{t('offline.you_are_offline')}</span>
          <button onClick={() => setDismissed(true)} className="ml-2 p-0.5 rounded hover:bg-yellow-500/10">
            <X className="w-3 h-3 text-yellow-400" />
          </button>
        </div>
      )}

      {/* Sync Status */}
      {syncState === 'syncing' && (
        <div className="card p-3 border-blue-500/30 bg-blue-500/5 flex items-center gap-2 mt-2">
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
          <span className="text-xs text-blue-300">{t('offline.syncing')}</span>
        </div>
      )}

      {syncState === 'complete' && (
        <div className="card p-3 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2 mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300">{t('offline.sync_complete')}</span>
        </div>
      )}

      {syncState === 'failed' && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center gap-2 mt-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300" onClick={handleSync}>{t('offline.sync_failed')}</span>
          <button onClick={handleSync} className="ml-auto text-[10px] text-red-400 hover:text-red-300 underline">
            Retry
          </button>
        </div>
      )}

      {/* Pending Sync Count */}
      {online && pendingCount > 0 && syncState === 'idle' && (
        <div className="card p-3 border-gray-700/50 bg-gray-900/95 backdrop-blur-sm flex items-center gap-2 mt-2">
          <CloudOff className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-300">{t('offline.pending_sync', { count: pendingCount })}</span>
          <button
            onClick={handleSync}
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-all"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Sync
          </button>
        </div>
      )}

      {/* Online indicator */}
      {online && pendingCount === 0 && syncState === 'idle' && !dismissed && (
        <button
          onClick={() => setDismissed(true)}
          className="card p-2 border-gray-700/30 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity mt-2"
        >
          <Cloud className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-gray-500">{t('offline.app_ready_offline')}</span>
        </button>
      )}
    </div>
  )
}
