import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Megaphone, Users, MessageSquare, Settings,
  CreditCard, Zap, Activity, LogOut, ChevronDown, Shield, Menu, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/dashboard/leads', label: 'Leads & CRM', icon: Users },
  { to: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/dashboard/automation', label: 'Automation', icon: Activity },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-brand-100 text-brand-700',
  business: 'bg-amber-100 text-amber-700',
}

export default function DashboardLayout() {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-900">OpenOutreach</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">Admin</div>
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Shield className="w-4 h-4 shrink-0" />
              Admin Panel
            </NavLink>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'User'}</div>
            <div className="flex items-center gap-1.5">
              <span className={`badge capitalize text-[10px] ${PLAN_BADGE[profile?.plan || 'free']}`}>
                {profile?.plan || 'free'}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {userMenuOpen && (
          <div className="mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-col fixed inset-y-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">OpenOutreach</span>
          </div>
          <button className="ml-auto" onClick={() => setSidebarOpen(false)}>
            {sidebarOpen && <X className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
