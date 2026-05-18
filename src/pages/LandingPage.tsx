import { Link } from 'react-router-dom'
import { Brain, Shield, Zap, ChartBar as BarChart3, MessageSquare, Target, CircleCheck as CheckCircle2, ArrowRight, Star, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'

const PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Try out the platform with basic features.',
    features: [
      '1 LinkedIn account',
      '1 active campaign',
      '10 connection requests/day',
      '50 connections/week',
      '10 follow-ups/day',
      'Basic CRM',
    ],
    cta: 'Start Free',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '999',
    period: '/month',
    description: 'For solo founders and early-stage sales.',
    features: [
      '1 LinkedIn account',
      '3 active campaigns',
      '20 connection requests/day',
      '100 connections/week',
      '25 follow-ups/day',
      'Full CRM + conversations',
      'BYOK (any LLM provider)',
    ],
    cta: 'Get Starter',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '2,499',
    period: '/month',
    description: 'For growing sales teams that need scale.',
    features: [
      '3 LinkedIn accounts',
      '10 active campaigns',
      '35 connection requests/day',
      '200 connections/week',
      '50 follow-ups/day',
      'Full CRM + conversations',
      'BYOK (any LLM provider)',
      'Priority support',
    ],
    cta: 'Get Pro',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '5,999',
    period: '/month',
    description: 'For agencies and high-volume teams.',
    features: [
      '10 LinkedIn accounts',
      'Unlimited campaigns',
      '50 connection requests/day',
      '300 connections/week',
      '100 follow-ups/day',
      'Full CRM + conversations',
      'BYOK (any LLM provider)',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Get Business',
    href: '/signup',
    highlighted: false,
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Bayesian Active Learning',
    desc: 'A Gaussian Process model learns your ideal customer from every LLM qualification decision — gets smarter with every lead.',
  },
  {
    icon: Target,
    title: 'Autonomous Lead Discovery',
    desc: 'No contact lists needed. AI generates LinkedIn search queries from your product description and discovers your ideal prospects.',
  },
  {
    icon: Shield,
    title: 'Stealth Browser Automation',
    desc: 'Playwright + stealth plugins mimic real human behavior. Voyager API for structured data — no fragile HTML scraping.',
  },
  {
    icon: MessageSquare,
    title: 'AI Follow-Up Agent',
    desc: 'Reads conversation history, sends personalized follow-ups, and manages multi-turn conversations autonomously.',
  },
  {
    icon: BarChart3,
    title: 'Full CRM Dashboard',
    desc: 'Track every lead through QUALIFIED → CONNECTED → COMPLETED with outcomes, deal summaries, and pipeline metrics.',
  },
  {
    icon: Zap,
    title: 'Bring Your Own Keys',
    desc: 'Use your own OpenAI, Anthropic, Google, Groq, Mistral, or any OpenAI-compatible endpoint. Zero markup on AI costs.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    role: 'Founder, DevTools SaaS',
    text: 'We went from 0 to 40 qualified conversations in 3 weeks. The Bayesian ML actually learns — by week 2 it was finding leads I would have hand-picked myself.',
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Sales, B2B Analytics',
    text: 'Tried every LinkedIn tool. This is the first one that actually understands intent matching. The follow-up agent handles 90% of early-stage conversations.',
    stars: 5,
  },
  {
    name: 'Ravi Nair',
    role: 'Agency Owner',
    text: 'Running 8 client campaigns simultaneously on the Business plan. The multi-account support and campaign isolation work perfectly.',
    stars: 5,
  },
]

const FAQS = [
  {
    q: 'Is this safe to use on my LinkedIn account?',
    a: 'OpenOutreach uses Playwright with stealth plugins to mimic real human behavior, including random delays, human-like typing speeds, and session management. The built-in rate limits stay well within LinkedIn\'s tolerances. No tool can guarantee zero risk, but we\'ve designed every interaction to look as natural as possible.',
  },
  {
    q: 'What LLM providers do you support?',
    a: 'Any. OpenAI, Anthropic, Google Gemini, Groq, Mistral, Cohere, or any OpenAI-compatible endpoint. You bring your own API key — we never touch your AI costs or mark up usage.',
  },
  {
    q: 'Do I need to provide a list of leads?',
    a: 'No. You describe your product and target market in plain English. The AI generates LinkedIn search queries, discovers candidate profiles, qualifies them with your LLM, and contacts them — entirely autonomously.',
  },
  {
    q: 'Where does my data live?',
    a: 'Your data is stored in our Supabase-backed database with row-level security — only you can access your leads, conversations, and campaign data. LinkedIn credentials are encrypted at rest.',
  },
  {
    q: 'Can I self-host this?',
    a: 'Yes. OpenOutreach is fully open-source on GitHub under GPLv3. The SaaS version on this platform is a managed convenience layer using the same open-source engine.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">OpenOutreach</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link to="/login" className="text-sm text-gray-700">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white pt-20 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-powered LinkedIn automation
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Describe your product.<br />
            <span className="text-brand-600">The AI finds your leads.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            OpenOutreach autonomously discovers, qualifies, and contacts your ideal B2B prospects on LinkedIn — no contact lists required. A Bayesian ML model learns your ideal customer profile from every decision it makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary text-base px-8 py-3.5">
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5">
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400">No credit card required · Free plan available</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-6xl mx-auto px-4 mt-16">
          <div className="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-50">
            <div className="bg-gray-800 h-8 flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-4 bg-gray-700 rounded text-xs text-gray-400 flex items-center justify-center">app.openoutreach.in/dashboard</div>
            </div>
            <div className="bg-white p-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Total Leads', value: '1,284', change: '+48 today' },
                { label: 'Connected', value: '342', change: '26.6% rate' },
                { label: 'In Progress', value: '89', change: '7 replied today' },
                { label: 'Converted', value: '23', change: '6.7% close rate' },
              ].map(stat => (
                <div key={stat.label} className="card p-4">
                  <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-green-600 mt-1">{stat.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need for LinkedIn outreach</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Built on open-source infrastructure. No black boxes, no vendor lock-in.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl border border-gray-200 hover:border-brand-200 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <f.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">From setup to closed deals in 4 steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Describe your product', desc: 'Write your product docs and target market in plain English. No spreadsheets needed.' },
              { n: '2', title: 'AI discovers leads', desc: 'GPT-generated search queries find LinkedIn profiles matching your ideal customer profile.' },
              { n: '3', title: 'ML qualifies each lead', desc: 'Bayesian GPR model + LLM classify every profile. The model learns from each decision.' },
              { n: '4', title: 'AI handles outreach', desc: 'Connection requests, follow-ups, and multi-turn conversations — all automated.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{step.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by sales teams</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">All prices in INR. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`card p-6 flex flex-col ${plan.highlighted ? 'border-brand-500 ring-2 ring-brand-500 relative' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
                )}
                <div className="mb-4">
                  <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={plan.highlighted ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start finding your ideal customers today</h2>
          <p className="text-brand-100 text-lg mb-10">Free forever plan available. No credit card required.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-lg hover:bg-brand-50 transition-colors text-base">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">OpenOutreach</span>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <div className="text-sm">© 2026 OpenOutreach. GPLv3 Open Source.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
