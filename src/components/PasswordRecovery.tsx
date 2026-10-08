import { useState } from 'react'
import api from '../lib/api'

export default function PasswordRecovery({ onBack, isDark = true }: { onBack: () => void; isDark?: boolean }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [requested, setRequested] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const request = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await api.post('/auth/password-reset/request/', { phone_number: phone })
      setRequested(true)
      setDevCode(res.data?.dev_code || '')
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

  const labelClass = `text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-[#b7c3d2]' : 'text-cocoa-500'}`
  const inputClass = `premium-input ${
    isDark
      ? '!border-[#334155] !bg-[#111923] !text-[#e8eef6] placeholder:!text-[#8190a4]'
      : '!border-[#d7e1ee] !bg-white !text-[#171b24] placeholder:!text-[#98a2b3]'
  } focus:!border-[#168eea] focus:!ring-[#168eea]/10`

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className={labelClass}>Verified phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+254712345678"
          className={inputClass}
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
              className={`${inputClass} text-center font-bold tracking-[0.2em]`}
              required
            />
          </div>
          {devCode && (
            <p className={`text-xs font-semibold p-3 rounded-xl border text-center ${
              isDark ? 'text-sky-200 bg-sky-950/50 border-sky-800' : 'text-sky-800 bg-sky-50 border-sky-200/60'
            }`}>
              Dev mode (SMS not configured) — reset code:{' '}
              <button type="button" className="font-bold underline" onClick={() => setCode(devCode)}>{devCode}</button>
            </p>
          )}
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={inputClass}
              required
            />
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs font-semibold p-3 rounded-xl border ${
          message.includes('updated') || message.includes('sent')
            ? isDark
              ? 'text-emerald-200 bg-emerald-950/50 border-emerald-800'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200/50'
            : isDark
              ? 'text-yellow-200 bg-yellow-950/50 border-yellow-800'
              : 'text-yellow-700 bg-yellow-50 border-yellow-200/50'
        }`}>
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={requested ? confirm : request}
        className="w-full rounded-full bg-[#168eea] py-3.5 font-bold text-white shadow-[0_7px_18px_rgba(22,142,234,0.22)] hover:bg-[#087bd0] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
      >
        {requested ? 'Reset password' : 'Send reset code'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className={`w-full pt-2 text-xs font-semibold transition-colors ${isDark ? 'text-[#9eacbd] hover:text-white' : 'text-[#788397] hover:text-[#171b24]'}`}
      >
        Back to sign in
      </button>
    </div>
  )
}
