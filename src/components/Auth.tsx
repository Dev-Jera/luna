import { useEffect, useState } from 'react'
import { Circle, ShieldCheck, X, ArrowRight } from 'lucide-react'
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

  const begin = (next: 'login' | 'register' = 'register') => {
    setMode(next)
    setRecovering(false)
    setError('')
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
    } finally {
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

  return (
    <main className="min-h-screen bg-[#9c6644] text-[#f5ebe0] selection:bg-[#f27059]/20 noise flex flex-col justify-between relative overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 bg-[#1e1410] border-b border-[#f5ebe0]/10 px-6 sm:px-12 flex h-20 items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#f5ebe0] focus:outline-none"
        >
          <Circle size={18} strokeWidth={4} className="text-[#f27059]" />
          <span className="font-display text-xl tracking-tight">luna<span className="text-[#f27059]">.</span></span>
        </button>
        <div className="flex items-center gap-6 text-sm font-medium text-[#f5ebe0]/80 sm:gap-8">
          <button
            onClick={() => navigate('/how-it-works')}
            className="hover:text-[#f27059] transition-colors duration-200"
          >
            How Luna Protects You
          </button>
          <button
            onClick={() => begin('login')}
            className="hover:text-[#f27059] transition-colors duration-200 hidden sm:block"
          >
            Sign in
          </button>
          <button
            onClick={() => begin('register')}
            className="rounded-full bg-[#f27059] px-6 py-2.5 font-semibold text-white hover:bg-[#e05e47] active:scale-95 transition-all duration-200"
          >
            Join Luna
          </button>
        </div>
      </nav>

      {/* Main mockup landing card container */}
      <div className="flex-1 flex flex-col md:flex-row-reverse items-stretch z-10 w-full bg-[#1e1410]">
        {/* Right Column (Mascot Illustration) */}
        <div className="w-full md:w-1/2 h-[380px] md:h-auto relative overflow-hidden bg-[#1e1410] flex-initial md:flex-1 flex items-center justify-center p-8">
          <img
            src="/static/alternative-image.jpg"
            alt="Luna AI Mascot"
            className="w-full max-w-[340px] md:max-w-[420px] aspect-square object-contain"
          />
        </div>

        {/* Left Column (Content) */}
        <div className="flex-initial md:flex-1 flex flex-col justify-center items-start px-6 sm:px-12 md:px-20 lg:px-28 py-12 md:py-20 max-w-2xl mx-auto md:mx-0 bg-[#1e1410]">
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#8ea869] mb-4">
              Your private matchmaking concierge
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight text-[#ffffff] mb-6">
              Talk to Luna AI
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#f5ebe0]/90 mb-8 max-w-lg">
              You have no private matches yet. Find real connections by starting your AI interview.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => begin('register')}
              className="w-full sm:w-auto rounded-full bg-[#f27059] text-sm font-bold text-white py-4 px-8 flex items-center justify-center gap-2 hover:bg-[#e05e47] active:scale-[0.98] transition-all shadow-soft"
            >
              New Onboarding Chat +
            </button>

            <button
              onClick={() => navigate('/how-it-works')}
              className="w-full sm:w-auto text-center rounded-full border-2 border-[#f5ebe0]/20 bg-transparent text-sm font-semibold text-[#f5ebe0] py-4 px-8 hover:bg-[#8ea869] hover:text-[#1e1410] hover:border-[#8ea869] active:scale-[0.98] transition-all"
            >
              How Luna Protects You
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#f5ebe0]/10 py-8 bg-[#1e1410] z-10">
        <div className="mx-auto flex max-w-6xl justify-center px-6 text-xs text-[#f5ebe0]/60">
          <span>© {new Date().getFullYear()} Luna. All rights reserved.</span>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1410]/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] border border-[#f5ebe0]/10 bg-[#1e1410] p-8 text-[#f5ebe0] shadow-premium animate-slide-up">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-6 top-6 p-1.5 rounded-full hover:bg-[#f5ebe0]/10 text-[#f5ebe0]/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Circle size={22} strokeWidth={4} className="text-[#f27059]" />
              <span className="font-display font-bold text-lg tracking-tight">luna<span className="text-[#f27059]">.</span></span>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-white font-display">
              {recovering ? 'Reset your password' : mode === 'login' ? 'Welcome back' : 'Let’s get to know you'}
            </h2>
            <p className="mt-2 text-sm text-[#f5ebe0]/80 leading-relaxed">
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
                      <label className="text-xs font-semibold text-[#f5ebe0]/80 uppercase tracking-wider block mb-1">Your name</label>
                      <input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="What should we call you?"
                        className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#f5ebe0]/80 uppercase tracking-wider block mb-1">Phone number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+254..."
                        className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-semibold text-[#f5ebe0]/80 uppercase tracking-wider block mb-1">Username</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5ebe0]/80 uppercase tracking-wider block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div className="space-y-3.5 pt-2 text-xs text-[#f5ebe0]/80">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adult}
                        onChange={e => setAdult(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-[#f5ebe0]/10 text-[#f27059] focus:ring-[#f27059]/20 h-4 w-4"
                      />
                      <span>I confirm that I am 18 or older.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={legal}
                        onChange={e => setLegal(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-[#f5ebe0]/10 text-[#f27059] focus:ring-[#f27059]/20 h-4 w-4"
                      />
                      <span>I accept Luna’s Terms, Privacy Notice, and Community Guidelines.</span>
                    </label>
                  </div>
                )}

                {error && (
                  <p className="text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200/50 rounded-xl p-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[#f27059] py-3.5 font-bold text-white shadow-premium hover:bg-[#e05e47] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {busy ? 'One moment…' : mode === 'login' ? 'Enter Luna' : 'Create account'}
                </button>

                <div className="space-y-2.5 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                    className="text-sm font-semibold text-[#f27059] hover:text-[#e05e47]"
                  >
                    {mode === 'login' ? 'New here? Join Luna' : 'Already have an account? Sign in'}
                  </button>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setRecovering(true)}
                      className="block w-full text-xs font-semibold text-[#f5ebe0]/80 hover:text-white"
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
