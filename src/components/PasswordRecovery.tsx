import { useState } from 'react'
import api from '../lib/api'

export default function PasswordRecovery({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const request = async () => {
    setBusy(true)
    setMessage('')
    try {
      await api.post('/auth/password-reset/request/', { phone_number: phone })
      setRequested(true)
      setMessage('If that verified number is registered, a code was sent.')
    } catch {
      setMessage('Please try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    setBusy(true)
    setMessage('')
    try {
      await api.post('/auth/password-reset/confirm/', {
        phone_number: phone,
        code,
        new_password: password
      })
      setMessage('Password updated. You can now sign in.')
      setTimeout(onBack, 1200)
    } catch {
      setMessage('The code is invalid, expired, or the password is too short.')
    } finally {
      setBusy(false)
    }
  }

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-cocoa-500 mb-1.5 block'

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className={labelClass}>Verified phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+254712345678"
          className="premium-input"
          required
        />
      </div>

      {requested && (
        <div className="space-y-4 pt-1 animate-slide-up">
          <div>
            <label className={labelClass}>Reset Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Six-digit code"
              className="premium-input text-center tracking-[0.2em] font-bold"
              required
            />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="premium-input"
              required
            />
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs font-semibold p-3 rounded-xl border ${
          message.includes('updated') || message.includes('sent')
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50'
            : 'text-yellow-700 bg-yellow-50 border-yellow-200/50'
        }`}>
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={requested ? confirm : request}
        className="w-full rounded-full bg-terracotta-500 py-3.5 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
      >
        {requested ? 'Reset password' : 'Send reset code'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs font-semibold text-white/70 hover:text-white pt-2 transition-colors"
      >
        Back to sign in
      </button>
    </div>
  )
}
