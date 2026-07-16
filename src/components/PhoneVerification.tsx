import { useState } from 'react'
import api from '../lib/api'

export default function PhoneVerification({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/phone/send/')
      setSent(true)
    } catch {
      setError('We could not send a code. Check the SMS configuration and try again.')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/phone/confirm/', { code })
      onVerified()
    } catch {
      setError('That code is invalid or has expired.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="noise grid min-h-screen place-items-center px-6 bg-warmbg text-cocoa-900 selection:bg-terracotta-200">
      <form onSubmit={confirm} className="glass w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 border border-cocoa-900/5 shadow-2xl animate-slide-up">
        <h1 className="text-2xl font-bold font-display text-cocoa-900">Verify your phone</h1>
        <p className="mt-3 text-xs sm:text-sm text-cocoa-500 leading-relaxed font-medium">
          We’ll send a six-digit verification code to <span className="text-cocoa-900 font-bold">{phone}</span>. It expires after 10 minutes.
        </p>

        {sent && (
          <div className="mt-6 space-y-1.5 animate-slide-up">
            <label className="text-xs font-bold uppercase tracking-wider text-cocoa-500 text-center block">Enter Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="premium-input text-center text-2xl tracking-[0.4em] font-bold py-4"
              required
            />
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200/50 p-3 rounded-xl">
            {error}
          </p>
        )}

        {sent ? (
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="mt-6 w-full rounded-full bg-terracotta-500 px-4 py-3.5 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? 'Verifying...' : 'Verify phone'}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className="mt-6 w-full rounded-full bg-terracotta-500 px-4 py-3.5 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? 'Sending...' : 'Send verification code'}
          </button>
        )}

        {sent && (
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="mt-4 w-full text-xs font-bold text-cocoa-500 hover:text-cocoa-900 transition-colors"
          >
            Send a new code
          </button>
        )}
      </form>
    </main>
  )
}
