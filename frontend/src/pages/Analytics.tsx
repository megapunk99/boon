import { useEffect, useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  FileText,
  Calendar,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Target,
  LineChart,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
} from 'recharts'
import * as api from '../services/api'

export default function Analytics() {
  const [generation, setGeneration] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [predictorInfo, setPredictorInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'generation' | 'predictions' | 'compliance'>('generation')

  useEffect(() => {
    api.getGenerationSummary().then(setGeneration).catch(() => {})
    api.getComplianceReport().then(setCompliance).catch(() => {})
    api.getPredictions('FAC-001', 14).then(setPredictions).catch(() => {})
    api.getPredictorInfo().then(setPredictorInfo).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <p className="text-gray-400 mt-1">
          ML-powered waste generation forecasting and compliance analytics
        </p>
      </div>

      {/* Summary Cards */}
      {generation && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{generation.today_total_kg} kg</p>
            <p className="text-xs text-gray-400">Today's Generation</p>
            <p className="text-xs text-gray-500 mt-1">{generation.today_items} items</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{generation.weekly_total_kg} kg</p>
            <p className="text-xs text-gray-400">This Week</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-white">{generation.monthly_total_kg} kg</p>
            <p className="text-xs text-gray-400">This Month</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-boon-400">{generation.compliance_score}%</p>
              <Shield className="w-4 h-4 text-boon-400" />
            </div>
            <p className="text-xs text-gray-400">Compliance Score</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit">
        <button
          onClick={() => setActiveTab('generation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'generation' ? 'bg-boon-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Generation
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'predictions' ? 'bg-boon-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Predictions
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'compliance' ? 'bg-boon-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Compliance
        </button>
      </div>

      {activeTab === 'generation' && generation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Waste by Category (Monthly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={
                  Object.entries(generation.category_breakdown).map(([k, v]) => ({
                    name: k.charAt(0).toUpperCase() + k.slice(1),
                    kg: v,
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Bar dataKey="kg" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Waste by Department</h3>
            <div className="h-64 overflow-y-auto">
              <div className="space-y-2">
                {Object.entries(generation.department_breakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([dept, kg]) => (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 w-28 truncate">{dept}</span>
                      <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-boon-600 to-boon-400 rounded-full"
                          style={{ width: `${Math.min(100, (kg as number) / 150 * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-16 text-right">{(kg as number).toFixed(1)} kg</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Waste Status Distribution</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(generation.status_breakdown).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-gray-800/40 rounded-lg">
                  <p className="text-lg font-bold text-white">{count as number}</p>
                  <p className="text-xs text-gray-400 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Severity Distribution</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(generation.severity_breakdown).map(([sev, count]) => (
                <div key={sev} className="text-center p-3 bg-gray-800/40 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${
                    sev === 'critical' ? 'bg-red-500' :
                    sev === 'high' ? 'bg-orange-500' :
                    sev === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <p className="text-lg font-bold text-white">{count as number}</p>
                  <p className="text-xs text-gray-400 capitalize">{sev}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Active Alerts: {generation.active_alerts}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forecast Chart */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">14-Day Waste Generation Forecast</h3>
                <p className="text-xs text-gray-500">AIIMS Delhi — Boon-ForecastNet v2</p>
              </div>
              <LineChart className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Line type="monotone" dataKey="predicted_kg" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="lower_bound" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="upper_bound" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Info & Insights */}
          <div className="space-y-6">
            {predictorInfo && (
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-3">Forecast Model</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model</span>
                    <span className="text-gray-300">{predictorInfo.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Accuracy (MAPE)</span>
                    <span className="text-boon-400">{predictorInfo.accuracy_metrics?.mape}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">R² Score</span>
                    <span className="text-boon-400">{predictorInfo.accuracy_metrics?.r2_score}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3">Key Insights</h3>
              <div className="space-y-2">
                {predictions.length > 0 && (
                  <>
                    <div className="p-2.5 bg-gray-800/40 rounded-lg">
                      <p className="text-xs text-gray-500">Peak Day</p>
                      <p className="text-sm font-medium text-white">{predictions.reduce((max, p) => p.predicted_kg > max.predicted_kg ? p : max).date}</p>
                    </div>
                    <div className="p-2.5 bg-gray-800/40 rounded-lg">
                      <p className="text-xs text-gray-500">Avg Daily</p>
                      <p className="text-sm font-medium text-white">
                        {(predictions.reduce((sum, p) => sum + p.predicted_kg, 0) / predictions.length).toFixed(1)} kg
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && compliance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">CPCB Compliance Report</h3>
                <p className="text-xs text-gray-500">
                  {compliance.facility_name} — {compliance.reporting_period}
                </p>
              </div>
              <div className={`badge ${
                compliance.status === 'compliant' ? 'badge-green' :
                compliance.status === 'needs_attention' ? 'badge-yellow' : 'badge-red'
              }`}>
                {compliance.status.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-800/40 rounded-lg">
                <p className="text-xs text-gray-500">Treatment</p>
                <p className="text-lg font-bold text-white">{compliance.treatment_efficiency}%</p>
              </div>
              <div className="text-center p-3 bg-gray-800/40 rounded-lg">
                <p className="text-xs text-gray-500">Segregation</p>
                <p className="text-lg font-bold text-white">{compliance.segregation_accuracy}%</p>
              </div>
              <div className="text-center p-3 bg-gray-800/40 rounded-lg">
                <p className="text-xs text-gray-500">Collection</p>
                <p className="text-lg font-bold text-white">{compliance.collection_coverage}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl mb-4">
              <div>
                <p className="text-sm text-gray-300">Overall Compliance Score</p>
                <p className="text-xs text-gray-500">Certifiable at 90%+</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  compliance.compliance_score >= 85 ? 'text-boon-400' :
                  compliance.compliance_score >= 65 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {compliance.compliance_score}%
                </p>
                {compliance.certifiable && (
                  <span className="badge-green text-[10px]">Certifiable</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
              <ul className="space-y-1.5">
                {compliance.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                    <Target className="w-3.5 h-3.5 text-boon-500 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Report ID: {compliance.report_id} • Generated: {new Date(compliance.generated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3">Waste by Category</h3>
            <div className="space-y-3">
              {Object.entries(compliance.waste_by_category).map(([cat, kg]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      cat === 'yellow' ? 'bg-[#FFD700]' :
                      cat === 'red' ? 'bg-[#FF4444]' :
                      cat === 'white' ? 'bg-gray-300' : 'bg-[#4488FF]'
                    }`} />
                    <span className="text-sm text-gray-300 capitalize">{cat}</span>
                  </div>
                  <span className="text-sm text-white font-medium">{(kg as number).toFixed(1)} kg</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">Total Generated</p>
              <p className="text-lg font-bold text-white">{compliance.total_waste_generated_kg} kg</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
