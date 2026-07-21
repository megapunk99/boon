import { useEffect, useState, useCallback } from 'react'
import {
  QrCode, ScanLine, Download, Printer, History, Search,
  CheckCircle2, AlertTriangle, Package, Weight, Building2,
  Hash, Layers, Clock, ArrowRight, Camera, FileText,
  Sparkles, Shield, Link2,
} from 'lucide-react'
import * as api from '../services/api'

// ── Types ────────────────────────────────────────────────────────────────
interface QRFormData {
  waste_type: string
  category: string
  source_facility: string
  department: string
  weight_kg: number
  container_type: string
  handler_name: string
}

interface GeneratedQR {
  success: boolean
  barcode: string
  qr_data_url: string
  qr_payload: string
  metadata: any
  print_info: any
}

// ── Constants ────────────────────────────────────────────────────────────
const WASTE_OPTIONS = {
  yellow: [
    'human_anatomical_waste', 'soiled_dressing', 'blood_bags',
    'discarded_medicines', 'cytotoxic_drugs', 'microbiology_waste', 'incineration_ash',
  ],
  red: [
    'iv_tubing', 'catheters', 'urine_bags', 'syringes_without_needle',
    'gloves', 'masks', 'dressing_materials',
  ],
  white: [
    'hypodermic_needles', 'scalpels', 'blades', 'broken_glass_ampoules',
  ],
  blue: [
    'glass_vials', 'glass_bottles', 'metallic_implants', 'broken_glassware',
  ],
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

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  yellow: { label: 'Yellow — Infectious', color: '#92400E', bg: '#FEF3C7', dot: '#FFD700' },
  red: { label: 'Red — Recyclable', color: '#991B1B', bg: '#FEE2E2', dot: '#FF4444' },
  white: { label: 'White — Sharps', color: '#1F2937', bg: '#F3F4F6', dot: '#E0E0E0' },
  blue: { label: 'Blue — Glass & Metals', color: '#1E40AF', bg: '#DBEAFE', dot: '#4488FF' },
}

// ── Component ────────────────────────────────────────────────────────────
export default function QRScanner() {
  const [activeTab, setActiveTab] = useState<'generate' | 'verify' | 'history'>('generate')
  const [form, setForm] = useState<QRFormData>({
    waste_type: '', category: 'yellow', source_facility: '',
    department: 'Emergency', weight_kg: 1.0, container_type: 'bag',
    handler_name: 'Scanner Operator',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedQR, setGeneratedQR] = useState<GeneratedQR | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [facilities, setFacilities] = useState<string[]>([])

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
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!form.waste_type || !form.category || !form.source_facility) {
      setError('Please fill in waste type, category, and facility')
      return
    }
    setLoading(true)
    setError(null)
    setGeneratedQR(null)

    try {
      const result = await api.generateQR({
        waste_type: form.waste_type,
        category: form.category,
        source_facility: form.source_facility,
        department: form.department,
        weight_kg: form.weight_kg,
        container_type: form.container_type,
        handler_name: form.handler_name,
      })
      setGeneratedQR(result)

      // Auto-log to system
      await api.logScan({
        barcode: result.barcode,
        waste_type: form.waste_type,
        category: form.category,
        weight_kg: form.weight_kg,
        source_facility: form.source_facility,
        department: form.department,
        container_type: form.container_type,
        scanned_by: form.handler_name,
        notes: 'Generated via Boon Scanner',
      })
      api.getScannerStats().then(setStats).catch(() => {})
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [form])

  const handleVerify = useCallback(async () => {
    if (!barcodeInput.trim()) return
    setVerifyLoading(true)
    setVerifyResult(null)
    setError(null)

    try {
      const result = await api.verifyScannerBarcode(barcodeInput.trim().toUpperCase())
      setVerifyResult(result)
    } catch {
      setVerifyResult({ verified: false, message: 'Barcode not found in system' })
    } finally {
      setVerifyLoading(false)
    }
  }, [barcodeInput])

  const handleDownload = useCallback(() => {
    if (!generatedQR) return
    const link = document.createElement('a')
    link.download = `boon-${generatedQR.barcode}.png`
    link.href = generatedQR.qr_data_url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [generatedQR])

  const handlePrint = useCallback(() => {
    if (!generatedQR) return
    const w = window.open('', '_blank', 'width=400,height=400')
    if (!w) return
    w.document.write(`
      <html><head><title>Boon QR Label</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif;background:white}
      .label{text-align:center;padding:20px;border:2px dashed #333;border-radius:8px;max-width:300px}
      img{width:220px;height:220px} h3{margin:8px 0 4px;font-size:14px;color:#333}
      p{margin:2px 0;font-size:11px;color:#666;font-family:monospace}
      .meta{margin-top:8px;font-size:9px;color:#999}</style></head>
      <body><div class="label">
        <img src="${generatedQR.qr_data_url}" alt="QR Code" />
        <h3>${generatedQR.barcode}</h3>
        <p>Biomedical Waste • ${form.waste_type.replace(/_/g, ' ')}</p>
        <div class="meta">Boon Scanner • ${new Date().toLocaleDateString()}</div>
      </div>
      <script>window.onload=()=>{window.print();window.close()}<\\/script></body></html>`)
    w.document.close()
  }, [generatedQR, form.waste_type])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 border border-blue-900/30 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Code Manager</h1>
              <p className="text-sm text-blue-300/80">Generate, verify, and track biomedical waste QR codes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: QrCode, label: 'Total QR Codes', value: stats.total_scans, color: 'blue' },
            { icon: Clock, label: 'Today', value: stats.today_scans, color: 'cyan' },
            { icon: Weight, label: 'Weight Logged', value: `${stats.total_weight_kg || 0} kg`, color: 'emerald' },
            { icon: Hash, label: 'Barcodes', value: stats.unique_barcodes, color: 'purple' },
          ].map((item, idx) => (
            <div key={idx} className="card p-4">
              <item.icon className={`w-5 h-5 text-${item.color}-400 mb-2`} />
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit">
        {[
          { id: 'generate' as const, icon: QrCode, label: 'Generate QR' },
          { id: 'verify' as const, icon: Search, label: 'Verify Barcode' },
          { id: 'history' as const, icon: History, label: 'Scan History' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════ TAB: GENERATE QR ════ */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-400" />
              Generate Waste QR Code
            </h3>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Waste Category</label>
                <div className="flex gap-2 flex-wrap">
                  {['yellow', 'red', 'white', 'blue'].map(cat => (
                    <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat, waste_type: '' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${form.category === cat ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent'}`}
                      style={{ background: CATEGORY_META[cat].bg, color: CATEGORY_META[cat].color }}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: CATEGORY_META[cat].dot }} />
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Waste Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Waste Type</label>
                <select value={form.waste_type} onChange={e => setForm(f => ({ ...f, waste_type: e.target.value }))}
                  className="input-field text-sm">
                  <option value="">Select waste type...</option>
                  {WASTE_OPTIONS[form.category as keyof typeof WASTE_OPTIONS]?.map(wt => (
                    <option key={wt} value={wt}>{wt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Facility & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facility</label>
                  <select value={form.source_facility} onChange={e => setForm(f => ({ ...f, source_facility: e.target.value }))}
                    className="input-field text-sm">
                    <option value="">Select facility...</option>
                    {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="input-field text-sm">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Weight & Container */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                  <input type="number" value={form.weight_kg} min={0.1} step={0.1}
                    onChange={e => setForm(f => ({ ...f, weight_kg: parseFloat(e.target.value) || 1.0 }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Container</label>
                  <select value={form.container_type} onChange={e => setForm(f => ({ ...f, container_type: e.target.value }))}
                    className="input-field text-sm">
                    {CONTAINERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Handler */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Handler</label>
                <input type="text" value={form.handler_name}
                  onChange={e => setForm(f => ({ ...f, handler_name: e.target.value }))}
                  className="input-field text-sm" placeholder="Your name" />
              </div>

              <button onClick={handleGenerate} disabled={loading}
                className="btn-primary w-full justify-center mt-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><QrCode className="w-4 h-4" /> Generate QR Code & Log</>
                )}
              </button>
            </div>
          </div>

          {/* QR Display */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              {generatedQR ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <QrCode className="w-4 h-4 text-gray-500" />}
              Generated QR Code
            </h3>

            {generatedQR ? (
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-xl">
                  <img src={generatedQR.qr_data_url} alt="QR Code" style={{ width: '192px', height: '192px', imageRendering: 'pixelated' }} />
                </div>

                <div className="text-center flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="badge-green">✓ Generated</span>
                    {(generatedQR as any).blockchain_registered ? (
                      <span className="badge-green">✓ Sāthī Blockchain</span>
                    ) : (
                      <span className="badge-yellow">⚠ Not on Blockchain</span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-boon-400">{generatedQR.barcode}</p>
                  {(generatedQR as any).sathi_trace_url && (
                    <a href={(generatedQR as any).sathi_trace_url}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-1">
                      <Link2 className="w-3 h-3" /> View on Sāthī Network
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-800/50 rounded-lg text-sm">
                  <div><span className="text-gray-500">Category</span><p className="text-gray-200 capitalize">{form.category}</p></div>
                  <div><span className="text-gray-500">Waste</span><p className="text-gray-200">{form.waste_type.replace(/_/g, ' ')}</p></div>
                  <div><span className="text-gray-500">Weight</span><p className="text-gray-200">{form.weight_kg} kg</p></div>
                  <div><span className="text-gray-500">Department</span><p className="text-gray-200">{form.department}</p></div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleDownload} className="btn-secondary flex-1 justify-center">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={handlePrint} className="btn-secondary flex-1 justify-center">
                    <Printer className="w-4 h-4" /> Print Label
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <QrCode className="w-16 h-16 mb-4 text-gray-700" />
                <p className="text-sm">Fill in the form and generate a QR code</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ TAB: VERIFY BARCODE ════ */}
      {activeTab === 'verify' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              Verify Barcode / QR Code
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Enter barcode (e.g., BOON-A1B2-YE-250721-00001)"
                  value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  className="input-field pl-10 text-sm" />
              </div>
              <button onClick={handleVerify} disabled={verifyLoading} className="btn-primary text-sm">
                {verifyLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                Verify
              </button>
            </div>
          </div>

          <div className="card p-5">
            {verifyResult ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    {verifyResult.verified ? (
                      <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified</>
                    ) : (
                      <><AlertTriangle className="w-4 h-4 text-yellow-400" /> Not Found</>
                    )}
                  </h3>
                  {verifyResult.source && (
                    <span className="badge-blue text-xs">{verifyResult.source.replace(/_/g, ' ')}</span>
                  )}
                </div>
                {verifyResult.verified ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Barcode</span><p className="text-white font-mono">{verifyResult.barcode}</p></div>
                      <div><span className="text-gray-500">Status</span><p className="text-white capitalize">{verifyResult.status}</p></div>
                      <div><span className="text-gray-500">Category</span><p className="text-white capitalize">{verifyResult.category}</p></div>
                      <div><span className="text-gray-500">Weight</span><p className="text-white">{verifyResult.weight_kg} kg</p></div>
                    </div>
                    {verifyResult.trace_url && (
                      <a href={`/sathi?barcode=${verifyResult.barcode}`}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2">
                        <Link2 className="w-4 h-4" /> View on Sāthī Blockchain
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{verifyResult.message || 'Barcode not found in system'}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <ScanLine className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-sm">Enter a barcode above to verify it in the system</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ TAB: SCAN HISTORY ════ */}
      {activeTab === 'history' && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Scan & Log History
          </h3>
          {scanHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm">No scans yet. Generate your first QR code above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${item.category === 'yellow' ? 'bg-yellow-400' : item.category === 'red' ? 'bg-red-400' : item.category === 'white' ? 'bg-gray-200' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white font-mono truncate">{item.barcode}</p>
                    <p className="text-xs text-gray-500">{item.source_facility} — {item.waste_type?.replace(/_/g, ' ')?.slice(0, 25)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{item.weight_kg} kg</p>
                    <p className="text-[10px] text-gray-600">{item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
