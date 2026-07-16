import { Circle, EyeOff, LockKeyhole, MessageCircle, ShieldCheck, UserCheck } from 'lucide-react'

export default function HowItWorks({ onHome, onJoin, onSignIn }: { onHome: () => void; onJoin: () => void; onSignIn: () => void }) {
  const steps = [
    ['01', 'Tell Luna what matters', 'Complete a private profile about your values, goals, interests, lifestyle, communication style, and deal-breakers. Luna uses these answers—not private chats—to look for alignment.'],
    ['02', 'Luna searches quietly', 'There is no public catalogue and no endless swiping. Luna considers verified profiles privately and brings you one thoughtful possibility at a time.'],
    ['03', 'You choose whether to look', 'Luna tells you a potential match exists without revealing them. Their profile appears only after you say yes. Passing is private.'],
    ['04', 'Discuss the person with Luna', 'Ask why the match may make sense, explore shared values, or raise concerns. Luna answers only from information that person chose to share.'],
    ['05', 'Request an introduction', 'If you feel comfortable, ask Luna to introduce you. You decide what to say and can leave, block, or report at any point.']
  ]

  const protections = [
    { Icon: UserCheck, title: 'Verified entry', body: 'New accounts verify a phone number before Luna begins matching.' },
    { Icon: EyeOff, title: 'Private by default', body: 'No open DMs, public match list, follower count, or visible rejection.' },
    { Icon: LockKeyhole, title: 'Consent boundaries', body: 'Luna cannot join a human conversation unless every participant opts in.' },
    { Icon: MessageCircle, title: 'Safe notifications', body: 'SMS alerts never include profile details or private message content.' }
  ]

  return (
    <main className="min-h-screen bg-[#9c6644] text-[#f5ebe0] selection:bg-[#f27059]/20 noise">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1e1410] border-b border-[#f5ebe0]/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-12">
          <button onClick={onHome} className="flex items-center gap-2.5 text-base font-bold tracking-tight focus:outline-none">
            <Circle size={18} strokeWidth={4} className="text-[#f27059]" />
            <span className="font-display text-xl tracking-tight text-[#f5ebe0]">luna<span className="text-[#f27059]">.</span></span>
          </button>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <button onClick={onHome} className="rounded-full px-4 py-2 text-[#f5ebe0]/80 hover:text-[#f27059] transition-colors">
              Home
            </button>
            <button onClick={onSignIn} className="hidden sm:block rounded-full px-4 py-2 text-[#f5ebe0]/80 hover:text-[#f27059] transition-colors">
              Sign in
            </button>
            <button onClick={onJoin} className="rounded-full bg-[#f27059] px-5 py-2.5 font-semibold text-white hover:bg-[#e05e47] active:scale-95 transition-all">
              Join Luna
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center sm:py-28 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f27059]">
          HOW LUNA WORKS
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-[#ffffff] sm:text-6xl">
          A private path from<br />possibility to conversation.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#f5ebe0]/90">
          Luna is not a feed or a dating catalogue. It is a consent-first concierge that helps you consider one meaningful connection at a time.
        </p>
      </section>

      {/* Steps Grid */}
      <section className="border-y border-[#f5ebe0]/10 bg-[#1e1410] py-20 px-6 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold mb-12 text-[#ffffff]">The Journey</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {steps.map(([number, title, body], index) => (
              <article
                key={number}
                className={`rounded-[2rem] border border-[#f5ebe0]/10 bg-[#9c6644]/10 p-8 hover-premium transition-all duration-350 ${
                  index === 4 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-white px-3 py-1 bg-[#f27059] rounded-full">
                    Step {number}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#ffffff]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#f5ebe0]/80">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="bg-[#1e1410] py-20 px-6 sm:px-12 text-white noise relative border-b border-[#f5ebe0]/10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[#f27059] mb-4">
              <ShieldCheck size={22} />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Safety is part of the product</p>
            </div>
            <h2 className="font-display text-3xl font-semibold sm:text-5xl leading-tight">
              Protection is built into every step.
            </h2>
            <p className="mt-4 text-base text-[#f5ebe0]/90 leading-relaxed">
              Luna limits access, exposure, and contact before a conversation starts.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {protections.map(({ Icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 hover:bg-white/[0.07] transition-all">
                <div className="p-2 bg-white/[0.08] rounded-xl inline-block text-[#f27059]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f5ebe0]/80">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Limits */}
      <section className="py-20 px-6 sm:px-12 bg-[#9c6644]">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div className="rounded-[2.5rem] border border-[#f5ebe0]/10 bg-[#1e1410] p-8 sm:p-10 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f27059]">Luna Data Use</p>
            <h2 className="mt-3 font-display text-2xl font-semibold mb-6 text-[#ffffff]">Information you share.</h2>
            <ul className="space-y-4 text-sm text-[#f5ebe0]/90 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-[#8ea869] bg-[#8ea869]/10 rounded-full px-1 inline-block font-bold">✓</span>
                <span>Profile values, interests, and goals</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#8ea869] bg-[#8ea869]/10 rounded-full px-1 inline-block font-bold">✓</span>
                <span>Communication and lifestyle preferences</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#8ea869] bg-[#8ea869]/10 rounded-full px-1 inline-block font-bold">✓</span>
                <span>Explicit feedback about introductions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#8ea869] bg-[#8ea869]/10 rounded-full px-1 inline-block font-bold">✓</span>
                <span>Consent settings you control at any time</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[2.5rem] border border-[#f5ebe0]/10 bg-[#1e1410] p-8 sm:p-10 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f27059]">Off Limits</p>
            <h2 className="mt-3 font-display text-2xl font-semibold mb-6 text-[#ffffff]">Private remains private.</h2>
            <ul className="space-y-4 text-sm text-[#f5ebe0]/90 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-[#f27059] bg-[#f27059]/10 rounded-full px-1.5 inline-block font-bold text-xs">×</span>
                <span>Luna does not secretly read human chats</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#f27059] bg-[#f27059]/10 rounded-full px-1.5 inline-block font-bold text-xs">×</span>
                <span>Luna does not infer clinical or protected traits</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#f27059] bg-[#f27059]/10 rounded-full px-1.5 inline-block font-bold text-xs">×</span>
                <span>Luna does not reveal your contact information</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#f27059] bg-[#f27059]/10 rounded-full px-1.5 inline-block font-bold text-xs">×</span>
                <span>Luna never sends outgoing messages as you</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#f5ebe0]/10 bg-[#1e1410] py-20 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl text-[#ffffff]">Ready for a calmer way to meet?</h2>
          <p className="mt-4 text-sm sm:text-base text-[#f5ebe0]/80 leading-relaxed">
            Create your verified profile and stay in control from the first suggestion onward.
          </p>
          <button onClick={onJoin} className="mt-8 rounded-full bg-[#f27059] px-8 py-4 text-base font-bold text-white hover:bg-[#e05e47] active:scale-[0.98] transition-all">
            Start with Luna →
          </button>
        </div>
      </section>
    </main>
  )
}
