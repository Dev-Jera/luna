import { ArrowRight, Heart } from 'lucide-react'

type PublicHomeProps = {
  onAbout: () => void
  onSignIn: () => void
  onJoin: () => void
}

export default function PublicHome({ onAbout, onSignIn, onJoin }: PublicHomeProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08121f] text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8">
        <header className="flex h-[76px] shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168eea]"
            aria-label="Luna home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#168eea] text-white">
              <Heart size={17} strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Luna
            </span>
          </button>

          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={onAbout}
              className="rounded-full px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
            >
              About us
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-[#168eea]/60 hover:bg-[#168eea]/10 sm:px-5 sm:text-sm"
            >
              Sign in
            </button>
          </nav>
        </header>

        <section className="flex flex-1 items-center justify-center pb-10 pt-4 sm:pb-14">
          <div className="grid w-full overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#111d2b] sm:rounded-[2rem] lg:min-h-[470px] lg:grid-cols-[1fr_0.92fr]">
            <div className="relative z-10 flex flex-col items-start justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#168eea]/30 bg-[#168eea]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9fdcff] sm:text-xs">
                Private matchmaking, your way
              </div>
              <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                Talk to Luna AI
              </h1>
              <p className="mt-3 text-sm font-medium text-[#d6e4f3] sm:text-base">
                Your private matchmaking concierge
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#c1cfdd] sm:mt-6 sm:text-base">
                Tell Luna who you are, then get quietly introduced to your perfect match.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#a66cf0]/30 bg-[#8b5cf6]/15 px-3 py-1 text-[11px] font-medium text-[#d5bdff]">
                  Romance
                </span>
                <span className="rounded-full border border-[#168eea]/30 bg-[#168eea]/15 px-3 py-1 text-[11px] font-medium text-[#a8ddff]">
                  Friendship
                </span>
              </div>
              <button
                type="button"
                onClick={onJoin}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#168eea] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#0875c6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8bd7ff] sm:text-sm"
              >
                Find your person <ArrowRight size={15} />
              </button>
              <p className="mt-4 text-xs text-white/55">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSignIn}
                  className="font-semibold text-[#91d6ff] underline decoration-[#91d6ff]/40 underline-offset-4 hover:text-white"
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="relative min-h-[260px] overflow-hidden sm:min-h-[340px] lg:min-h-full">
              <img
                src={`${import.meta.env.BASE_URL}alternative-image.jpg`}
                alt="A couple sharing a joyful moment together"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[#08121f]/20" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-[#0a1420]/90 p-3.5 sm:bottom-6 sm:left-6 sm:right-6 sm:p-4">
                <p className="text-xs font-semibold text-white sm:text-sm">Real connections start with being yourself.</p>
                <p className="mt-1 text-[11px] text-white/70 sm:text-xs">Private by default. Always on your terms.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
