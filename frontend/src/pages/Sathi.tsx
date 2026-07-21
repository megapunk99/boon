import { useEffect, useState } from 'react'
import {
  Globe, Shield, Activity, Network, Search, CheckCircle2,
  AlertTriangle, TrendingUp, Building2, Truck, Fingerprint,
  Layers, ArrowRight, Clock, BarChart3, Coins, Sparkles,
  Zap, ExternalLink, Hash, Link2, Award, Hexagon,
} from 'lucide-react'
import * as api from '../services/api'

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400',
  verified: 'text-blue-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
}

const STAT_CARD_STYLES = {
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
  },
  blue: {
    icon: 'text-blue-400',
    bg: 'bg-blue-500/5',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/5',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-500/5',
  },
}

export default function Sathi() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [blockchainStats, setBlockchainStats] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [marketplace, setMarketplace] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'compliance' | 'marketplace'>('overview')
  const [selectedFacility, setSelectedFacility] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getSathiDashboard().then(setDashboard).catch(() => setError('Failed to load dashboard'))
    api.getBlockchainStats().then(setBlockchainStats).catch(() => {})
    api.getComplianceOverview().then(setCompliance).catch(() => {})
    api.getMarketplace().then(setMarketplace).catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await api.searchBlockchain(searchQuery)
      setSearchResults(res)
      setError(null)
    } catch {
      setSearchResults({ results: [], results_count: 0 })
      setError('Search failed — backend may be offline')
    }
  }

  const handleFacilityClick = async (id: string) => {
    try {
      const res = await api.getFacilityCompliance(id)
      setSelectedFacility(res)
      setError(null)
    } catch {
      setError('Failed to load facility details')
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Error banner */}
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 border border-emerald-900/30 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sathī Network</h1>
              <p className="text-sm text-emerald-300/80">India's Waste Intelligence Network</p>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-sm">
            A blockchain-verified, AI-enforced platform connecting hospitals, CBWTFs,
            and regulators — making biomedical waste compliance inevitable across India.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">Network Live</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">SHA-256 Secured</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Fingerprint className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">CPCB Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Network, label: 'Waste Items Tracked', value: dashboard.total_waste_items_tracked, style: STAT_CARD_STYLES.emerald },
            { icon: Layers, label: 'Blocks Mined', value: dashboard.total_blocks_mined, style: STAT_CARD_STYLES.blue },
            { icon: Shield, label: 'Chain Integrity', value: `${dashboard.integrity_rate}%`, style: STAT_CARD_STYLES.cyan },
            { icon: Award, label: 'Compliant Facilities', value: dashboard.total_compliance_reports, style: STAT_CARD_STYLES.emerald },
          ].map((item, idx) => (
            <div key={idx} className="card p-4 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-20 h-20 ${item.style.bg} rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`} />
              <div className="relative z-10">
                <item.icon className={`w-5 h-5 ${item.style.icon} mb-2`} />
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 flex-wrap">
        {([
          { id: 'overview', icon: Globe, label: 'Network Overview' },
          { id: 'explorer', icon: Fingerprint, label: 'Blockchain Explorer' },
          { id: 'compliance', icon: Shield, label: 'Compliance Hub' },
          { id: 'marketplace', icon: Coins, label: 'CBWTF Marketplace' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════ TAB: NETWORK OVERVIEW ════ */}
      {activeTab === 'overview' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Network Growth (6 Months)
            </h3>
            <div className="space-y-3">
              {dashboard.monthly_growth?.map((m: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 font-medium">{m.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-emerald-400">{m.items_tracked} items</span>
                      <span className="text-xs text-blue-400">{m.blocks_mined} blocks</span>
                      <span className="text-xs text-cyan-400">{m.compliance_rate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${(m.items_tracked / 200) * 100}%` }} />
                    </div>
                    <div className="flex-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${(m.blocks_mined / 500) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Network Coverage
            </h3>
            <div className="space-y-4">
              {[
                { label: 'States Covered', value: dashboard.network_coverage?.states_covered, color: 'text-emerald-400' },
                { label: 'Cities Covered', value: dashboard.network_coverage?.cities_covered, color: 'text-blue-400' },
                { label: 'Hospitals Onboarded', value: dashboard.network_coverage?.total_hospitals, color: 'text-cyan-400' },
                { label: 'Active CBWTFs', value: dashboard.network_coverage?.active_cbwtf, color: 'text-purple-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-medium text-gray-300 mt-6 mb-3">Facility Rankings</h4>
            <div className="space-y-2">
              {dashboard.facilities?.slice(0, 5).map((fac: any, idx: number) => (
                <div key={fac.id} onClick={() => handleFacilityClick(fac.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-4">{idx + 1}.</span>
                    <div>
                      <p className="text-sm text-gray-200">{fac.name}</p>
                      <p className="text-xs text-gray-500">{fac.city}, {fac.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${fac.compliance_score >= 85 ? 'bg-emerald-400' : fac.compliance_score >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <span className="text-sm font-medium text-white">{fac.compliance_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Network Activity
            </h3>
            <div className="space-y-1">
              {dashboard.recent_activity?.map((act: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${act.status === 'completed' ? 'bg-emerald-400' : act.status === 'verified' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{act.description}</p>
                    <p className="text-xs text-gray-500">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLORS[act.status] || 'text-gray-400'}`}>{act.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: BLOCKCHAIN EXPLORER ════ */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              Blockchain Explorer
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search by barcode, facility, or actor..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-10 text-sm" />
              </div>
              <button onClick={handleSearch} className="btn-primary text-sm">
                <Search className="w-4 h-4" /> Search Chain
              </button>
            </div>
          </div>

          {blockchainStats && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Chain Statistics
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Chains', value: blockchainStats.total_chains, icon: Layers, color: 'text-emerald-400' },
                  { label: 'Total Blocks', value: blockchainStats.total_blocks, icon: Link2, color: 'text-blue-400' },
                  { label: 'Blocks (24h)', value: blockchainStats.blocks_last_24h, icon: Zap, color: 'text-cyan-400' },
                  { label: 'Chain Integrity', value: `${blockchainStats.chain_integrity}%`, icon: Shield, color: 'text-emerald-400' },
                  { label: 'Avg Block Time', value: `${blockchainStats.avg_block_time_seconds}s`, icon: Clock, color: 'text-yellow-400' },
                  { label: 'Hash Algorithm', value: blockchainStats.algorithm, icon: Fingerprint, color: 'text-purple-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-800/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 lg:col-span-2">
            {searchResults ? (
              <>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  Search Results ({searchResults.results_count})
                </h3>
                {searchResults.results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No results found for &ldquo;{searchQuery}&rdquo;</div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.results.map((r: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Link2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white font-mono">{r.barcode}</p>
                            <p className="text-xs text-gray-500">{r.event ? `${r.event} — by ${r.actor || 'system'}` : `${r.block_count || 0} blocks`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${r.is_verified ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-xs text-gray-400">{r.is_verified ? 'Verified' : 'Compromised'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Fingerprint className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h4 className="text-gray-400 font-medium mb-1">Explore the Blockchain</h4>
                <p className="text-sm text-gray-600">Search for any barcode, facility name, or actor to view their chain of custody</p>
              </div>
            )}
          </div>

          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              How Blockchain Verification Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Waste Generated', desc: 'Each waste item gets a unique barcode and genesis block on the chain', color: 'from-emerald-500 to-emerald-400' },
                { step: '02', title: 'Handoff Recorded', desc: 'Every segregation, collection, and transfer creates a new block', color: 'from-blue-500 to-blue-400' },
                { step: '03', title: 'Chain Verified', desc: 'SHA-256 hashes link each block — any tampering breaks the chain', color: 'from-cyan-500 to-cyan-400' },
                { step: '04', title: 'CPCB Reported', desc: 'Auto-generated compliance reports with cryptographic proof', color: 'from-emerald-500 to-cyan-400' },
              ].map((item, idx) => (
                <div key={idx} className="relative p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-xs font-bold text-white mb-3`}>{item.step}</div>
                  <h4 className="text-sm font-medium text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: COMPLIANCE HUB ════ */}
      {activeTab === 'compliance' && compliance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Network Compliance
            </h3>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-white mb-1">{compliance.average_compliance_score}%</div>
              <p className="text-sm text-gray-400">Average Compliance Score</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`badge ${compliance.network_health === 'strong' ? 'badge-green' : compliance.network_health === 'moderate' ? 'badge-yellow' : 'badge-red'}`}>
                  {compliance.network_health}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Compliant', count: compliance.status_breakdown?.compliant, color: 'bg-emerald-400' },
                { label: 'Needs Attention', count: compliance.status_breakdown?.needs_attention, color: 'bg-yellow-400' },
                { label: 'Non-Compliant', count: compliance.status_breakdown?.non_compliant, color: 'bg-red-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-lg font-bold text-white">{item.count || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Facility Compliance Scores
            </h3>
            <div className="space-y-2">
              {compliance.facilities?.map((fac: any) => (
                <div key={fac.id} onClick={() => handleFacilityClick(fac.id)}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 cursor-pointer transition-all group">
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#1f2937" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none"
                        stroke={fac.compliance_score >= 85 ? '#34d399' : fac.compliance_score >= 70 ? '#fbbf24' : '#f87171'}
                        strokeWidth="3" strokeDasharray={`${(fac.compliance_score / 100) * 94.2} 94.2`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{fac.compliance_score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{fac.name}</p>
                    <p className="text-xs text-gray-500">{fac.city}, {fac.state}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${fac.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-400' : fac.status === 'needs_attention' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                    {fac.status.replace(/_/g, ' ')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {selectedFacility && (
            <div className="card p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  {selectedFacility.facility?.name}
                </h3>
                <button onClick={() => setSelectedFacility(null)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Close</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Compliance Metrics</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedFacility.metrics || {}).map(([key, val]: any) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-32 capitalize">{key.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${val >= 90 ? 'bg-emerald-400' : val >= 75 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${val}%` }} />
                        </div>
                        <span className="text-xs font-medium text-white w-8 text-right">{val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Violations ({selectedFacility.violations_count})</h4>
                  {selectedFacility.violations?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedFacility.violations.map((v: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className={`w-3 h-3 ${v.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
                            <span className={`text-xs font-medium ${v.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>{v.type.replace(/_/g, ' ').toUpperCase()}</span>
                          </div>
                          <p className="text-xs text-gray-400">{v.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      No violations — clean record
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ TAB: MARKETPLACE ════ */}
      {activeTab === 'marketplace' && marketplace && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Market Overview
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Total Listings', value: marketplace.total_listings, color: 'text-emerald-400' },
                { label: 'Available Capacity', value: `${marketplace.total_available_capacity_kg?.toLocaleString()} kg`, color: 'text-blue-400' },
                { label: 'Avg. Price', value: `\u20B9${marketplace.average_price_per_kg}/kg`, color: 'text-cyan-400' },
                { label: 'Price Range', value: `\u20B9${marketplace.price_range?.min} - \u20B9${marketplace.price_range?.max}`, color: 'text-purple-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Available CBWTF Capacity
            </h3>
            <div className="space-y-3">
              {marketplace.listings?.map((listing: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-emerald-700/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-white">{listing.facility}</h4>
                      <p className="text-xs text-gray-500">{listing.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">\u20B9{listing.price_per_kg}</p>
                      <p className="text-xs text-gray-500">per kg</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Capacity Available</span>
                        <span className="text-white font-medium">{listing.available_capacity_kg?.toLocaleString()} kg</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-3/4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.services?.map((svc: string, sIdx: number) => (
                      <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {svc.replace(/_/g, ' ')}
                      </span>
                    ))}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {listing.certification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
