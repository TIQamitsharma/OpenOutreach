import { useEffect, useState } from 'react'
import { Search, ExternalLink, RefreshCw, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Deal, Lead, Campaign } from '../../lib/database.types'

type DealWithLead = Deal & { lead?: Lead; campaign?: Campaign }

const STATE_COLORS: Record<string, string> = {
  QUALIFIED: 'bg-gray-100 text-gray-700',
  READY_TO_CONNECT: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONNECTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
}

const OUTCOME_COLORS: Record<string, string> = {
  converted: 'bg-emerald-100 text-emerald-700',
  not_interested: 'bg-gray-100 text-gray-600',
  wrong_fit: 'bg-orange-100 text-orange-700',
  no_budget: 'bg-red-100 text-red-700',
  has_solution: 'bg-purple-100 text-purple-700',
  bad_timing: 'bg-yellow-100 text-yellow-700',
  unresponsive: 'bg-gray-100 text-gray-500',
  unknown: 'bg-gray-100 text-gray-500',
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [deals, setDeals] = useState<DealWithLead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterState, setFilterState] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [campRes] = await Promise.all([
      supabase.from('campaigns').select('id, name').eq('user_id', user!.id),
    ])
    setCampaigns((campRes.data as Campaign[]) || [])

    let query = supabase.from('deals').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (filterCampaign) query = query.eq('campaign_id', filterCampaign)
    if (filterState) query = query.eq('state', filterState)

    const { data: dealsData } = await query
    if (dealsData && dealsData.length > 0) {
      const leadIds = [...new Set(dealsData.map((d: Deal) => d.lead_id))]
      const campIds = [...new Set(dealsData.map((d: Deal) => d.campaign_id))]
      const [leadsRes, campsRes] = await Promise.all([
        supabase.from('leads').select('*').in('id', leadIds),
        supabase.from('campaigns').select('id, name').in('id', campIds),
      ])
      const leadMap = Object.fromEntries((leadsRes.data || []).map((l: Lead) => [l.id, l]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campMap = Object.fromEntries((campsRes.data || []).map((c: any) => [c.id, c]))
      setDeals((dealsData as Deal[]).map(d => ({ ...d, lead: leadMap[d.lead_id], campaign: campMap[d.campaign_id] })))
    } else {
      setDeals([])
    }
    setLoading(false)
  }

  useEffect(() => { if (user) loadData() }, [filterCampaign, filterState, page])

  const filtered = search
    ? deals.filter(d => d.lead?.public_identifier?.toLowerCase().includes(search.toLowerCase()))
    : deals

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & CRM</h1>
          <p className="text-gray-500 text-sm mt-0.5">All leads across your campaigns</p>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search profiles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto text-sm" value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">All States</option>
          {['QUALIFIED','READY_TO_CONNECT','PENDING','CONNECTED','COMPLETED','FAILED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} results
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">No leads found. Start automation to discover prospects.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  <th className="px-5 py-3 text-left">Profile</th>
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">State</th>
                  <th className="px-5 py-3 text-left">Outcome</th>
                  <th className="px-5 py-3 text-left">Attempts</th>
                  <th className="px-5 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(deal => (
                  <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      {deal.lead ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{deal.lead.public_identifier}</span>
                          <a href={deal.lead.linkedin_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-600">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[150px] truncate">{deal.campaign?.name || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${STATE_COLORS[deal.state]}`}>{deal.state.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5 py-3">
                      {deal.outcome ? (
                        <span className={`badge ${OUTCOME_COLORS[deal.outcome] || 'bg-gray-100 text-gray-600'}`}>
                          {deal.outcome.replace(/_/g, ' ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-center">{deal.connect_attempts}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(deal.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Page {page + 1}</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-secondary text-xs py-1.5" disabled={deals.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
