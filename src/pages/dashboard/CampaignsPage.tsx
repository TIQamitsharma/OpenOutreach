import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Megaphone, Edit2, Trash2, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Campaign } from '../../lib/database.types'

function CampaignModal({
  campaign,
  onClose,
  onSave,
}: {
  campaign: Campaign | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState(campaign?.name || '')
  const [productDocs, setProductDocs] = useState(campaign?.product_docs || '')
  const [objective, setObjective] = useState(campaign?.campaign_objective || '')
  const [bookingLink, setBookingLink] = useState(campaign?.booking_link || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')
    if (campaign) {
      const { error: e } = await supabase.from('campaigns').update({
        name, product_docs: productDocs, campaign_objective: objective, booking_link: bookingLink,
      }).eq('id', campaign.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('campaigns').insert({
        user_id: user.id, name, product_docs: productDocs,
        campaign_objective: objective, booking_link: bookingLink,
        is_freemium: false, action_fraction: 0.2, seed_public_ids: [], active: true,
      })
      if (e) { setError(e.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{campaign ? 'Edit Campaign' : 'New Campaign'}</h2>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Campaign Name</label>
            <input className="input" placeholder="e.g. DevOps Tools Q1 2026" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Product Description</label>
            <textarea className="input min-h-[90px]" placeholder="Describe your product and target market..." value={productDocs} onChange={e => setProductDocs(e.target.value)} />
          </div>
          <div>
            <label className="label">Campaign Objective</label>
            <textarea className="input min-h-[70px]" placeholder="e.g. VP Engineering at Series B SaaS companies" value={objective} onChange={e => setObjective(e.target.value)} />
          </div>
          <div>
            <label className="label">Booking Link (optional)</label>
            <input className="input" type="url" placeholder="https://calendly.com/..." value={bookingLink} onChange={e => setBookingLink(e.target.value)} />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving || !name || !productDocs || !objective} onClick={handleSave}>
            {saving ? 'Saving…' : campaign ? 'Save Changes' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [dealCounts, setDealCounts] = useState<Record<string, number>>({})

  useEffect(() => { if (user) loadCampaigns() }, [user])

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase.from('campaigns').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    setCampaigns(data || [])
    if (data && data.length > 0) {
      const { data: dealData } = await supabase.from('deals').select('campaign_id').eq('user_id', user!.id)
      const counts: Record<string, number> = {}
      ;(dealData || []).forEach(d => { counts[d.campaign_id] = (counts[d.campaign_id] || 0) + 1 })
      setDealCounts(counts)
    }
    setLoading(false)
  }

  async function toggleActive(c: Campaign) {
    await supabase.from('campaigns').update({ active: !c.active }).eq('id', c.id)
    loadCampaigns()
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    await supabase.from('campaigns').delete().eq('id', id)
    loadCampaigns()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your LinkedIn outreach campaigns</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card p-5 h-36 animate-pulse bg-gray-100" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first campaign to start discovering and contacting leads.</p>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className={`card p-5 flex flex-col gap-3 ${!c.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.campaign_objective || 'No objective set'}</p>
                </div>
                <div className={`badge shrink-0 ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.active ? 'Active' : 'Paused'}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{dealCounts[c.id] || 0} deals</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Link to={`/dashboard/campaigns/${c.id}`} className="btn-secondary text-xs py-1.5 flex-1 justify-center">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => { setEditing(c); setShowModal(true) }}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => toggleActive(c)}>
                  {c.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => deleteCampaign(c.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CampaignModal
          campaign={editing}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadCampaigns() }}
        />
      )}
    </div>
  )
}
