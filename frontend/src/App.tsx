import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Navigation,
  ScanLine,
  BarChart3,
  Building2,
  Menu,
  X,
  Leaf,
  Bell,
  ChevronRight,
  Hexagon,
  QrCode,
  Home,
  Camera,
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Tracking from './pages/Tracking'
import Classification from './pages/Classification'
import Analytics from './pages/Analytics'
import Facilities from './pages/Facilities'
import Sathi from './pages/Sathi'
import QRScanner from './pages/QRScanner'
import MasterHub from './pages/MasterHub'
import ScannerApp from './pages/ScannerApp'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Master Hub' },
  { path: '/qrcode', icon: QrCode, label: 'QR Code Manager' },
  { path: '/scanner', icon: Camera, label: 'QR Scanner' },
  { path: '/sathi', icon: Hexagon, label: 'Sāthī Network' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tracking', icon: Navigation, label: 'Tracking' },
  { path: '/classification', icon: ScanLine, label: 'AI Classifier' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/facilities', icon: Building2, label: 'Facilities' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          flex flex-col bg-gray-900/90 backdrop-blur-xl border-r border-gray-800`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-boon-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-boon-500/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Boon</h1>
              <p className="text-xs text-gray-500 font-medium">Waste Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <ChevronRight className="w-4 h-4 ml-auto text-boon-400" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
            <div className="w-2 h-2 rounded-full bg-boon-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">System Online</span>
            <span className="text-[10px] text-gray-600 ml-auto">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-gray-400">International Conference on</span>
            <span className="text-sm text-gradient font-semibold">Computational Intelligence & Sustainable Innovation</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-gray-900" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-boon-500/10 border border-boon-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-boon-400 animate-pulse" />
              <span className="text-xs text-boon-300 font-medium">Live Demo</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<MasterHub />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/qrcode" element={<QRScanner />} />
            <Route path="/scanner" element={<ScannerApp />} />
            <Route path="/sathi" element={<Sathi />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/classification" element={<Classification />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/facilities" element={<Facilities />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
