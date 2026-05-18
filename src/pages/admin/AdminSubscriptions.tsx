import { useEffect, useState } from 'react'
import { RefreshCw, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Subscription } from '../../lib/database.types'

type SubWithUser = Subscription & { user?: { email: string; full_name: string } }

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<SubWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ active: 0, cancelled: 0, mrr: 0 })

  const PLAN_PRICES: Record<string, number> = { starter: 999, pro: 2499, business: 5999 }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(s => s.user_id))]
      const { data: users } = await supabase.from('user_profiles').select('id, email, full_name').in('id', userIds)
      const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))
      const enriched = data.map(s => ({ ...s, user: userMap[s.user_id] }))
      setSubs(enriched)

      const active = enriched.filter(s => s.status === 'active')
      const mrr = active.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0)
      setStats({ active: active.length, cancelled: enriched.filter(s => s.status === 'cancelled').length, mrr })
    } else {
      setSubs([])
      setStats({ active: 0, cancelled: 0, mrr: 0 })
    }
    setLoading(false)
  }

  const STATUS_STYLE: Record<string, string> = {
    active: 'bg-green-900/50 text-green-300',
    cancelled: 'bg-red-900/50 text-red-300',
    pending: 'bg-yellow-900/50 text-yellow-300',
    halted: 'bg-orange-900/50 text-orange-300',
    expired: 'bg-gray-700 text-gray-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 text-sm mt-0.5">All Razorpay subscriptions</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* MRR cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">MRR</div>
          <div className="text-2xl font-bold text-green-400">₹{stats.mrr.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-white">{stats.active}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Razorpay ID</th>
                <th className="px-5 py-3 text-left">Period End</th>
                <th className="px-5 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No subscriptions yet. Connect Razorpay in Platform Settings.</p>
                  </td>
                </tr>
              ) : subs.map(s => (
                <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-gray-200 font-medium">{s.user?.full_name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs">{s.user?.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="badge text-xs bg-brand-900/40 text-brand-300 capitalize">{s.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge text-xs ${STATUS_STYLE[s.status] || 'bg-gray-700 text-gray-400'}`}>{s.status}</span>
                    {s.cancel_at_period_end && <span className="badge text-xs bg-orange-900/40 text-orange-300 ml-1">Cancels</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{s.razorpay_subscription_id || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
