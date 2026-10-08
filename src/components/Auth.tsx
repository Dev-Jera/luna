import { useEffect, useState } from 'react'
import { Circle, Heart, Moon, Sun } from 'lucide-react'
import api from '../lib/api'
import PasswordRecovery from './PasswordRecovery'
import HowItWorks from './HowItWorks'
import PublicHome from './PublicHome'

export default function Auth() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('belong-theme')
    return savedTheme === null || savedTheme === 'dark'
  })
  const [mode, setMode] = useState<'login' | 'register'>(() => location.pathname === '/login' ? 'login' : 'register')
  const [recovering, setRecovering] = useState(false)
  const [route, setRoute] = useState(location.pathname)
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
    history.pushState({}, '', `/${next}`)
    setRoute(`/${next}`)
  }

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    localStorage.setItem('belong-theme', nextIsDark ? 'dark' : 'light')
  }

  useEffect(() => {
    const update = () => {
      setRoute(location.pathname)
      if (location.pathname === '/login' || location.pathname === '/register') {
        setMode(location.pathname === '/login' ? 'login' : 'register')
      }
    }
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const navigate = (path: string) => {
    history.pushState({}, '', path)
    setRoute(path)
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
        setError('Belong cannot reach the server. Check that Django is running and try again.')
      } else {
        setError(message || 'We could not continue. Please try again.')
      }
      setBusy(false)
    }
  }

  if (route === '/how-it-works') {
    return (
      <HowItWorks
        onHome={() => navigate('/')}
        onJoin={() => begin('register')}
        onSignIn={() => begin('login')}
      />
    )
  }

  if (route !== '/login' && route !== '/register') {
    return (
      <PublicHome
        onAbout={() => navigate('/how-it-works')}
        onJoin={() => begin('register')}
        onSignIn={() => begin('login')}
      />
    )
  }

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-[#168eea] focus:ring-4 focus:ring-[#168eea]/10 ${
    isDark
      ? 'border-[#334155] bg-[#111923] text-[#e8eef6] placeholder:text-[#8190a4]'
      : 'border-[#d7e1ee] bg-white text-[#171b24] placeholder:text-[#98a2b3]'
  }`
  const labelClass = `mb-1.5 block text-xs font-medium ${isDark ? 'text-[#b7c3d2]' : 'text-[#465264]'}`
  const mutedTextClass = isDark ? 'text-[#9eacbd]' : 'text-[#788397]'
  const secondaryButtonClass = isDark
    ? 'text-[#c1ccda] hover:bg-white/5 hover:text-white'
    : 'text-[#596579] hover:bg-[#f5f8fc] hover:text-[#171b24]'

  return (
    <main
      className={`min-h-screen transition-colors duration-200 selection:bg-[#168eea]/20 ${isDark ? 'bg-[#0b1118] text-[#e8eef6]' : 'bg-white text-[#171b24]'}`}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <header className="mx-auto flex h-[76px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168eea] ${isDark ? 'text-white' : 'text-[#171b24]'}`}
          aria-label="Belong home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#168eea] text-white">
            <Heart size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Belong</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-pressed={isDark}
            className={`grid h-10 w-10 place-items-center rounded-full transition ${secondaryButtonClass}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate('/how-it-works')}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${secondaryButtonClass}`}
          >
            How it works
          </button>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-76px)] items-start justify-center px-5 pb-12 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[410px]">
          <div className="mb-6 flex justify-center gap-1.5" aria-hidden="true">
            <span className={`h-1.5 w-1.5 rounded-full ${mode === 'register' ? 'bg-[#168eea]' : isDark ? 'bg-[#39485a]' : 'bg-[#c8d3e2]'}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${mode === 'login' ? 'bg-[#168eea]' : isDark ? 'bg-[#39485a]' : 'bg-[#c8d3e2]'}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#39485a]' : 'bg-[#c8d3e2]'}`} />
          </div>

          <div className={`rounded-[28px] border px-6 py-7 shadow-[0_16px_50px_rgba(35,63,97,0.08)] transition-colors duration-200 sm:px-9 sm:py-9 ${
            isDark ? 'border-[#202d3a] bg-[#111923] shadow-black/30' : 'border-[#edf1f6] bg-white'
          }`}>
            <div className="mb-6 flex items-center gap-2">
              <Circle size={17} strokeWidth={4} className="text-[#168eea]" />
              <span className={`font-display text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#171b24]'}`}>Belong</span>
            </div>

            <h1 className={`font-display text-[30px] font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-[#111722]'}`}>
              {recovering ? 'Reset your password' : mode === 'login' ? 'Welcome back' : 'Spark something new'}
            </h1>
            <p className={`mt-2 text-sm leading-relaxed ${mutedTextClass}`}>
              {recovering
                ? 'Use your verified phone number to reset access.'
                : mode === 'login'
                  ? 'Ready to pick up where you left off?'
                  : 'Find your people.'}
            </p>

            {recovering ? (
              <div className="mt-6">
                <PasswordRecovery onBack={() => setRecovering(false)} isDark={isDark} />
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className={labelClass} htmlFor="auth-first-name">Your name</label>
                      <input
                        id="auth-first-name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="What should we call you?"
                        className={inputClass}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="auth-phone">Phone number</label>
                      <input
                        id="auth-phone"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+254..."
                        className={inputClass}
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className={labelClass} htmlFor="auth-username">Username</label>
                  <input
                    id="auth-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className={inputClass}
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                    minLength={8}
                    className={inputClass}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setRecovering(true)}
                      className="mt-2 block w-full text-right text-xs font-medium text-[#168eea] hover:text-[#0875c6]"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {mode === 'register' && (
                  <div className={`space-y-3 pt-1 text-xs leading-relaxed ${isDark ? 'text-[#b7c3d2]' : 'text-[#596579]'}`}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={adult}
                        onChange={e => setAdult(e.target.checked)}
                        required
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c7d2e0] accent-[#168eea] focus:ring-[#168eea]/25"
                      />
                      <span>I confirm that I am 18 or older.</span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={legal}
                        onChange={e => setLegal(e.target.checked)}
                        required
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c7d2e0] accent-[#168eea] focus:ring-[#168eea]/25"
                      />
                      <span>I accept Belong’s Terms, Privacy Notice, and Community Guidelines.</span>
                    </label>
                  </div>
                )}

                {success && (
                  <p role="status" className={`rounded-xl border p-3 text-sm font-medium ${isDark ? 'border-emerald-800 bg-emerald-950/50 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                    {success}
                  </p>
                )}
                {error && (
                  <p role="alert" className={`rounded-xl border p-3 text-sm font-medium ${isDark ? 'border-rose-900 bg-rose-950/50 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 w-full rounded-full bg-[#168eea] py-3.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(22,142,234,0.22)] transition hover:bg-[#087bd0] active:scale-[0.98] disabled:opacity-50"
                >
                  {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>

                <div className={`pt-1 text-center text-xs ${isDark ? 'text-[#9eacbd]' : 'text-[#7b8799]'}`}>
                  {mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => begin(mode === 'login' ? 'register' : 'login')}
                    className="font-semibold text-[#168eea] hover:text-[#0875c6]"
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className={`mt-5 text-center text-xs ${isDark ? 'text-[#77869a]' : 'text-[#a0a9b7]'}`}>
            Private by default. Always on your terms.
          </p>
        </div>
      </section>
    </main>
  )
}
