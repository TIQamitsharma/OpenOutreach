import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck as CheckCircle2, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'openai_compatible']

const PROVIDER_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  google: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-small',
  cohere: 'command-r-plus',
  openai_compatible: '',
}

const STEPS = ['LinkedIn Account', 'LLM Settings', 'Rate Limits', 'Done']

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [linkedinUsername, setLinkedinUsername] = useState('')
  const [linkedinPassword, setLinkedinPassword] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)

  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmApiBase, setLlmApiBase] = useState('')
  const [aiModel, setAiModel] = useState(PROVIDER_MODELS['openai'])

  const [connectDaily, setConnectDaily] = useState(20)
  const [connectWeekly, setConnectWeekly] = useState(100)
  const [followUpDaily, setFollowUpDaily] = useState(25)

  async function handleComplete() {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const { error: upsertErr } = await supabase.from('user_configs').upsert({
        user_id: user.id,
        linkedin_username: linkedinUsername,
        linkedin_password_enc: linkedinPassword,
        llm_provider: llmProvider,
        llm_api_key: llmApiKey,
        llm_api_base: llmApiBase,
        ai_model: aiModel,
        connect_daily_limit: connectDaily,
        connect_weekly_limit: connectWeekly,
        follow_up_daily_limit: followUpDaily,
      })
      if (upsertErr) throw upsertErr

      await supabase.from('user_profiles').update({
        onboarding_completed: true,
        legal_accepted: true,
        legal_accepted_at: new Date().toISOString(),
      }).eq('id', user.id)

      await refreshProfile()
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set up your account</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your LinkedIn credentials and AI settings to start automating</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-brand-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="card p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">LinkedIn Account</h2>
              <p className="text-sm text-gray-500 mb-4">Your credentials are encrypted and stored securely. They are never shared.</p>
            </div>
            <div>
              <label className="label">LinkedIn Email / Username</label>
              <input className="input" type="text" placeholder="your@email.com" value={linkedinUsername} onChange={e => setLinkedinUsername(e.target.value)} />
            </div>
            <div>
              <label className="label">LinkedIn Password</label>
              <input className="input" type="password" placeholder="••••••••" value={linkedinPassword} onChange={e => setLinkedinPassword(e.target.value)} />
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <input type="checkbox" id="legal" className="mt-0.5 accent-amber-600" checked={legalAccepted} onChange={e => setLegalAccepted(e.target.checked)} />
              <label htmlFor="legal" className="text-sm text-amber-800 leading-relaxed">
                I understand that LinkedIn automation carries risk to my account and accept full responsibility. I will not use this tool for spam or harassment.
              </label>
            </div>
            <button
              className="btn-primary w-full justify-center"
              disabled={!linkedinUsername || !linkedinPassword || !legalAccepted}
              onClick={() => setStep(1)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">LLM Settings (Bring Your Own Key)</h2>
              <p className="text-sm text-gray-500 mb-4">Use your own API key — we never markup AI costs.</p>
            </div>
            <div>
              <label className="label">LLM Provider</label>
              <select className="input" value={llmProvider} onChange={e => { setLlmProvider(e.target.value); setAiModel(PROVIDER_MODELS[e.target.value] || '') }}>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">API Key</label>
              <input className="input" type="password" placeholder="sk-..." value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)} />
            </div>
            {llmProvider === 'openai_compatible' && (
              <div>
                <label className="label">API Base URL</label>
                <input className="input" type="url" placeholder="https://api.example.com/v1" value={llmApiBase} onChange={e => setLlmApiBase(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Model Name</label>
              <input className="input" type="text" placeholder="e.g. gpt-4o-mini" value={aiModel} onChange={e => setAiModel(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary flex-1 justify-center" disabled={!llmApiKey} onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Rate Limits</h2>
              <p className="text-sm text-gray-500 mb-4">Conservative limits protect your LinkedIn account. Adjust based on your plan and risk tolerance.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Connect/Day</label>
                <input className="input" type="number" min={1} max={50} value={connectDaily} onChange={e => setConnectDaily(+e.target.value)} />
              </div>
              <div>
                <label className="label">Connect/Week</label>
                <input className="input" type="number" min={1} max={300} value={connectWeekly} onChange={e => setConnectWeekly(+e.target.value)} />
              </div>
              <div>
                <label className="label">Follow-ups/Day</label>
                <input className="input" type="number" min={1} max={100} value={followUpDaily} onChange={e => setFollowUpDaily(+e.target.value)} />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              Recommended: 20 connects/day, 100/week. Exceeding LinkedIn's soft limits may trigger restrictions.
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary flex-1 justify-center" disabled={saving} onClick={handleComplete}>
                {saving ? 'Saving…' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-gray-500 text-sm mb-6">Your account is configured. Create your first campaign to start generating leads.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary" onClick={() => navigate('/dashboard/campaigns')}>Create First Campaign</button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
