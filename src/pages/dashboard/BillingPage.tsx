import { useEffect, useState } from 'react'
import { CreditCard, CircleCheck as CheckCircle2, ExternalLink, CircleAlert as AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Subscription } from '../../lib/database.types'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['1 LinkedIn account', '1 campaign', '10 connects/day', '50 connects/week', '10 follow-ups/day'],
    razorpayPlanId: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹999',
    period: '/month',
    features: ['1 LinkedIn account', '3 campaigns', '20 connects/day', '100 connects/week', '25 follow-ups/day', 'Priority support'],
    razorpayPlanId: 'plan_starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹2,499',
    period: '/month',
    features: ['3 LinkedIn accounts', '10 campaigns', '35 connects/day', '200 connects/week', '50 follow-ups/day', 'Priority support'],
    razorpayPlanId: 'plan_pro',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '₹5,999',
    period: '/month',
    features: ['10 LinkedIn accounts', 'Unlimited campaigns', '50 connects/day', '300 connects/week', '100 follow-ups/day', 'Dedicated support'],
    razorpayPlanId: 'plan_business',
  },
]

export default function BillingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  void loading

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).maybeSingle()
    setSubscription(data)
    setLoading(false)
  }

  async function handleSubscribe(planId: string, razorpayPlanId: string | null) {
    if (!razorpayPlanId || !user) return
    setSubscribing(planId)

    // In production, this would call a Supabase edge function that creates
    // a Razorpay subscription and returns the checkout URL/order ID.
    // For now, show the integration placeholder.
    alert(`Razorpay integration: Plan ${planId} (${razorpayPlanId}).\n\nConnect your Razorpay keys in Admin Settings to enable payments.`)
    setSubscribing(null)
  }

  async function handleCancel() {
    if (!subscription || !confirm('Cancel your subscription? You\'ll keep access until the period ends.')) return
    await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('id', subscription.id)
    loadData()
  }

  const currentPlan = profile?.plan || 'free'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your subscription and payment details</p>
      </div>

      {/* Current subscription */}
      {subscription && subscription.razorpay_subscription_id && (
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <CreditCard className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 capitalize">{subscription.plan} Plan</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {subscription.status}
                </span>
                {subscription.cancel_at_period_end && (
                  <span className="badge bg-orange-100 text-orange-700">Cancels at period end</span>
                )}
              </div>
              {subscription.current_period_end && (
                <p className="text-sm text-gray-500 mt-1">
                  {subscription.cancel_at_period_end ? 'Access until' : 'Renews'}: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            {!subscription.cancel_at_period_end && (
              <button className="btn-danger text-sm py-2" onClick={handleCancel}>Cancel Plan</button>
            )}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Payments are processed via <strong>Razorpay</strong>. Connect your Razorpay keys in the Admin panel to enable subscriptions.
        </p>
      </div>

      {/* Plan selection */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrentPlan = currentPlan === plan.id
          return (
            <div key={plan.id} className={`card p-5 flex flex-col ${plan.highlighted ? 'border-brand-400 ring-2 ring-brand-400' : ''} ${isCurrentPlan ? 'bg-brand-50' : ''}`}>
              {plan.highlighted && (
                <div className="text-center mb-2">
                  <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="mb-4">
                <div className="font-semibold text-gray-900">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-xs">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <div className="text-center py-2 text-sm font-medium text-brand-600">Current Plan</div>
              ) : plan.razorpayPlanId ? (
                <button
                  className={`${plan.highlighted ? 'btn-primary' : 'btn-secondary'} text-sm w-full justify-center`}
                  disabled={subscribing === plan.id}
                  onClick={() => handleSubscribe(plan.id, plan.razorpayPlanId)}
                >
                  {subscribing === plan.id ? 'Processing…' : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <button className="btn-secondary text-sm w-full justify-center" disabled>Free Plan</button>
              )}
            </div>
          )
        })}
      </div>

      {/* Invoice placeholder */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-gray-500" />
          Billing History
        </h3>
        {loading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : (
          <p className="text-sm text-gray-500">Invoice history will appear here once you have an active subscription. Invoices are issued via Razorpay.</p>
        )}
      </div>
    </div>
  )
}
