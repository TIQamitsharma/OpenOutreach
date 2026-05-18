import { useEffect, useState } from 'react'
import { Search, RefreshCw, Shield, ShieldOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { UserProfile } from '../../lib/database.types'

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  starter: 'bg-blue-900/50 text-blue-300',
  pro: 'bg-brand-900/50 text-brand-300',
  business: 'bg-amber-900/50 text-amber-300',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function changePlan(userId: string, plan: string) {
    setActionLoading(userId)
    await supabase.from('user_profiles').update({ plan: plan as UserProfile['plan'] }).eq('id', userId)
    await loadUsers()
    setActionLoading(null)
  }

  async function toggleRole(user: UserProfile) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (newRole === 'admin' && !confirm(`Grant admin privileges to ${user.email}?`)) return
    setActionLoading(user.id)
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', user.id)
    await loadUsers()
    setActionLoading(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchPlan = !filterPlan || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} total users</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" onClick={loadUsers}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500"
            placeholder="Search by email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none"
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Onboarded</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-gray-200 font-medium">{u.full_name || 'No name'}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className={`text-xs rounded px-2 py-1 border-0 focus:outline-none cursor-pointer ${PLAN_BADGE[u.plan]}`}
                      value={u.plan}
                      disabled={actionLoading === u.id}
                      onChange={e => changePlan(u.id, e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge text-xs ${u.role === 'admin' ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs ${u.onboarding_completed ? 'text-green-400' : 'text-gray-500'}`}>
                      {u.onboarding_completed ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/30 rounded transition-colors"
                        title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        disabled={actionLoading === u.id}
                        onClick={() => toggleRole(u)}
                      >
                        {u.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
