import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Camera, ScanLine, QrCode, History, CheckCircle2, AlertTriangle,
  Weight, Hash, Clock, ArrowRight, FileText,
  Sparkles, Link2, Search, X, RefreshCw, Zap, Smartphone,
  CameraOff,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import * as api from '../services/api'
import { enqueueScan } from '../services/offline'

// ── Types ────────────────────────────────────────────────────────────────
interface ScanResult {
  barcode: string
  payload?: any
  scanned_at: string
  logged?: boolean
  log_error?: string
}

interface LogFormData {
  barcode: string
  waste_type: string
  category: string
  weight_kg: number
  source_facility: string
  department: string
  container_type: string
  scanned_by: string
  notes: string
}

const DEPARTMENTS = [
  'Emergency', 'ICU', 'Operation Theater', 'General Ward',
  'Maternity', 'Pediatrics', 'Pathology Lab', 'Radiology', 'Outpatient', 'Pharmacy',
]

const CONTAINERS = [
  { value: 'bag', label: 'Plastic Bag' },
  { value: 'bin', label: 'Waste Bin' },
  { value: 'container', label: 'Container' },
  { value: 'box', label: 'Cardboard Box' },
  { value: 'sharps_container', label: 'Sharps Container' },
]

const WASTE_CATEGORIES = ['yellow', 'red', 'white', 'blue']

const CATEGORY_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  yellow: { color: '#92400E', bg: '#FEF3C7', dot: '#FFD700' },
  red: { color: '#991B1B', bg: '#FEE2E2', dot: '#FF4444' },
  white: { color: '#1F2937', bg: '#F3F4F6', dot: '#E0E0E0' },
  blue: { color: '#1E40AF', bg: '#DBEAFE', dot: '#4488FF' },
}

// ── Component ────────────────────────────────────────────────────────────
export default function ScannerApp() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual' | 'history'>('scanner')
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [autoLog, setAutoLog] = useState(true)
  const [facilities, setFacilities] = useState<string[]>([])
  const [scanCount, setScanCount] = useState(0)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const hasScannedRef = useRef(false)

  // Manual form state
  const [form, setForm] = useState<LogFormData>({
    barcode: '', waste_type: '', category: 'yellow',
    weight_kg: 1.0, source_facility: '', department: 'Emergency',
    container_type: 'bag', scanned_by: 'Scanner Operator', notes: '',
  })

  // ── Load initial data ────────────────────────────────────────────────
  useEffect(() => {
    api.getFacilities().then((facs: any[]) => {
      setFacilities(facs.map((f: any) => f.name))
    }).catch(() => {
      setFacilities(['AIIMS New Delhi', 'Fortis Memorial Gurugram', 'Apollo Chennai',
        'Tata Memorial Mumbai', 'NIMHANS Bangalore', 'CMC Vellore',
        'PGIMER Chandigarh', 'Medanta Medicity'])
    })
    api.getScannerStats().then(setStats).catch(() => {})
    api.getScanHistory().then((d: any) => setScanHistory(d.items || [])).catch(() => {})

    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
          scannerRef.current.clear()
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  // ── Refresh data ─────────────────────────────────────────────────────
  const refreshData = useCallback(() => {
    api.getScannerStats().then(setStats).catch(() => {})
    api.getScanHistory().then((d: any) => setScanHistory(d.items || [])).catch(() => {})
  }, [])

  // ── Start camera scanner ──────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setError(null)
    setLastScan(null)
    hasScannedRef.current = false

    // Check camera permissions before initializing scanner
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(track => track.stop())
    } catch (err: any) {
      setError(`Camera access denied. ${err.message || 'Please grant camera permissions and try again.'}`)
      return
    }

    try {
      const scanner = new Html5Qrcode('scanner-viewfinder')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // Debounce: prevent rapid re-scans of the same code
          if (hasScannedRef.current) return
          hasScannedRef.current = true

          const barcode = decodedText.trim()
          const scanEntry: ScanResult = {
            barcode,
            scanned_at: new Date().toISOString(),
          }

          // Try to parse QR payload if it's JSON
          try {
            scanEntry.payload = JSON.parse(barcode)
          } catch {
            // Not JSON, use raw barcode string
          }

          setLastScan(scanEntry)
          setScanCount(prev => prev + 1)

          // Auto-log to system if enabled
          if (autoLog) {
            try {
              const payload = scanEntry.payload || {}
              const logData = {
                barcode: payload.barcode || barcode,
                waste_type: payload.waste_type || form.waste_type || 'unknown',
                category: payload.category || form.category || 'yellow',
                weight_kg: payload.weight_kg || form.weight_kg || 1.0,
                source_facility: payload.source || payload.source_facility || form.source_facility || 'Unknown Facility',
                department: payload.department || form.department || 'General Ward',
                container_type: payload.container || form.container_type || 'bag',
                scanned_by: form.scanned_by || 'Scanner Operator',
                notes: `Scanned via Boon Camera Scanner: ${payload.barcode || barcode}`,
              }
              try {
                await api.logScan(logData)
                scanEntry.logged = true
                refreshData()
                setSuccessMessage(`✓ Scanned & logged: ${logData.barcode}`)
                setTimeout(() => setSuccessMessage(null), 3000)
              } catch (apiErr: any) {
                // If backend is unreachable, save to offline queue
                if (!navigator.onLine || apiErr.message?.includes('fetch')) {
                  await enqueueScan({
                    barcode: logData.barcode,
                    waste_type: logData.waste_type,
                    category: logData.category,
                    weight_kg: logData.weight_kg,
                    source_facility: logData.source_facility,
                    department: logData.department,
                    container_type: logData.container_type,
                    scanned_by: logData.scanned_by,
                    notes: logData.notes + ' (scanned offline, queued for sync)',
                    scanned_at: new Date().toISOString(),
                    synced: false,
                    sync_failures: 0,
                  })
                  scanEntry.logged = true
                  setSuccessMessage(`✓ Queued for sync: ${logData.barcode}`)
                  setTimeout(() => setSuccessMessage(null), 4000)
                } else {
                  throw apiErr
                }
              }
            } catch (err: any) {
              scanEntry.logged = false
              scanEntry.log_error = err.message
            }
          }

          // Allow re-scanning after 2s cooldown
          setTimeout(() => {
            hasScannedRef.current = false
          }, 2000)
        },
        () => {
          // No QR found in this frame — ignore silently
        },
      )

      setScanning(true)
    } catch (err: any) {
      setError(`Failed to start scanner: ${err.message || 'Camera error'}`)
      setScanning(false)
    }
  }, [autoLog, form, refreshData])

  // ── Stop camera scanner ───────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
    } catch {
      // Ignore stop errors
    }
    scannerRef.current = null
    setScanning(false)
  }, [])

  // ── Log scan manually ─────────────────────────────────────────────────
  const handleManualLog = useCallback(async () => {
    if (!form.barcode.trim()) {
      setError('Please enter a barcode')
      return
    }
    setLoading(true)
    setError(null)
    try {
      try {
        await api.logScan({
          barcode: form.barcode.trim(),
          waste_type: form.waste_type || 'unknown',
          category: form.category,
          weight_kg: form.weight_kg,
          source_facility: form.source_facility || 'Unknown Facility',
          department: form.department,
          container_type: form.container_type,
          scanned_by: form.scanned_by,
          notes: form.notes || 'Manually entered via Boon Scanner',
        })
        setSuccessMessage(`✓ Logged: ${form.barcode.trim()}`)
        refreshData()
      } catch (apiErr: any) {
        // If offline, save to queue
        if (!navigator.onLine || apiErr.message?.includes('fetch')) {
          await enqueueScan({
            barcode: form.barcode.trim(),
            waste_type: form.waste_type || 'unknown',
            category: form.category,
            weight_kg: form.weight_kg,
            source_facility: form.source_facility || 'Unknown Facility',
            department: form.department,
            container_type: form.container_type,
            scanned_by: form.scanned_by,
            notes: (form.notes || 'Manually entered via Boon Scanner') + ' (queued offline)',
            scanned_at: new Date().toISOString(),
            synced: false,
            sync_failures: 0,
          })
          setSuccessMessage(`✓ Queued offline: ${form.barcode.trim()}`)
          refreshData()
        } else {
          throw apiErr
        }
      }
      setTimeout(() => setSuccessMessage(null), 3000)
      setForm(f => ({ ...f, barcode: '', notes: '' }))
    } catch (err: any) {
      setError(err.message || 'Failed to log scan')
    } finally {
      setLoading(false)
    }
  }, [form, refreshData])

  // ── Clear last scan ───────────────────────────────────────────────────
  const clearLastScan = useCallback(() => {
    setLastScan(null)
    hasScannedRef.current = false
  }, [])

  // ── Format barcode for display ────────────────────────────────────────
  const formatBarcode = (barcode: string) => {
    if (barcode.length > 30) return barcode.slice(0, 27) + '...'
    return barcode
  }

  return (
    <div className="space-y-6 animate-in">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 border border-emerald-900/30 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Code Scanner</h1>
              <p className="text-sm text-emerald-300/80">Scan, log, and track biomedical waste with camera</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: QrCode, label: 'Total Scans', value: stats.total_scans, color: 'emerald' },
            { icon: Camera, label: 'Session', value: scanCount, color: 'cyan' },
            { icon: Weight, label: 'Weight Logged', value: `${stats.total_weight_kg || 0} kg`, color: 'emerald' },
            { icon: Hash, label: 'Unique Barcodes', value: stats.unique_barcodes, color: 'purple' },
          ].map((item, idx) => (
            <div key={idx} className="card p-4">
              <item.icon className={`w-5 h-5 text-${item.color}-400 mb-2`} />
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────── */}
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="card p-3 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-300">{successMessage}</span>
        </div>
      )}

      {/* ── Tab Navigation ────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit flex-wrap">
        {[
          { id: 'scanner' as const, icon: Camera, label: 'Camera Scanner' },
          { id: 'manual' as const, icon: Search, label: 'Manual Entry' },
          { id: 'history' as const, icon: History, label: 'Scan History' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== 'scanner' && scanning) stopScanner() }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-gray-400 hover:text-white'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
           TAB 1: CAMERA SCANNER
           ════════════════════════════════════════════════════════════ */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Camera Viewfinder Panel ────────────────────────── */}
          <div className="card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Live Camera
              </h3>
              <div className="flex items-center gap-2">
                {/* Auto-log toggle */}
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={autoLog}
                    onChange={e => setAutoLog(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/30 w-3 h-3" />
                  Auto-log
                </label>
                {/* Start/Stop */}
                {!scanning ? (
                  <button onClick={startScanner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all">
                    <Camera className="w-3.5 h-3.5" /> Start
                  </button>
                ) : (
                  <button onClick={stopScanner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all">
                    <X className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
              </div>
            </div>

            {/* Camera viewfinder */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-sm mx-auto">
              <div id="scanner-viewfinder" ref={scannerContainerRef} className="w-full h-full" />

              {/* Overlay when idle */}
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-gray-500">
                  <CameraOff className="w-12 h-12 mb-3 text-gray-600" />
                  <p className="text-sm text-gray-500 mb-1">Camera is off</p>
                  <p className="text-xs text-gray-600">Click Start to enable camera</p>
                </div>
              )}

              {/* Scan corner guides */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                </div>
              )}

              {/* Scanning indicator */}
              {scanning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-medium">Scanning...</span>
                </div>
              )}

              {/* Scan count */}
              {scanCount > 0 && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                  <span className="text-[10px] text-gray-300 font-medium">{scanCount} scanned</span>
                </div>
              )}
            </div>

            {/* Stop button */}
            {scanning && (
              <div className="flex items-center justify-center mt-4">
                <button onClick={stopScanner}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/20 text-red-300 border border-red-600/30 text-xs font-medium hover:bg-red-600/30 transition-all">
                  <X className="w-3.5 h-3.5" /> Stop Scanner
                </button>
              </div>
            )}

            <p className="text-[10px] text-gray-600 text-center mt-3">
              Point camera at a Boon QR code to automatically scan and log
            </p>
          </div>

          {/* ── Scan Result Panel ──────────────────────────────── */}
          <div className="card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                {lastScan ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ScanLine className="w-4 h-4 text-gray-500" />
                )}
                Scan Result
              </h3>
              {lastScan && (
                <button onClick={clearLastScan}
                  className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {lastScan ? (
              <div className="space-y-4">
                {/* Barcode */}
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300">QR Code Detected</span>
                  </div>
                  <p className="text-sm font-mono text-white break-all bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
                    {formatBarcode(lastScan.barcode)}
                  </p>
                </div>

                {/* Payload */}
                {lastScan.payload && (
                  <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                    <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> QR Payload Data
                    </p>
                    <div className="space-y-1 text-xs">
                      {Object.entries(lastScan.payload).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-gray-200 font-mono truncate ml-2 max-w-[200px]">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Log status */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/30">
                  {lastScan.logged === true ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-300 font-medium">Logged to System</p>
                        <p className="text-[10px] text-gray-500">Auto-synced to Boon tracking database</p>
                      </div>
                    </>
                  ) : lastScan.logged === false ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-red-300 font-medium">Log Failed</p>
                        <p className="text-[10px] text-gray-500">{lastScan.log_error || 'Could not sync to system'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 font-medium">Pending Log</p>
                        <p className="text-[10px] text-gray-500">Auto-log toggled off or awaiting...</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Link to Sathi */}
                {(lastScan.payload?.barcode || lastScan.barcode) && (
                  <a href={`/sathi?barcode=${lastScan.payload?.barcode || lastScan.barcode}`}
                    className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-300 hover:text-blue-200 hover:bg-blue-600/20 transition-all text-sm font-medium">
                    <Link2 className="w-4 h-4" />
                    View on Sāthī Blockchain
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                  <Smartphone className="w-10 h-10 text-gray-700" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No QR code scanned yet</p>
                <p className="text-xs text-gray-600">Start the camera and point at a Boon QR code</p>
                <div className="flex items-center gap-2 mt-4">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-gray-600">Auto-logs every scan to the system</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           TAB 2: MANUAL ENTRY
           ════════════════════════════════════════════════════════════ */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Form */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Manual Barcode Entry
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Barcode *</label>
                <input type="text" value={form.barcode} placeholder="Enter or paste barcode..."
                  onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleManualLog()}
                  className="input-field text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Waste Category</label>
                <div className="flex gap-2 flex-wrap">
                  {WASTE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                        form.category === cat ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-transparent'
                      }`}
                      style={{ background: CATEGORY_STYLES[cat].bg, color: CATEGORY_STYLES[cat].color }}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: CATEGORY_STYLES[cat].dot }} />
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Facility</label>
                <select value={form.source_facility} onChange={e => setForm(f => ({ ...f, source_facility: e.target.value }))}
                  className="input-field text-sm">
                  <option value="">Select facility...</option>
                  {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="input-field text-sm">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Container</label>
                  <select value={form.container_type} onChange={e => setForm(f => ({ ...f, container_type: e.target.value }))}
                    className="input-field text-sm">
                    {CONTAINERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                  <input type="number" value={form.weight_kg} min={0.1} step={0.1}
                    onChange={e => setForm(f => ({ ...f, weight_kg: parseFloat(e.target.value) || 1.0 }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Scanned By</label>
                  <input type="text" value={form.scanned_by}
                    onChange={e => setForm(f => ({ ...f, scanned_by: e.target.value }))}
                    className="input-field text-sm" placeholder="Your name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea value={form.notes} rows={2} placeholder="Optional notes..."
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field text-sm resize-none" />
              </div>

              <button onClick={handleManualLog} disabled={loading || !form.barcode.trim()}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-50">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Log Scan to System</>
                )}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Quick Log
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                <ScanLine className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500 mb-2">Enter a barcode to log</p>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                Use the camera scanner tab for automatic detection. Manual entry is useful for damaged codes or offline scenarios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           TAB 3: SCAN HISTORY
           ════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Scan & Log History
            </h3>
            <div className="flex items-center gap-2">
              {stats && (
                <span className="text-[10px] text-gray-500">{stats.total_scans} total scans</span>
              )}
              <button onClick={refreshData}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>

          {scanHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500">No scans yet</p>
              <p className="text-xs text-gray-600 mt-1">Scan a QR code or use manual entry to begin</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {scanHistory.map((item: any, idx: number) => (
                <div key={idx}
                  className="group flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all cursor-default">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.category === 'yellow' ? 'bg-yellow-400' :
                    item.category === 'red' ? 'bg-red-400' :
                    item.category === 'white' ? 'bg-gray-200' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white font-mono truncate">{item.barcode}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">logged</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {item.source_facility} — {item.waste_type?.replace(/_/g, ' ')?.slice(0, 30)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400">{item.weight_kg} kg</p>
                    <p className="text-[10px] text-gray-600">
                      {item.scanned_at ? new Date(item.scanned_at).toLocaleString() : ''}
                    </p>
                  </div>
                  <a href={`/sathi?barcode=${item.barcode}`}
                    className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Link2 className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
