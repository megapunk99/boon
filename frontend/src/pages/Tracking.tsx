import { useEffect, useState } from 'react'
import {
  Search,
  Route,
  Truck,
  MapPin,
  QrCode,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  ScanLine,
  BarChart3,
} from 'lucide-react'
import * as api from '../services/api'

const STATUS_COLORS: Record<string, string> = {
  generated: 'text-gray-500',
  segregated: 'text-yellow-400',
  collected: 'text-blue-400',
  stored: 'text-purple-400',
  transit: 'text-cyan-400',
  treated: 'text-boon-400',
  disposed: 'text-emerald-400',
}

export default function Tracking() {
  const [barcode, setBarcode] = useState('')
  const [traceResult, setTraceResult] = useState<any>(null)
  const [traceLoading, setTraceLoading] = useState(false)
  const [traceError, setTraceError] = useState<string | null>(null)
  const [trackingStats, setTrackingStats] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'trace' | 'live'>('trace')

  useEffect(() => {
    api.getTrackingStatistics().then(setTrackingStats).catch(() => {})
    api.getRoutes().then(setRoutes).catch(() => {})
  }, [])

  const handleTrace = async () => {
    if (!barcode.trim()) return
    setTraceLoading(true)
    setTraceError(null)
    try {
      const result = await api.traceWaste(barcode.trim().toUpperCase())
      setTraceResult(result)
    } catch (e) {
      setTraceError('Barcode not found in the tracking system. Try: BOON-001-YE-250721-0001')
    } finally {
      setTraceLoading(false)
    }
  }

  const handleSampleTrace = async () => {
    setBarcode('BOON-001-YE-250721-0001')
    setTraceLoading(true)
    setTraceError(null)
    try {
      const result = await api.traceWaste('BOON-001-YE-250721-0001')
      setTraceResult(result)
    } catch (e) {
      setTraceError('Sample trace failed. Make sure the backend is running.')
    } finally {
      setTraceLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Waste Tracking & Traceability</h1>
        <p className="text-gray-400 mt-1">
          End-to-end traceability powered by blockchain-verified barcode tracking
        </p>
      </div>

      {/* Stats */}
      {trackingStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{trackingStats.total_items_tracked}</p>
            <p className="text-xs text-gray-400">Items Tracked</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-boon-400">{trackingStats.traceability_rate}%</p>
            <p className="text-xs text-gray-400">Traceability Rate</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{trackingStats.active_barcodes}</p>
            <p className="text-xs text-gray-400">Active Barcodes</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-boon-400 animate-pulse" />
              <p className="text-lg font-bold text-white text-boon-400">
                {trackingStats.blockchain_verification ? 'Verified' : 'Pending'}
              </p>
            </div>
            <p className="text-xs text-gray-400">Blockchain Status</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit">
        <button
          onClick={() => setActiveTab('trace')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'trace' ? 'bg-boon-600 text-white shadow-lg shadow-boon-600/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Barcode Trace
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'live' ? 'bg-boon-600 text-white shadow-lg shadow-boon-600/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          Live Tracking
        </button>
      </div>

      {activeTab === 'trace' && (
        <>
          {/* Barcode Search */}
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter barcode (e.g., BOON-001-YE-250721-0001)"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                  className="input-field pl-10"
                />
              </div>
              <button onClick={handleTrace} disabled={traceLoading} className="btn-primary">
                {traceLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Trace Item
              </button>
              <button onClick={handleSampleTrace} className="btn-secondary">
                Load Sample
              </button>
            </div>
          </div>

          {/* Error */}
          {traceError && (
            <div className="card p-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-sm">{traceError}</span>
              </div>
            </div>
          )}

          {/* Trace Result */}
          {traceResult && (
            <div className="card p-5">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-white">Traceability Report</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Barcode: <span className="font-mono text-boon-400">{traceResult.barcode}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    traceResult.fully_traced ? 'badge-green' : 'badge-yellow'
                  }`}>
                    {traceResult.fully_traced ? 'Fully Traced' : 'In Progress'}
                  </span>
                  <span className="badge-blue">{traceResult.current_status}</span>
                </div>
              </div>

              {/* Item Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Waste Type</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {traceResult.waste_type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-white capitalize">{traceResult.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Severity</p>
                  <span className={`badge ${
                    traceResult.severity === 'critical' ? 'badge-red' :
                    traceResult.severity === 'high' ? 'badge-yellow' : 'badge-green'
                  }`}>
                    {traceResult.severity}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Steps</p>
                  <p className="text-sm font-medium text-white">{traceResult.total_steps} steps</p>
                </div>
              </div>

              {/* Trace Chain */}
              <h4 className="text-sm font-medium text-gray-300 mb-3">Lifecycle Trace</h4>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-700" />
                <div className="space-y-4">
                  {traceResult.traceability_chain.map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.status === 'completed'
                            ? 'bg-boon-500/20 text-boon-400'
                            : 'bg-gray-700 text-gray-500'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white capitalize">
                            {step.step.replace(/_/g, ' ')}
                          </p>
                          <span className="badge-green text-[10px]">{step.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.location || step.facility}
                          {step.department && ` • ${step.department}`}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {step.handler && (
                            <span className="text-xs text-gray-400">
                              Handler: {step.handler}
                            </span>
                          )}
                          {step.timestamp && (
                            <span className="text-xs text-gray-500">
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          )}
                          {step.method && (
                            <span className="text-xs text-gray-400">
                              Method: {step.method}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Routes */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Active Collection Routes</h3>
            <div className="space-y-3">
              {routes.map((route: any) => (
                <div key={route.id} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-white">{route.vehicle_id}</span>
                    </div>
                    <span className={`badge ${
                      route.status === 'in_progress' ? 'badge-green' : 'badge-yellow'
                    }`}>
                      {route.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>Driver: {route.driver_name}</span>
                  </div>
                  <div className="space-y-1">
                    {route.facilities.map((fac: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-boon-500" />
                        <span>{fac}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      {new Date(route.scheduled_time).toLocaleTimeString()}
                    </span>
                    <span className="text-sm font-medium text-white">{route.total_waste_kg} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Info */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-boon-400" />
                  <span className="text-sm text-gray-300">GPS Tracking</span>
                </div>
                <span className="badge-green">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-boon-400" />
                  <span className="text-sm text-gray-300">Real-time Analytics</span>
                </div>
                <span className="badge-green">Streaming</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">Blockchain Verification</span>
                </div>
                <span className="badge-green">Verified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Avg. Trace Completion</span>
                </div>
                <span className="text-sm font-medium text-white">28.5 hours</span>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">How It Works</h4>
              <div className="space-y-2">
                {[
                  'Waste is logged with a unique barcode at generation point',
                  'IoT sensors track weight, temperature, and GPS location',
                  'Blockchain verifies each handoff in the supply chain',
                  'Real-time dashboard shows status of all active shipments',
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-boon-500 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
