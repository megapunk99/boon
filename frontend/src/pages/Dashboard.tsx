import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Droplets,
  Shield,
  Trash2,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import * as api from '../services/api'

const CATEGORY_COLORS: Record<string, string> = {
  yellow: '#FFD700',
  red: '#FF4444',
  white: '#E0E0E0',
  blue: '#4488FF',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4ade80',
  medium: '#fbbf24',
  high: '#f97316',
  critical: '#ef4444',
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const stats = await api.getDashboardStats()
        setData(stats)
      } catch (e) {
        console.error('Failed to load dashboard', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-boon-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Tracked Items',
      value: data?.total_tracked_items ?? 0,
      icon: Trash2,
      change: '+12%',
      up: true,
      color: 'from-boon-500 to-emerald-600',
    },
    {
      label: 'Waste Treated Today',
      value: `${data?.waste_treated_today_kg ?? 0} kg`,
      icon: CheckCircle2,
      change: '+8%',
      up: true,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      label: 'Compliance Rate',
      value: `${data?.compliance_rate ?? 0}%`,
      icon: Shield,
      change: '+3.2%',
      up: true,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Active Alerts',
      value: data?.active_alerts ?? 0,
      icon: AlertTriangle,
      change: data?.active_alerts > 5 ? '+2' : '-1',
      up: data?.active_alerts <= 5,
      color: 'from-rose-500 to-red-600',
    },
  ]

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Real-time biomedical waste monitoring and intelligence
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} 
                flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${
                stat.up ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Waste Generation Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly comparison (kg)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trend ?? []}>
                <defs>
                  <linearGradient id="generated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="treated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#e5e7eb',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generated"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#generated)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="treated"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#treated)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Waste by Category</h3>
              <p className="text-xs text-gray-500 mt-0.5">Distribution across categories</p>
            </div>
            <Droplets className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.category_distribution ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.category_distribution ?? []).map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {(data?.category_distribution ?? []).map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Alerts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Active Alerts</h3>
            <span className="text-xs text-gray-500">
              {data?.alerts?.filter((a: any) => !a.resolved).length ?? 0} unresolved
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(data?.alerts ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              (data?.alerts ?? []).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    alert.resolved ? 'bg-gray-800/30 opacity-50' : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge-gray text-[10px]">{alert.type}</span>
                      <span className="text-[10px] text-gray-500">{alert.facility}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {(data?.recent_activity ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mb-2" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              (data?.recent_activity ?? []).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/40 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.category === 'yellow' ? 'bg-[#FFD700]' :
                    item.category === 'red' ? 'bg-[#FF4444]' :
                    item.category === 'white' ? 'bg-gray-300' : 'bg-[#4488FF]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.waste_type}</p>
                    <p className="text-xs text-gray-500 truncate">{item.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white">{item.weight_kg} kg</p>
                    <span className={`text-[10px] ${
                      item.status === 'disposed' || item.status === 'treated' ? 'text-boon-400' :
                      item.status === 'transit' ? 'text-yellow-400' : 'text-gray-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
