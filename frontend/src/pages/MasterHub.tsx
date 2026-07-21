import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Hexagon, QrCode, Navigation, ScanLine,
  BarChart3, Building2, ArrowRight, Activity,
  Sparkles, Globe, ChevronRight, Leaf,
} from 'lucide-react'
import * as api from '../services/api'

const MODULES = [
  {
    path: '/',
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Real-time waste management overview with key metrics, alerts, and trends',
    color: 'from-emerald-500 to-emerald-400',
    badge: 'Live',
  },
  {
    path: '/qrcode',
    icon: QrCode,
    title: 'QR Code Manager',
    desc: 'Generate QR codes, verify barcodes, and manage scan history',
    color: 'from-blue-500 to-cyan-400',
    badge: 'New',
  },
  {
    path: '/sathi',
    icon: Hexagon,
    title: 'Sathī Network',
    desc: 'Blockchain-verified waste tracking, compliance hub, and CBWTF marketplace',
    color: 'from-emerald-500 to-emerald-400',
    badge: 'New',
  },
  {
    path: '/tracking',
    icon: Navigation,
    title: 'Tracking & Trace',
    desc: 'End-to-end barcode traceability with lifecycle chain visualization',
    color: 'from-cyan-500 to-blue-400',
    badge: '',
  },
  {
    path: '/classification',
    icon: ScanLine,
    title: 'AI Classifier',
    desc: 'AI-powered waste classification with treatment recommendations',
    color: 'from-purple-500 to-pink-400',
    badge: 'AI',
  },
  {
    path: '/analytics',
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Compliance reports, waste generation predictions, and facility analytics',
    color: 'from-orange-500 to-yellow-400',
    badge: '',
  },
  {
    path: '/facilities',
    icon: Building2,
    title: 'Facilities',
    desc: 'Manage healthcare facilities, compliance status, and capacity tracking',
    color: 'from-indigo-500 to-purple-400',
    badge: '',
  },
]

export default function MasterHub() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<any>(null)
  const [sathi, setSathi] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.getDashboardStats().then(setDashboard).catch(() => {})
    api.getSathiDashboard().then(setSathi).catch(() => {})
    api.getScannerStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 animate-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-950 to-emerald-950 border border-emerald-900/30 p-6 lg:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Boon Intelligence</h1>
              <p className="text-emerald-300/70 text-sm">Biomedical Waste Management • Sāthī Network • QR Tracking</p>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
            India's first integrated waste intelligence platform combining AI classification,
            blockchain-verified tracking, QR code management, and CPCB-compliant auto-reporting.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">
                {dashboard ? `${dashboard.total_facilities} Facilities` : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">
                {sathi ? `${sathi.total_waste_items_tracked} Items Tracked` : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <QrCode className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">
                {stats ? `${stats.total_scans} QR Codes` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {dashboard && sathi && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4"><p className="text-2xl font-bold text-white">{dashboard.compliance_rate}%</p><p className="text-xs text-gray-400">Compliance Rate</p></div>
          <div className="card p-4"><p className="text-2xl font-bold text-white">{dashboard.segregation_accuracy}%</p><p className="text-xs text-gray-400">Segregation Accuracy</p></div>
          <div className="card p-4"><p className="text-2xl font-bold text-white">{sathi.integrity_rate}%</p><p className="text-xs text-gray-400">Blockchain Integrity</p></div>
          <div className="card p-4"><p className="text-2xl font-bold text-white">{sathi.total_blocks_mined}</p><p className="text-xs text-gray-400">Blocks Mined</p></div>
        </div>
      )}

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Master Control Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => (
            <div key={mod.path}
              onClick={() => navigate(mod.path)}
              className="card p-5 card-hover group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mod.color} opacity-[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                    <mod.icon className="w-5 h-5 text-white" />
                  </div>
                  {mod.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      mod.badge === 'New' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {mod.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{mod.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{mod.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Launch</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {dashboard?.recent_activity?.slice(0, 5).map((act: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/40 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{act.source} — {act.waste_type}</p>
                  <p className="text-xs text-gray-500">{act.weight_kg} kg • {act.status}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
            ))}
            {(!dashboard?.recent_activity || dashboard.recent_activity.length === 0) && (
              <p className="text-sm text-gray-600 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Network Overview */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Network Overview
          </h3>
          <div className="space-y-3">
            {sathi?.monthly_growth?.slice(-3).map((m: any, idx: number) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-300 font-medium">{m.month}</span>
                  <span className="text-xs text-emerald-400">{m.compliance_rate}% compliance</span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="flex-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${(m.items_tracked / 200) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/sathi')}
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mt-4">
            View full network <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer quick links */}
      <div className="flex flex-wrap gap-2 justify-center pt-2 pb-4">
        {[
          { path: '/', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/qrcode', label: 'QR Generator', icon: QrCode },
          { path: '/sathi', label: 'Sāthī Network', icon: Hexagon },
          { path: '/tracking', label: 'Tracking', icon: Navigation },
          { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-xs text-gray-400 hover:text-white transition-all">
            <link.icon className="w-3.5 h-3.5" />
            {link.label}
          </button>
        ))}
      </div>
    </div>
  )
}
