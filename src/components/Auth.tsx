import { useEffect, useState } from 'react'
import { Circle, ShieldCheck, X, ArrowRight, Heart, Users, MessageCircle, Sparkles } from 'lucide-react'
import api from '../lib/api'
import PasswordRecovery from './PasswordRecovery'
import HowItWorks from './HowItWorks'

export default function Auth() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [recovering, setRecovering] = useState(false)
  const [infoPage, setInfoPage] = useState(location.pathname === '/how-it-works')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [adult, setAdult] = useState(false)
  const [legal, setLegal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const begin = (next: 'login' | 'register' = 'register') => {
    setMode(next)
    setRecovering(false)
    setError('')
    setSuccess('')
    setOpen(true)
  }

  useEffect(() => {
    const update = () => setInfoPage(location.pathname === '/how-it-works')
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const navigate = (path: string) => {
    history.pushState({}, '', path)
    setInfoPage(path === '/how-it-works')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setSuccess('')
    const cleanUsername = username.trim().toLowerCase()
    try {
      if (mode === 'register') {
        await api.post('/auth/register/', {
          username: cleanUsername,
          password,
          first_name: firstName.trim(),
          phone_number: phone.trim(),
          is_18_or_older: adult,
          accept_terms: legal,
          accept_guidelines: legal,
        })
        setSuccess('Account created successfully! Please sign in with your password.')
        setMode('login')
        setPassword('')
        setBusy(false)
        return
      }
      await api.post('/auth/token/', { username: cleanUsername, password })
      location.reload()
    } catch (err: any) {
      const payload = err.response?.data
      const fields = payload?.error?.fields ?? payload
      const fieldMessages = fields && typeof fields === 'object'
        ? Object.values(fields).flat().filter(value => typeof value === 'string')
        : []
      const message = fieldMessages.join(' ') || payload?.error?.message
      if (!err.response) {
        setError('Luna cannot reach the server. Check that Django is running and try again.')
      } else {
        setError(message || 'We could not continue. Please try again.')
      }
      setBusy(false)
    }
  }

  if (infoPage) {
    return (
      <HowItWorks
        onHome={() => navigate('/')}
        onJoin={() => { navigate('/'); begin('register') }}
        onSignIn={() => { navigate('/'); begin('login') }}
      />
    )
  }

  const pillars = [
    { Icon: ShieldCheck, label: 'Private by default — no open DMs or public match lists' },
    { Icon: MessageCircle, label: 'One thoughtful match at a time, chosen quietly' },
    { Icon: Sparkles, label: 'Consent-first introductions, on your terms' }
  ]

  return (
    <main className="min-h-screen bg-[#c8102e] text-white selection:bg-[#dc2626]/40 noise flex flex-col relative overflow-hidden">
      {/* Navbar — sign in / sign up links sit above the actors photo */}
      <nav className="sticky top-0 z-10 bg-black border-b border-white/10 px-6 sm:px-12 flex h-20 items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white focus:outline-none"
        >
          <Circle size={18} strokeWidth={4} className="text-[#BF2121]" />
          <span className="font-display text-xl tracking-tight">luna<span className="text-[#BF2121]">.</span></span>
        </button>
        <div className="flex items-center gap-6 text-sm font-medium text-white/80 sm:gap-8">
          <button
            onClick={() => navigate('/how-it-works')}
            className="hover:text-white transition-colors duration-200"
          >
            How It Works
          </button>
          <button
            onClick={() => begin('login')}
            className="hover:text-white transition-colors duration-200 hidden sm:block"
          >
            Sign in
          </button>
          <button
            onClick={() => begin('register')}
            className="rounded-full bg-[#BF2121] px-6 py-2.5 font-semibold text-white hover:bg-[#a31a1a] active:scale-95 transition-all duration-200"
          >
            Join Luna
          </button>
        </div>
      </nav>

      {/* Hero — actors as full-bleed background, content on top */}
      <section className="relative flex-1 z-10 overflow-hidden">
        <img
          src="/static/actors.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 py-12 sm:py-20">
          {/* Words directly on the background */}
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-white mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Your private matchmaking concierge
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight text-white mb-6 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              Talk to Luna AI
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
              Luna gets to know your values, goals, and deal-breakers, then quietly introduces you to one thoughtful match at a time. No swiping. No public profile. Just meaningful connections.
            </p>

            <ul className="space-y-3 mb-8 max-w-2xl mx-auto">
              {pillars.map(({ Icon, label }) => (
                <li key={label} className="flex items-center justify-center gap-3 text-sm text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                  <span className="p-1.5 bg-[#BF2121]/80 rounded-lg shrink-0">
                    <Icon size={15} className="text-white" />
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <button
                onClick={() => begin('register')}
                className="w-full sm:w-auto rounded-full bg-[#BF2121] text-sm font-bold text-white py-4 px-8 flex items-center justify-center gap-2 hover:bg-[#a31a1a] active:scale-[0.98] transition-all shadow-soft"
              >
                New Onboarding Chat + <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="w-full sm:w-auto text-center rounded-full border-2 border-[#BF2121]/70 bg-black/30 text-sm font-semibold text-white py-4 px-8 hover:bg-[#BF2121] hover:border-[#BF2121] active:scale-[0.98] transition-all"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Relationship circles below */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12">
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 flex-col items-center justify-center gap-2 rounded-full bg-black/60 backdrop-blur border-4 border-white/25 shadow-2xl">
              <Heart size={28} className="text-[#BF2121] fill-[#BF2121]/40" />
              <span className="text-sm sm:text-base font-bold text-white">Romantic</span>
            </div>
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 flex-col items-center justify-center gap-2 rounded-full bg-black/60 backdrop-blur border-4 border-white/25 shadow-2xl">
              <Users size={28} className="text-white" />
              <span className="text-sm sm:text-base font-bold text-white">Friendship</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-8 bg-black z-10">
        <div className="mx-auto flex max-w-6xl justify-center px-6 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Luna. All rights reserved.</span>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-black p-8 text-white shadow-premium animate-slide-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-6 top-6 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Circle size={22} strokeWidth={4} className="text-[#BF2121]" />
              <span className="font-display font-bold text-lg tracking-tight">luna<span className="text-[#BF2121]">.</span></span>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white font-display">
              {recovering ? 'Reset your password' : mode === 'login' ? 'Welcome back' : 'Let’s get to know you'}
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              {recovering
                ? 'Use your verified phone number to reset access.'
                : mode === 'login'
                  ? 'Continue your private conversation with Luna.'
                  : 'Your phone will be verified before Luna begins matching.'}
            </p>

            {recovering ? (
              <div className="mt-6">
                <PasswordRecovery onBack={() => setRecovering(false)} />
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">Your name</label>
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="What should we call you?"
                        className="premium-input-dark !bg-white/5 !border-white/15 !text-white focus:!border-[#BF2121] focus:!ring-[#BF2121]/25"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">Phone number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+254..."
                        className="premium-input-dark !bg-white/5 !border-white/15 !text-white focus:!border-[#BF2121] focus:!ring-[#BF2121]/25"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">Username</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="premium-input-dark !bg-white/5 !border-white/15 !text-white focus:!border-[#BF2121] focus:!ring-[#BF2121]/25"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    className="premium-input-dark !bg-white/5 !border-white/15 !text-white focus:!border-[#BF2121] focus:!ring-[#BF2121]/25"
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div className="space-y-3.5 pt-2 text-xs text-white/80">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adult}
                        onChange={e => setAdult(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-white/15 text-[#BF2121] focus:ring-[#BF2121]/25 h-4 w-4"
                      />
                      <span>I confirm that I am 18 or older.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={legal}
                        onChange={e => setLegal(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-white/15 text-[#BF2121] focus:ring-[#BF2121]/25 h-4 w-4"
                      />
                      <span>I accept Luna’s Terms, Privacy Notice, and Community Guidelines.</span>
                    </label>
                  </div>
                )}

                {success && (
                  <p className="text-sm font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    {success}
                  </p>
                )}

                {error && (
                  <p className="text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200/50 rounded-xl p-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[#BF2121] py-3.5 font-bold text-white shadow-premium hover:bg-[#a31a1a] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {busy ? 'One moment…' : mode === 'login' ? 'Enter Luna' : 'Create account'}
                </button>

                <div className="space-y-2.5 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                    className="text-sm font-semibold text-[#BF2121] hover:text-[#bf5050]"
                  >
                    {mode === 'login' ? 'New here? Join Luna' : 'Already have an account? Sign in'}
                  </button>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setRecovering(true)}
                      className="block w-full text-xs font-semibold text-white/80 hover:text-white"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
