import { useEffect, useState } from 'react'
import { Users, Megaphone, Activity, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalCampaigns: number
  totalLeads: number
  totalDeals: number
  totalConverted: number
  runningDaemons: number
  paidUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, activeUsers: 0, totalCampaigns: 0, totalLeads: 0,
    totalDeals: 0, totalConverted: 0, runningDaemons: 0, paidUsers: 0,
  })
  const [recentUsers, setRecentUsers] = useState<{ id: string; email: string; plan: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [usersRes, campaignsRes, leadsRes, dealsRes, daemonsRes, recentRes] = await Promise.all([
      supabase.from('user_profiles').select('id, plan', { count: 'exact' }),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('outcome'),
      supabase.from('daemon_status').select('status'),
      supabase.from('user_profiles').select('id, email, plan, created_at').order('created_at', { ascending: false }).limit(10),
    ])

    const users = usersRes.data || []
    const deals = dealsRes.data || []

    setStats({
      totalUsers: usersRes.count || 0,
      activeUsers: users.filter(u => u.plan !== 'free').length,
      totalCampaigns: campaignsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      totalDeals: deals.length,
      totalConverted: deals.filter(d => d.outcome === 'converted').length,
      runningDaemons: (daemonsRes.data || []).filter(d => d.status === 'running').length,
      paidUsers: users.filter(u => u.plan !== 'free').length,
    })
    setRecentUsers(recentRes.data || [])
    setLoading(false)
  }

  const PLAN_BADGE: Record<string, string> = {
    free: 'bg-gray-700 text-gray-300',
    starter: 'bg-blue-900/50 text-blue-300',
    pro: 'bg-brand-900/50 text-brand-300',
    business: 'bg-amber-900/50 text-amber-300',
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Paid Users', value: stats.paidUsers, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/30' },
    { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Total Deals', value: stats.totalDeals, icon: Activity, color: 'text-pink-400', bg: 'bg-pink-900/30' },
    { label: 'Converted', value: stats.totalConverted, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
    { label: 'Running Daemons', value: stats.runningDaemons, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time stats across all tenants</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{loading ? '—' : card.value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue placeholder */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-white">Revenue Tracking</h3>
        </div>
        <p className="text-sm text-gray-400">Connect your Razorpay account in Platform Settings to see revenue metrics, MRR, and payment history here.</p>
      </div>

      {/* Recent users */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-5 border-b border-gray-700">
          <h3 className="font-semibold text-white">Recent Signups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : recentUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-gray-300">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`badge text-xs ${PLAN_BADGE[u.plan] || 'bg-gray-700 text-gray-300'}`}>{u.plan}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
