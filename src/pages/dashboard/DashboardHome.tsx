import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Link2, MessageSquare, TrendingUp, Activity, ArrowRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { DaemonStatus } from '../../lib/database.types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  totalLeads: number
  connected: number
  inProgress: number
  converted: number
  todayConnects: number
  todayFollowUps: number
}

const STATE_COLORS: Record<string, string> = {
  QUALIFIED: 'bg-gray-100 text-gray-700',
  READY_TO_CONNECT: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONNECTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function DashboardHome() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, connected: 0, inProgress: 0, converted: 0, todayConnects: 0, todayFollowUps: 0 })
  const [daemon, setDaemon] = useState<DaemonStatus | null>(null)
  const [dealsByState, setDealsByState] = useState<{ state: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [leadsRes, dealsRes, daemonRes, actionRes] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('deals').select('state, outcome').eq('user_id', user!.id),
      supabase.from('daemon_status').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('action_logs').select('action_type, created_at').eq('user_id', user!.id)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ])

    const deals = dealsRes.data || []
    const stateCount: Record<string, number> = {}
    deals.forEach(d => { stateCount[d.state] = (stateCount[d.state] || 0) + 1 })

    const todayConnects = (actionRes.data || []).filter(a => a.action_type === 'connect').length
    const todayFollowUps = (actionRes.data || []).filter(a => a.action_type === 'follow_up').length

    setStats({
      totalLeads: leadsRes.count || 0,
      connected: stateCount['CONNECTED'] || 0,
      inProgress: (stateCount['PENDING'] || 0) + (stateCount['READY_TO_CONNECT'] || 0),
      converted: deals.filter(d => d.outcome === 'converted').length,
      todayConnects,
      todayFollowUps,
    })
    setDealsByState(Object.entries(stateCount).map(([state, count]) => ({ state, count })))
    setDaemon(daemonRes.data)
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Connected', value: stats.connected, icon: Link2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Converted', value: stats.converted, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your campaigns</p>
        </div>
        <Link to="/dashboard/campaigns" className="btn-primary text-sm py-2">
          New Campaign <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Onboarding prompt */}
      {!profile?.onboarding_completed && (
        <div className="card p-5 border-brand-200 bg-brand-50 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-brand-900 mb-1">Complete your setup</div>
            <p className="text-sm text-brand-700">Add your LinkedIn credentials and LLM API key to start automating outreach.</p>
          </div>
          <Link to="/dashboard/onboarding" className="btn-primary text-sm py-2 shrink-0">Start Setup</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pipeline chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            Pipeline by State
          </h3>
          {dealsByState.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No deals yet. Start a campaign.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dealsByState} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2e8bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daemon status */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            Automation Status
          </h3>
          {!daemon ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">No daemon configured</span>
              </div>
              <Link to="/dashboard/automation" className="btn-secondary text-sm w-full justify-center">
                Configure Automation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  daemon.status === 'running' ? 'bg-green-500 animate-pulse' :
                  daemon.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-900 capitalize">{daemon.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{stats.todayConnects}</div>
                  <div className="text-xs text-gray-500">Connects today</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{stats.todayFollowUps}</div>
                  <div className="text-xs text-gray-500">Follow-ups today</div>
                </div>
              </div>
              {daemon.last_error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <strong>Last error:</strong> {daemon.last_error}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Queue depth: {daemon.queue_depth}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deal state breakdown */}
      {dealsByState.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Deal Breakdown by State</h3>
          <div className="flex flex-wrap gap-2">
            {dealsByState.map(({ state, count }) => (
              <div key={state} className={`badge gap-1.5 px-3 py-1.5 text-sm ${STATE_COLORS[state] || 'bg-gray-100 text-gray-700'}`}>
                {state.replace(/_/g, ' ')}
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
