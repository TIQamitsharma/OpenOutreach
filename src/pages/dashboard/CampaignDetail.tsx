import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Campaign, Deal, Lead } from '../../lib/database.types'

const STATE_COLORS: Record<string, string> = {
  QUALIFIED: 'bg-gray-100 text-gray-700',
  READY_TO_CONNECT: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONNECTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
}

const OUTCOME_LABELS: Record<string, string> = {
  converted: 'Converted',
  not_interested: 'Not Interested',
  wrong_fit: 'Wrong Fit',
  no_budget: 'No Budget',
  has_solution: 'Has Solution',
  bad_timing: 'Bad Timing',
  unresponsive: 'Unresponsive',
  unknown: 'Unknown',
}

type DealWithLead = Deal & { lead?: Lead }

export default function CampaignDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [deals, setDeals] = useState<DealWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [seedUrl, setSeedUrl] = useState('')
  const [addingSeed, setAddingSeed] = useState(false)
  const [filterState, setFilterState] = useState('')

  useEffect(() => { if (id && user) loadData() }, [id, user])

  async function loadData() {
    setLoading(true)
    const [campRes, dealsRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', id!).eq('user_id', user!.id).maybeSingle(),
      supabase.from('deals').select('*').eq('campaign_id', id!).eq('user_id', user!.id).order('updated_at', { ascending: false }),
    ])
    setCampaign(campRes.data)
    const dealsData = dealsRes.data || []
    if (dealsData.length > 0) {
      const leadIds = [...new Set(dealsData.map(d => d.lead_id))]
      const { data: leads } = await supabase.from('leads').select('*').in('id', leadIds)
      const leadMap = Object.fromEntries((leads || []).map(l => [l.id, l]))
      setDeals(dealsData.map(d => ({ ...d, lead: leadMap[d.lead_id] })))
    } else {
      setDeals([])
    }
    setLoading(false)
  }

  async function addSeedProfile() {
    if (!seedUrl || !campaign) return
    setAddingSeed(true)
    const match = seedUrl.match(/linkedin\.com\/in\/([^/]+)/)
    const publicId = match?.[1]
    if (!publicId) { alert('Invalid LinkedIn URL'); setAddingSeed(false); return }
    const current = (campaign.seed_public_ids as string[]) || []
    if (current.includes(publicId)) { alert('Already added'); setAddingSeed(false); return }
    await supabase.from('campaigns').update({ seed_public_ids: [...current, publicId] }).eq('id', campaign.id)
    setSeedUrl('')
    loadData()
    setAddingSeed(false)
  }

  async function removeSeed(pid: string) {
    if (!campaign) return
    const current = (campaign.seed_public_ids as string[]) || []
    await supabase.from('campaigns').update({ seed_public_ids: current.filter(p => p !== pid) }).eq('id', campaign.id)
    loadData()
  }

  const filtered = filterState ? deals.filter(d => d.state === filterState) : deals

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/campaigns" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign?.name || 'Loading…'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{campaign?.campaign_objective || ''}</p>
        </div>
        <button className="ml-auto p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {campaign && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product docs */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Product Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{campaign.product_docs || 'No description set'}</p>
          </div>

          {/* Seed profiles */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Seed Profiles</h3>
            <p className="text-xs text-gray-500 mb-3">Add LinkedIn URLs to bootstrap the ML model with ideal prospects.</p>
            <div className="flex gap-2 mb-3">
              <input
                className="input text-sm flex-1"
                placeholder="https://linkedin.com/in/username"
                value={seedUrl}
                onChange={e => setSeedUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSeedProfile()}
              />
              <button className="btn-primary text-sm py-2" disabled={addingSeed} onClick={addSeedProfile}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {((campaign.seed_public_ids as string[]) || []).map(pid => (
                <div key={pid} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                  <a href={`https://linkedin.com/in/${pid}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{pid}</a>
                  <button onClick={() => removeSeed(pid)}><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
                </div>
              ))}
              {((campaign.seed_public_ids as string[]) || []).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No seeds added</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deals table */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Deals ({deals.length})</h3>
          <select className="input w-auto text-sm py-1.5" value={filterState} onChange={e => setFilterState(e.target.value)}>
            <option value="">All States</option>
            {['QUALIFIED','READY_TO_CONNECT','PENDING','CONNECTED','COMPLETED','FAILED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No deals yet. The automation will create them as it discovers and qualifies leads.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                  <th className="px-5 py-3 text-left">Profile</th>
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
                        <a href={deal.lead.linkedin_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-medium">
                          {deal.lead.public_identifier}
                        </a>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${STATE_COLORS[deal.state]}`}>{deal.state.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {deal.outcome ? OUTCOME_LABELS[deal.outcome] || deal.outcome : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{deal.connect_attempts}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(deal.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
