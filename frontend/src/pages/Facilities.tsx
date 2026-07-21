import { useEffect, useState } from 'react'
import {
  Building2,
  MapPin,
  Shield,
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react'
import * as api from '../services/api'

export default function Facilities() {
  const [facilities, setFacilities] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getFacilitySummaries().then(setFacilities).catch(() => {
      api.getFacilities().then(setFacilities).catch(() => {})
    })
  }, [])

  const filtered = facilities.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.city.toLowerCase().includes(search.toLowerCase()) ||
    f.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Registered Facilities</h1>
          <p className="text-gray-400 mt-1">
            Healthcare facilities monitored by the Boon tracking system
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
          <div className="w-2 h-2 rounded-full bg-boon-400 animate-pulse" />
          <span className="text-sm text-gray-300">{facilities.length} facilities</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search facilities by name, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Facility Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-500">
          <Building2 className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium">No facilities found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((facility) => (
            <div key={facility.id} className="card p-5 group hover:border-gray-600 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    facility.compliance_status === 'compliant'
                      ? 'bg-boon-500/20'
                      : facility.compliance_status === 'needs_attention'
                      ? 'bg-yellow-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    <Building2 className={`w-5 h-5 ${
                      facility.compliance_status === 'compliant'
                        ? 'text-boon-400'
                        : facility.compliance_status === 'needs_attention'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{facility.name}</h3>
                    <p className="text-xs text-gray-500">{facility.type}</p>
                  </div>
                </div>
                <div className={`badge ${
                  facility.compliance_status === 'compliant' ? 'badge-green' :
                  facility.compliance_status === 'needs_attention' ? 'badge-yellow' : 'badge-red'
                }`}>
                  {facility.compliance_status?.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{facility.city}, {facility.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Capacity: {facility.capacity_kg} kg/day</span>
                </div>
                {facility.last_audit && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last audit: {new Date(facility.last_audit).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Current Load</span>
                  <span className={`font-medium ${
                    facility.load_percentage > 85 ? 'text-red-400' :
                    facility.load_percentage > 70 ? 'text-yellow-400' : 'text-boon-400'
                  }`}>
                    {facility.current_load_kg} / {facility.capacity_kg} kg
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      facility.load_percentage > 85 ? 'bg-red-500' :
                      facility.load_percentage > 70 ? 'bg-yellow-500' : 'bg-boon-500'
                    }`}
                    style={{ width: `${Math.min(100, facility.load_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-boon-400" />
                  <span className="text-xs text-boon-400 font-medium">
                    {facility.compliance_rate}% compliance
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {facility.waste_items_count} items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
