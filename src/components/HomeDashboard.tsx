import {
  ArrowRight,
  CalendarDays,
  House,
  Heart,
  MessageCircle,
  Search,
  Users,
} from 'lucide-react'
import type { Conversation, Match, Profile } from '../types'

type HomeDashboardProps = {
  profile: Profile
  matches: Match[]
  conversations: Conversation[]
  loading: boolean
  onNavigate: (page: 'conversations' | 'counseling' | 'preferences') => void
  onOpenMatches: () => void
}

export default function HomeDashboard({
  profile,
  matches,
  conversations,
  loading,
  onNavigate,
  onOpenMatches,
}: HomeDashboardProps) {
  const suggestedMatches = matches.filter(match => match.status === 'suggested')
  const spotlight = suggestedMatches[0]
  const activeConversations = conversations.filter(conversation => !conversation.is_counseling)
  const firstName = profile.display_name.trim().split(/\s+/)[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="w-full flex-1 pb-28 pt-7 sm:pb-12 sm:pt-10">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75b8ff]">Your space to connect</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#a8b6cc]">
            A little space for meaningful connections, at your own pace.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-[#c4d0e0] sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Your profile is {profile.is_discoverable ? 'discoverable' : 'private'}
        </div>
      </section>

      <section aria-labelledby="connection-status" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="connection-status" className="text-sm font-semibold text-white">Today at a glance</h2>
          <CalendarDays size={15} className="text-[#75b8ff]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMatches}
            className="group min-h-32 rounded-2xl border border-white/10 bg-[#172d70] p-4 text-left transition hover:border-[#6e91ff]/50 sm:min-h-36 sm:rounded-3xl sm:p-5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2447a4] text-[#8bb3ff]">
              <Heart size={17} />
            </span>
            <span className="mt-4 flex items-end justify-between gap-2">
              <span>
                <span className="block text-2xl font-bold text-white sm:text-3xl">{suggestedMatches.length}</span>
                <span className="mt-0.5 block text-xs text-[#bbc9ec] sm:text-sm">New introductions</span>
              </span>
              <ArrowRight size={16} className="mb-1 text-[#8bb3ff] transition group-hover:translate-x-1" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('conversations')}
            className="group min-h-32 rounded-2xl border border-white/10 bg-[#123b5a] p-4 text-left transition hover:border-[#49baff]/50 sm:min-h-36 sm:rounded-3xl sm:p-5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#145077] text-[#70d1ff]">
              <MessageCircle size={17} />
            </span>
            <span className="mt-4 flex items-end justify-between gap-2">
              <span>
                <span className="block text-2xl font-bold text-white sm:text-3xl">{activeConversations.length}</span>
                <span className="mt-0.5 block text-xs text-[#b9d4e5] sm:text-sm">Conversations</span>
              </span>
              <ArrowRight size={16} className="mb-1 text-[#70d1ff] transition group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </section>

      <section aria-labelledby="daily-spotlight" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8192ac]">Picked for you</p>
            <h2 id="daily-spotlight" className="mt-1 text-lg font-semibold text-white">Daily spotlight</h2>
          </div>
          {suggestedMatches.length > 1 && (
            <button
              type="button"
              onClick={onOpenMatches}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#83b9ff] hover:text-white"
            >
              See all <ArrowRight size={13} />
            </button>
          )}
        </div>

        {spotlight ? (
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#101722] sm:rounded-3xl">
            <div className="flex flex-col sm:flex-row">
              <div className="relative min-h-48 overflow-hidden bg-[#17283e] sm:min-h-[220px] sm:w-[36%]">
                {spotlight.profile.profile_picture ? (
                  <img
                    src={spotlight.profile.profile_picture}
                    alt={`${spotlight.profile.display_name}'s profile`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white/10 font-display text-3xl font-semibold text-white">
                      {spotlight.profile.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#08121f] px-3 py-1 text-[10px] font-semibold text-white">
                  {spotlight.score}% compatibility
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center p-5 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#75b8ff]">
                  {spotlight.profile.connection_goal}
                  {spotlight.profile.location ? ` · ${spotlight.profile.location}` : ''}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">
                  {spotlight.profile.display_name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#a8b6cc]">
                  {spotlight.profile.bio || spotlight.ai_explanation || 'A new connection is ready to discover.'}
                </p>
                {spotlight.profile.interests.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {spotlight.profile.interests.slice(0, 3).map(interest => (
                      <span key={interest} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#c4d0e0]">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onOpenMatches}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#168eea] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#087bd0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75b8ff]"
                >
                  View introduction <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-7 text-center sm:rounded-3xl sm:py-9">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#123b5a] text-[#75b8ff]">
              <MessageCircle size={20} />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-white">
              {loading ? 'Finding your next introduction' : 'Your next introduction is on its way'}
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[#91a0b5]">
              {loading
                ? 'We’re getting your connections ready.'
                : 'We’ll let you know when there’s someone new to meet. In the meantime, you can visit your conversations or update your profile.'}
            </p>
            {!loading && (
              <button
                type="button"
                onClick={() => onNavigate('preferences')}
                className="mt-4 text-xs font-semibold text-[#83b9ff] hover:text-white"
              >
                Update your profile
              </button>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="explore-heading" className="mb-8">
        <h2 id="explore-heading" className="mb-3 text-lg font-semibold text-white">Explore</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onOpenMatches}
            className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-white/10 bg-[#101722] p-4 text-left transition hover:border-[#356bfa]/50 hover:bg-[#131d2b]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2447a4] text-[#8bb3ff]"><Search size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">Find your people</span><span className="mt-1 block text-xs text-[#91a0b5]">Explore introductions</span></span>
            <ArrowRight size={15} className="text-[#73839a]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('conversations')}
            className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-white/10 bg-[#101722] p-4 text-left transition hover:border-[#168eea]/50 hover:bg-[#131d2b]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#145077] text-[#70d1ff]"><Users size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">Your conversations</span><span className="mt-1 block text-xs text-[#91a0b5]">Pick up where you left off</span></span>
            <ArrowRight size={15} className="text-[#73839a]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('counseling')}
            className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-white/10 bg-[#101722] p-4 text-left transition hover:border-[#b079ff]/50 hover:bg-[#131d2b]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#593889] text-[#c59cff]"><Heart size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">A moment for you</span><span className="mt-1 block text-xs text-[#91a0b5]">Private relationship support</span></span>
            <ArrowRight size={15} className="text-[#73839a]" />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#131e36] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:rounded-3xl sm:px-7 sm:py-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#2447a4] text-[#8bb3ff]"><MessageCircle size={17} /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#83a7ed]">A thought for today</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#d5deed]">“Good connection starts with showing up as yourself.”</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('preferences')}
          className="ml-12 mt-4 text-xs font-semibold text-[#83b9ff] hover:text-white sm:ml-0 sm:mt-0 sm:shrink-0"
        >
          Make your profile yours <ArrowRight size={13} className="ml-1 inline" />
        </button>
      </section>

      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b1018] px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[#70aaff]" aria-current="page">
            <House size={18} /><span className="text-[10px] font-semibold">Home</span>
          </button>
          <button type="button" onClick={onOpenMatches} className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[#8998ad] hover:text-white">
            <Search size={18} /><span className="text-[10px] font-medium">Explore</span>
          </button>
          <button type="button" onClick={() => onNavigate('conversations')} className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[#8998ad] hover:text-white">
            <MessageCircle size={18} /><span className="text-[10px] font-medium">Chats</span>
          </button>
          <button type="button" onClick={() => onNavigate('preferences')} className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[#8998ad] hover:text-white">
            <Users size={18} /><span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
