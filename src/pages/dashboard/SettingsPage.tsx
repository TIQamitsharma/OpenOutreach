import { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { UserConfig } from '../../lib/database.types'

const PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'openai_compatible']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type ConfigPayload = Omit<Partial<UserConfig>, 'id' | 'created_at' | 'updated_at'>

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [config, setConfig] = useState<ConfigPayload>({
    llm_provider: 'openai',
    llm_api_key: '',
    llm_api_base: '',
    ai_model: '',
    linkedin_username: '',
    linkedin_password_enc: '',
    connect_daily_limit: 20,
    connect_weekly_limit: 100,
    follow_up_daily_limit: 25,
    active_hours_enabled: false,
    active_start_hour: 9,
    active_end_hour: 19,
    active_timezone: 'UTC',
    rest_days: [5, 6],
  })
  const [showPw, setShowPw] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'account' | 'linkedin' | 'llm' | 'limits'>('account')

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => { if (user) loadConfig() }, [user])
  useEffect(() => { setFullName(profile?.full_name || '') }, [profile])

  async function loadConfig() {
    const { data } = await supabase.from('user_configs').select('*').eq('user_id', user!.id).maybeSingle()
    if (data) {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = data as UserConfig & { id: string; created_at: string; updated_at: string }
      setConfig(rest)
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      if (tab === 'account') {
        const { error: e } = await supabase.from('user_profiles').update({ full_name: fullName }).eq('id', user.id)
        if (e) throw e
        await refreshProfile()
      } else {
        const { error: e } = await supabase.from('user_configs').upsert(
          { ...config, user_id: user.id },
          { onConflict: 'user_id' }
        )
        if (e) throw e
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    setPwError('')
    setPwSaved(false)
    const { error: e } = await supabase.auth.updateUser({ password: newPassword })
    if (e) {
      setPwError(e.message)
    } else {
      setPwSaved(true)
      setNewPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    }
    setPwSaving(false)
  }

  function toggleRestDay(day: number) {
    const current = config.rest_days || []
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    setConfig({ ...config, rest_days: updated })
  }

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'llm', label: 'LLM / AI' },
    { id: 'limits', label: 'Rate Limits' },
  ] as const

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and automation configuration</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-brand-600 bg-white border-b-2 border-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Settings saved successfully</div>}

          {tab === 'account' && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-gray-50" value={profile?.email || ''} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
              </div>
              <div>
                <label className="label">Plan</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="capitalize font-semibold text-gray-900">{profile?.plan || 'Free'}</span>
                  <span className={`badge ${profile?.plan_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {profile?.plan_status || 'active'}
                  </span>
                </div>
              </div>

              <button className="btn-primary text-sm" disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 text-sm">Change Password</span>
                </div>
                {pwError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwError}</div>}
                {pwSaved && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Password updated successfully</div>}
                <div className="relative mb-3">
                  <input
                    className="input pr-10"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="New password (min. 8 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button className="btn-secondary text-sm" disabled={pwSaving || !newPassword} onClick={handleChangePassword}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </>
          )}

          {tab === 'linkedin' && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Your LinkedIn credentials are stored securely and are only used by the automation daemon running on the server.
              </div>
              <div>
                <label className="label">LinkedIn Email</label>
                <input className="input" type="email" placeholder="your@email.com" value={config.linkedin_username || ''} onChange={e => setConfig({ ...config, linkedin_username: e.target.value })} />
              </div>
              <div>
                <label className="label">LinkedIn Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={config.linkedin_password_enc || ''}
                    onChange={e => setConfig({ ...config, linkedin_password_enc: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button className="btn-primary text-sm" disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save LinkedIn Credentials'}
              </button>
            </>
          )}

          {tab === 'llm' && (
            <>
              <div>
                <label className="label">LLM Provider</label>
                <select className="input" value={config.llm_provider || 'openai'} onChange={e => setConfig({ ...config, llm_provider: e.target.value })}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">API Key</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={config.llm_api_key || ''}
                    onChange={e => setConfig({ ...config, llm_api_key: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {config.llm_provider === 'openai_compatible' && (
                <div>
                  <label className="label">API Base URL</label>
                  <input className="input" type="url" placeholder="https://api.example.com/v1" value={config.llm_api_base || ''} onChange={e => setConfig({ ...config, llm_api_base: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Model Name</label>
                <input className="input" placeholder="e.g. gpt-4o-mini" value={config.ai_model || ''} onChange={e => setConfig({ ...config, ai_model: e.target.value })} />
              </div>
              <button className="btn-primary text-sm" disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save LLM Settings'}
              </button>
            </>
          )}

          {tab === 'limits' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Connect/Day</label>
                  <input className="input" type="number" min={1} max={50} value={config.connect_daily_limit || 20} onChange={e => setConfig({ ...config, connect_daily_limit: +e.target.value })} />
                </div>
                <div>
                  <label className="label">Connect/Week</label>
                  <input className="input" type="number" min={1} max={300} value={config.connect_weekly_limit || 100} onChange={e => setConfig({ ...config, connect_weekly_limit: +e.target.value })} />
                </div>
                <div>
                  <label className="label">Follow-ups/Day</label>
                  <input className="input" type="number" min={1} max={100} value={config.follow_up_daily_limit || 25} onChange={e => setConfig({ ...config, follow_up_daily_limit: +e.target.value })} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Active Hours</div>
                    <p className="text-xs text-gray-500">Only run automation during business hours</p>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.active_hours_enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
                    onClick={() => setConfig({ ...config, active_hours_enabled: !config.active_hours_enabled })}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.active_hours_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {config.active_hours_enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-brand-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label text-xs">Start Hour</label>
                        <input className="input text-sm" type="number" min={0} max={23} value={config.active_start_hour || 9} onChange={e => setConfig({ ...config, active_start_hour: +e.target.value })} />
                      </div>
                      <div>
                        <label className="label text-xs">End Hour</label>
                        <input className="input text-sm" type="number" min={0} max={23} value={config.active_end_hour || 19} onChange={e => setConfig({ ...config, active_end_hour: +e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label text-xs">Timezone</label>
                      <input className="input text-sm" placeholder="UTC" value={config.active_timezone || 'UTC'} onChange={e => setConfig({ ...config, active_timezone: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">Rest Days</label>
                      <div className="flex gap-2 flex-wrap">
                        {DAYS.map((day, i) => (
                          <button
                            key={day}
                            className={`w-9 h-9 rounded-lg text-xs font-medium border transition-colors ${(config.rest_days || []).includes(i) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
                            onClick={() => toggleRestDay(i)}
                            type="button"
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-primary text-sm" disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Rate Limits'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
