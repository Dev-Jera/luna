import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Sparkles, Circle } from 'lucide-react'
import api from '../lib/api'
import type { Profile } from '../types'

const goals = [
  ['friendship', 'Genuine friendships', 'For expanding your social circle and finding alignment in values.'],
  ['romance', 'A romantic relationship', 'For deep compatibility, shared life goals, and emotional alignment.'],
  ['networking', 'Professional connections', 'For sharing ideas, collaborating, and aligning career visions.']
] as const

const styles = ['Thoughtful & direct', 'Warm & expressive', 'Playful & spontaneous', 'Calm & reflective']

export default function Onboarding({ profile, onComplete }: { profile: Profile; onComplete: (profile: Profile) => void }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    display_name: profile.display_name,
    location: profile.location,
    bio: profile.bio,
    connection_goal: profile.connection_goal,
    values: profile.values.join(', '),
    interests: profile.interests.join(', '),
    communication_style: profile.communication_style,
    life_goals: profile.life_goals.join(', '),
    lifestyle: profile.lifestyle.join(', '),
    deal_breakers: profile.deal_breakers.join(', '),
    ai_profile_consent: profile.ai_profile_consent
  })

  const total = 6
  const progress = useMemo(() => ((step + 1) / total) * 100, [step])

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-cocoa-500 mb-1.5 block'

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await api.patch('/profiles/me/', {
        ...form,
        values: form.values.split(',').map(x => x.trim()).filter(Boolean),
        interests: form.interests.split(',').map(x => x.trim()).filter(Boolean),
        life_goals: form.life_goals.split(',').map(x => x.trim()).filter(Boolean),
        lifestyle: form.lifestyle.split(',').map(x => x.trim()).filter(Boolean),
        deal_breakers: form.deal_breakers.split(',').map(x => x.trim()).filter(Boolean),
        onboarding_complete: true
      })
      onComplete(data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Your answers could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-warmbg text-cocoa-900 selection:bg-terracotta-200 noise flex flex-col justify-between">
      {/* Header */}
      <header className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-2">
          <Circle size={16} strokeWidth={4} className="text-terracotta-500" />
          <span className="font-display text-xl font-bold tracking-tight">luna<span className="text-terracotta-500">.</span></span>
        </div>
        <span className="text-xs font-semibold text-cocoa-500 bg-white/50 backdrop-blur border border-cocoa-900/5 px-3.5 py-1.5 rounded-full">
          Answers stay editable
        </span>
      </header>

      {/* Progress Bar Container */}
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-12">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cocoa-900/5">
          <div
            className="h-full rounded-full bg-terracotta-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <section className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 sm:px-12 flex-1 justify-start">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta-500 mb-6">
          About you · Step {step + 1} of {total}
        </div>

        <div className="min-h-[460px] flex flex-col justify-between">
          <div className="animate-slide-up">
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <div className="p-3 bg-terracotta-50 rounded-2xl inline-block border border-terracotta-200/50 mb-4">
                    <Sparkles className="text-terracotta-500" size={24} />
                  </div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    Let’s start with the person behind the profile.
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    What should people call you, and where are you based?
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className={labelClass}>I go by</label>
                    <input
                      className="premium-input"
                      value={form.display_name}
                      onChange={e => setForm({ ...form, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>I’m based in</label>
                    <input
                      className="premium-input"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="Nairobi, Kenya"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    What kind of connection feels right?
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    Choose the main reason you’re here. You can change this later in preferences.
                  </p>
                </div>
                <div className="grid gap-4 pt-4 sm:grid-cols-1">
                  {goals.map(([value, title, desc]) => (
                    <button
                      key={value}
                      onClick={() => setForm({ ...form, connection_goal: value })}
                      className={`flex items-start justify-between rounded-2xl border p-5 text-left hover-premium transition-all duration-200 ${
                        form.connection_goal === value
                          ? 'border-terracotta-500 bg-white shadow-premium'
                          : 'border-cocoa-900/10 bg-white/40 hover:border-terracotta-500/40'
                      }`}
                    >
                      <div className="pr-4">
                        <span className={`block font-bold text-base transition-colors ${form.connection_goal === value ? 'text-terracotta-500' : 'text-cocoa-900'}`}>
                          {title}
                        </span>
                        <span className="mt-1 block text-xs text-cocoa-500 leading-relaxed">{desc}</span>
                      </div>
                      <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                        form.connection_goal === value
                          ? 'border-terracotta-500 bg-terracotta-500 text-white'
                          : 'border-cocoa-900/20'
                      }`}>
                        {form.connection_goal === value && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    What matters in your world?
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    Separate answers with commas. Specific, genuine answers help Luna find the best compatibility.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className={labelClass}>Values I try to live by</label>
                    <input
                      className="premium-input"
                      value={form.values}
                      onChange={e => setForm({ ...form, values: e.target.value })}
                      placeholder="Curiosity, kindness, courage, self-honesty..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Things I genuinely enjoy</label>
                    <input
                      className="premium-input"
                      value={form.interests}
                      onChange={e => setForm({ ...form, interests: e.target.value })}
                      placeholder="Photography, hiking, live music, vintage books..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    How do you connect best?
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    Select a style pill to start, then describe it in your own words.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className={labelClass}>Starting point styles</label>
                    <div className="flex flex-wrap gap-2.5">
                      {styles.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setForm({ ...form, communication_style: style })}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold hover-premium transition-all ${
                            form.communication_style.includes(style)
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-500'
                              : 'border-cocoa-900/10 bg-white/60 text-cocoa-500 hover:border-terracotta-500/40 hover:text-terracotta-500'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Describe how you communicate</label>
                    <input
                      className="premium-input"
                      value={form.communication_style}
                      onChange={e => setForm({ ...form, communication_style: e.target.value })}
                      placeholder="For example: I’m warm, honest, and prefer direct conversations"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tell Luna more about you</label>
                    <textarea
                      rows={4}
                      className="premium-input resize-none"
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      placeholder="Write freely—what should Luna understand about you? What makes you tick?"
                    />
                    <p className="mt-2 text-[10px] text-cocoa-300">
                      Luna uses what you write here to generate compatibility explanations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    What should fit into real life?
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    Share your direction, everyday rhythm, and boundaries. Deal-breakers are used strictly as negative filters.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className={labelClass}>Life goals</label>
                    <input
                      className="premium-input"
                      value={form.life_goals}
                      onChange={e => setForm({ ...form, life_goals: e.target.value })}
                      placeholder="Build a community, travel, start a company..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Lifestyle</label>
                    <input
                      className="premium-input"
                      value={form.lifestyle}
                      onChange={e => setForm({ ...form, lifestyle: e.target.value })}
                      placeholder="Early riser, active weekends, quiet evenings..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Deal-breakers</label>
                    <input
                      className="premium-input"
                      value={form.deal_breakers}
                      onChange={e => setForm({ ...form, deal_breakers: e.target.value })}
                      placeholder="Disrespect, dishonesty, smoking..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <div className="p-3 bg-terracotta-50 rounded-2xl inline-block border border-terracotta-200/50 mb-4">
                    <LockKeyhole className="text-terracotta-500" size={24} />
                  </div>
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900 sm:text-4xl">
                    You stay in control of Luna.
                  </h1>
                  <p className="mt-2 text-sm text-cocoa-500">
                    Luna uses these answers to structure compatibility insights. This never gives permission to read human chats.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <label className={`flex cursor-pointer gap-4 rounded-[2rem] border p-6 hover-premium transition-all duration-200 ${
                    form.ai_profile_consent
                      ? 'border-terracotta-500 bg-white shadow-premium'
                      : 'border-cocoa-900/10 bg-white/40'
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.ai_profile_consent}
                      onChange={e => setForm({ ...form, ai_profile_consent: e.target.checked })}
                      className="mt-1 rounded border-cocoa-900/10 text-terracotta-500 focus:ring-terracotta-500/20 h-5 w-5"
                    />
                    <span>
                      <strong className={`block font-bold text-base transition-colors ${form.ai_profile_consent ? 'text-terracotta-500' : 'text-cocoa-900'}`}>
                        Allow AI profile analysis
                      </strong>
                      <small className="mt-1.5 block text-xs text-cocoa-500 leading-relaxed">
                        Use my onboarding answers for structured compatibility insights. You can revoke this settings anytime in preferences.
                      </small>
                    </span>
                  </label>

                  <div className="rounded-[1.5rem] border border-cocoa-900/5 bg-white/50 p-5 text-xs text-cocoa-500 leading-relaxed">
                    <strong>Note:</strong> Matching still works without AI analysis, but Gemini-assisted explanations will be unavailable.
                  </div>

                  {error && (
                    <p className="text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200/50 rounded-xl p-3">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step Actions Footer */}
          <footer className="mt-8 flex items-center justify-between border-t border-cocoa-900/5 pt-6 bg-transparent">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-cocoa-500 hover:text-cocoa-900 transition-colors disabled:invisible"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            
            {step < total - 1 ? (
              <button
                onClick={() => setStep(s => Math.min(total - 1, s + 1))}
                disabled={
                  (step === 0 && !form.display_name) ||
                  (step === 2 && (!form.values || !form.interests)) ||
                  (step === 3 && (!form.communication_style || !form.bio))
                }
                className="flex items-center gap-2 rounded-full bg-terracotta-500 px-7 py-3.5 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-terracotta-500 px-7 py-3.5 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Show my Luna'}
                <ArrowRight size={16} />
              </button>
            )}
          </footer>
        </div>
      </section>
    </main>
  )
}
