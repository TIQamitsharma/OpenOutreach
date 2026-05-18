import { useEffect, useState } from 'react'
import { Save, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PlanLimit {
  campaigns: number
  daily_connects: number
  weekly_connects: number
  follow_ups: number
  max_accounts: number
}

interface Settings {
  razorpay_key_id: string
  razorpay_key_secret: string
  maintenance_mode: boolean
  announcement: string
  plan_limits: Record<string, PlanLimit>
}

const DEFAULT_LIMITS: Record<string, PlanLimit> = {
  free:     { campaigns: 1, daily_connects: 10, weekly_connects: 50, follow_ups: 10, max_accounts: 1 },
  starter:  { campaigns: 3, daily_connects: 20, weekly_connects: 100, follow_ups: 25, max_accounts: 1 },
  pro:      { campaigns: 10, daily_connects: 35, weekly_connects: 200, follow_ups: 50, max_accounts: 3 },
  business: { campaigns: 999, daily_connects: 50, weekly_connects: 300, follow_ups: 100, max_accounts: 10 },
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    maintenance_mode: false,
    announcement: '',
    plan_limits: DEFAULT_LIMITS,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [tab, setTab] = useState<'razorpay' | 'limits' | 'platform'>('razorpay')

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).maybeSingle()
    if (data) {
      setSettings({
        razorpay_key_id: data.razorpay_key_id || '',
        razorpay_key_secret: data.razorpay_key_secret || '',
        maintenance_mode: data.maintenance_mode || false,
        announcement: data.announcement || '',
        plan_limits: (data.plan_limits as Record<string, PlanLimit>) || DEFAULT_LIMITS,
      })
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: e } = await supabase.from('admin_settings').update({
      razorpay_key_id: settings.razorpay_key_id,
      razorpay_key_secret: settings.razorpay_key_secret,
      maintenance_mode: settings.maintenance_mode,
      announcement: settings.announcement,
      plan_limits: settings.plan_limits as unknown as import('../../lib/database.types').Json,
    }).eq('id', 1)
    if (e) { setError(e.message) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  function updateLimit(plan: string, field: keyof PlanLimit, value: number) {
    setSettings(prev => ({
      ...prev,
      plan_limits: {
        ...prev.plan_limits,
        [plan]: { ...prev.plan_limits[plan], [field]: value },
      },
    }))
  }

  const tabs = [
    { id: 'razorpay', label: 'Razorpay' },
    { id: 'limits', label: 'Plan Limits' },
    { id: 'platform', label: 'Platform' },
  ] as const

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configure billing, plan limits, and platform behavior</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-700">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`px-6 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-brand-400 border-b-2 border-brand-400 bg-gray-900/50' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {saved && <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Settings saved</div>}

          {tab === 'razorpay' && (
            <>
              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-300">
                Add your Razorpay API keys to enable subscription payments. You can get these from your{' '}
                <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="underline">Razorpay Dashboard</a>.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Razorpay Key ID</label>
                <input
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-600"
                  placeholder="rzp_live_..."
                  value={settings.razorpay_key_id}
                  onChange={e => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Razorpay Key Secret</label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-600"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••"
                    value={settings.razorpay_key_secret}
                    onChange={e => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg text-sm text-gray-400">
                <strong className="text-gray-300">Razorpay Plan IDs</strong> — After creating plans in your Razorpay dashboard, update the plan IDs in the frontend <code className="text-brand-300">BillingPage.tsx</code> to connect them to the checkout flow.
              </div>
            </>
          )}

          {tab === 'limits' && (
            <div className="space-y-6">
              {Object.entries(settings.plan_limits).map(([plan, limits]) => (
                <div key={plan} className="border border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white capitalize mb-3">{plan} Plan</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(limits) as [keyof PlanLimit, number][]).map(([field, value]) => (
                      <div key={field}>
                        <label className="text-xs text-gray-500 mb-1 block">{field.replace(/_/g, ' ')}</label>
                        <input
                          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          type="number"
                          min={0}
                          value={value}
                          onChange={e => updateLimit(plan, field, +e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'platform' && (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">Maintenance Mode</div>
                  <p className="text-xs text-gray-400 mt-0.5">Block all new signups and show maintenance page</p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-600'}`}
                  onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Platform Announcement</label>
                <textarea
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-600 min-h-[80px]"
                  placeholder="Optional: shown as a banner to all users"
                  value={settings.announcement}
                  onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                />
              </div>
            </>
          )}

          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60" disabled={saving} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
