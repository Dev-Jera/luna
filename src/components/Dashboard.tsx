import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, LogOut, MessageCircle, Send, Sparkles, X, Heart, Users, Briefcase, Shield, Calendar, PhoneCall, Video, Lock, Unlock, HelpCircle, Settings, Menu, AlertTriangle, Gift, Info, TrendingUp, Smartphone } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../lib/api'
import { addMessage, loadDashboard, setProfile } from '../store'
import type { AppDispatch, RootState } from '../store'
import type { Conversation, Message, Profile } from '../types'
import NotificationCenter from './NotificationCenter'

function AppHeader({ page, setPage, profile, onGoToAdmin }: { page: 'conversations' | 'preferences' | 'counseling'; setPage: (page: 'conversations' | 'preferences' | 'counseling') => void; profile: Profile; onGoToAdmin?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="sticky top-0 z-20 bg-[#1e1410] border-b border-[#f5ebe0]/10">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <button onClick={() => setPage('conversations')} className="flex items-center gap-2.5 text-base font-bold tracking-tight focus:outline-none">
          <span className="h-4 w-4 rounded-full bg-[#f27059] block shrink-0" />
          <span className="font-display text-xl font-bold tracking-tight text-[#f5ebe0]">luna<span className="text-[#f27059]">.</span></span>
        </button>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationCenter />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setPage('conversations')}
              className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                page === 'conversations'
                  ? 'bg-[#f27059] text-white shadow-premium'
                  : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
              }`}
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">Conversations</span>
            </button>
            <button
              onClick={() => setPage('counseling')}
              className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                page === 'counseling'
                  ? 'bg-[#f27059] text-white shadow-premium'
                  : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
              }`}
            >
              <Heart size={14} />
              <span className="hidden sm:inline">Counseling</span>
            </button>
            <button
              onClick={() => setPage('preferences')}
              className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                page === 'preferences'
                  ? 'bg-[#f27059] text-white shadow-premium'
                  : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
              }`}
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Preferences</span>
            </button>

            {profile.user.is_staff && onGoToAdmin && (
              <button
                onClick={onGoToAdmin}
                className="flex items-center gap-1 bg-yellow-500/10 text-[#eab308] border border-yellow-500/20 hover:bg-yellow-500/20 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200"
              >
                <Shield size={12} className="text-[#eab308] animate-pulse" />
                Admin
              </button>
            )}
            
            <div className="w-[1px] h-6 bg-[#f5ebe0]/10 mx-1" />

            <div className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-[#8ea869] text-sm font-bold text-[#1e1410]">
              {profile.display_name[0]?.toUpperCase()}
            </div>
            <button
              aria-label="Sign out"
              onClick={async () => {
                await api.post('/auth/logout/')
                location.reload()
              }}
              className="rounded-full p-2.5 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-[#ffffff] transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
          </nav>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex md:hidden rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Hamburger Drawer Overlay (Mobile Only) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-64 max-w-xs bg-[#1e1410] border-r border-[#f5ebe0]/10 p-6 flex flex-col h-full animate-slide-in">
            <div className="flex items-center justify-between pb-6 border-b border-[#f5ebe0]/10">
              <button onClick={() => { setPage('conversations'); setMenuOpen(false); }} className="flex items-center gap-2.5 text-base font-bold tracking-tight">
                <span className="h-4 w-4 rounded-full bg-[#f27059] block shrink-0" />
                <span className="font-display text-xl font-bold tracking-tight text-[#f5ebe0]">luna<span className="text-[#f27059]">.</span></span>
              </button>
              <button onClick={() => setMenuOpen(false)} className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 py-8 flex flex-col gap-3">
              <button
                onClick={() => { setPage('conversations'); setMenuOpen(false); }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-3 transition-all ${
                  page === 'conversations' ? 'bg-[#f27059] text-white shadow-premium' : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
                }`}
              >
                <MessageCircle size={16} />
                <span>Conversations</span>
              </button>
              <button
                onClick={() => { setPage('counseling'); setMenuOpen(false); }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-3 transition-all ${
                  page === 'counseling' ? 'bg-[#f27059] text-white shadow-premium' : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
                }`}
              >
                <Heart size={16} />
                <span>Counseling</span>
              </button>
              <button
                onClick={() => { setPage('preferences'); setMenuOpen(false); }}
                className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-3 transition-all ${
                  page === 'preferences' ? 'bg-[#f27059] text-white shadow-premium' : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
                }`}
              >
                <Settings size={16} />
                <span>Preferences</span>
              </button>

              {profile.user.is_staff && onGoToAdmin && (
                <button
                  onClick={() => { onGoToAdmin(); setMenuOpen(false); }}
                  className="flex items-center gap-3 text-yellow-500/90 border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-xl px-4 py-3 text-sm font-semibold transition-all mt-4"
                >
                  <Shield size={16} />
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>

            <div className="pt-6 border-t border-[#f5ebe0]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#8ea869] text-xs font-bold text-[#1e1410]">
                  {profile.display_name[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#f5ebe0]">{profile.display_name}</span>
              </div>
              <button
                aria-label="Sign out"
                onClick={async () => {
                  await api.post('/auth/logout/')
                  location.reload()
                }}
                className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// Simple Circle helper if not imported
function Circle({ size = 20, strokeWidth = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function Chat({ conversation, onClose, onReload, onGoToCounseling }: { conversation: Conversation; onClose: () => void; onReload: () => void; onGoToCounseling: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const currentUserId = useSelector((s: RootState) => s.luna.profile?.user.id)
  const activeProfileId = useSelector((s: RootState) => s.luna.profile?.id)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [typingName, setTypingName] = useState('')
  const [online, setOnline] = useState(false)
  const [error, setError] = useState('')
  const [showSideBoard, setShowSideBoard] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const typingTimer = useRef<number | null>(null)

  // WebRTC States
  const [callActive, setCallActive] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [callTimer, setCallTimer] = useState(300)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Date Proposal / Venues States
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loadingVenues, setLoadingVenues] = useState(false)
  const [venues, setVenues] = useState<{ name: string; address: string; reason: string }[]>([])
  const [selectedVenue, setSelectedVenue] = useState<{ name: string; address: string } | null>(null)
  const [proposedTime, setProposedTime] = useState('')
  const [permitting, setPermitting] = useState(false)

  const reengage = async () => {
    setSending(true)
    setError('')
    try {
      await api.post(`/conversations/${conversation.id}/reengage/`)
      onReload()
    } catch {
      setError('Could not re-engage Luna. Please try again.')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    api.post(`/conversations/${conversation.id}/read/`).catch(() => {})
    if (conversation.is_luna) return
    let stopped = false
    let retry: number | undefined
    
    const connect = () => {
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${protocol}://${location.host}/ws/chat/${conversation.id}/`)
      wsRef.current = ws
      ws.onopen = () => {
        setConnected(true)
        setError('')
      }
      ws.onclose = () => {
        setConnected(false)
        if (!stopped) retry = window.setTimeout(connect, 1500)
      }
      ws.onmessage = e => {
        const payload = JSON.parse(e.data)
        if (payload.message) {
          const msg = payload.message
          if (msg.metadata?.visible_to_profile_id && msg.metadata.visible_to_profile_id !== activeProfileId) {
            return
          }
          dispatch(addMessage({ conversationId: conversation.id, message: msg }))
          setSending(false)
        } else if (payload.event === 'typing' && payload.user_id !== currentUserId) {
          setTypingName(payload.typing ? payload.display_name : '')
        } else if (payload.event === 'presence' && payload.user_id !== currentUserId) {
          setOnline(payload.online)
        } else if (payload.event === 'webrtc') {
          handleWebRTCSignal(payload.signal)
        } else if (payload.event === 'error') {
          setError(payload.detail)
          setSending(false)
        }
      }
    }
    
    connect()
    return () => {
      stopped = true
      if (retry) clearTimeout(retry)
      wsRef.current?.close()
    }
  }, [conversation.id, currentUserId, activeProfileId, dispatch])

  // Hybrid polling fallback when WebSocket is not connected or active
  useEffect(() => {
    if (conversation.is_luna) return
    if (connected) return
    const interval = setInterval(() => {
      dispatch(loadDashboard())
    }, 4000)
    return () => clearInterval(interval)
  }, [conversation.id, conversation.is_luna, connected, dispatch])

  // Cleanup WebRTC connection on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [localStream])

  // Timer loop for speed date
  useEffect(() => {
    let timer: number
    if (callActive && callTimer > 0) {
      timer = window.setInterval(() => {
        setCallTimer(prev => prev - 1)
      }, 1000)
    } else if (callActive && callTimer === 0) {
      alert("Your 5-minute speed date has ended! Please wrap up your conversation.")
      endCall()
    }
    return () => clearInterval(timer)
  }, [callActive, callTimer])

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      setCallActive(true)
      setCallTimer(300)
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
        }
      }
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc',
            signal: { type: 'candidate', candidate: event.candidate }
          }))
        }
      }
      peerConnectionRef.current = pc
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc',
          signal: { type: 'offer', sdp: offer }
        }))
      }
    } catch (err) {
      console.error('WebRTC error starting call:', err)
      setError('Could not access microphone/camera. Please check permissions.')
    }
  }

  const endCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'webrtc',
        signal: { type: 'hangup' }
      }))
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    setRemoteStream(null)
    setCallActive(false)
  }

  const handleWebRTCSignal = async (signal: any) => {
    if (signal.type === 'offer') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        setCallActive(true)
        setCallTimer(300)
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })
        stream.getTracks().forEach(track => pc.addTrack(track, stream))
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0])
          }
        }
        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'webrtc',
              signal: { type: 'candidate', candidate: event.candidate }
            }))
          }
        }
        peerConnectionRef.current = pc
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc',
            signal: { type: 'answer', sdp: answer }
          }))
        }
      } catch (err) {
        console.error('WebRTC error responding to call:', err)
      }
    } else if (signal.type === 'answer') {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp))
      }
    } else if (signal.type === 'candidate') {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate))
      }
    } else if (signal.type === 'hangup') {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }
      setRemoteStream(null)
      setCallActive(false)
    }
  }

  const loadVenues = async () => {
    setLoadingVenues(true)
    try {
      const res = await api.get(`/conversations/${conversation.id}/suggest-venues/`)
      setVenues(res.data.venues || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVenues(false)
    }
  }

  const proposeDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVenue || !proposedTime) return
    try {
      await api.post(`/conversations/${conversation.id}/schedule-date/`, {
        proposed_time: proposedTime,
        venue_name: selectedVenue.name,
        venue_address: selectedVenue.address
      })
      setShowDatePicker(false)
      setSelectedVenue(null)
      setProposedTime('')
    } catch (err) {
      console.error(err)
    }
  }

  const respondToDate = async (meetingId: number, action: 'accept' | 'decline') => {
    try {
      await api.post(`/conversations/${conversation.id}/schedule-date/${meetingId}/respond/`, { action })
    } catch (err) {
      console.error(err)
    }
  }

  const permitContact = async () => {
    setPermitting(true)
    try {
      await api.post(`/conversations/${conversation.id}/permit-contact/`)
      onReload()
    } catch (err) {
      console.error(err)
    } finally {
      setPermitting(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages?.length || 0, sending])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const outgoing = body.trim()
    if (!outgoing || sending) return
    setSending(true)
    setError('')
    setBody('')
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', typing: false }))
    }
    try {
      // Persist chat messages through HTTP even when a WebSocket appears open.
      // A socket can disconnect between readyState inspection and delivery,
      // which previously caused messages to vanish without an API fallback.
      const { data } = await api.post(`/conversations/${conversation.id}/messages/`, { body: outgoing })
      if (conversation.is_luna) {
        dispatch(addMessage({ conversationId: conversation.id, message: data.message }))
        dispatch(addMessage({ conversationId: conversation.id, message: data.luna_reply }))
      } else {
        dispatch(addMessage({ conversationId: conversation.id, message: data }))
      }
    } catch {
      setBody(outgoing)
      setError('Your message was not sent. Please try again.')
    } finally {
      // Direct chats fall back to the REST endpoint while WebSockets reconnect.
      // Always release the composer after that request completes.
      setSending(false)
    }
  }

  const updateBody = (value: string) => {
    setBody(value)
    if (conversation.is_luna || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'typing', typing: true }))
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'typing', typing: false }))
      }
    }, 900)
  }

  const getGoalIcon = (goal: string) => {
    if (goal?.toLowerCase().includes('romance')) return <Heart size={13} className="text-[#eab308] inline mr-1" />
    if (goal?.toLowerCase().includes('friendship')) return <Users size={13} className="text-[#0f4c81] inline mr-1" />
    return <Briefcase size={13} className="text-[#0f4c81] inline mr-1" />
  }

  const renderMessage = (m: Message) => {
    const mine = m.sender?.id === currentUserId
    const isSystem = m.metadata?.type === 'system_left' || (m.body && (m.body.includes('joined the chat') || m.body.includes('left the conversation') || m.body.includes('Luna has left')))
    if (isSystem) {
      return (
        <div key={m.id} className="flex justify-center my-4 w-full">
          <div className="rounded-full bg-[#f5ebe0]/5 border border-[#f5ebe0]/10 px-4 py-1.5 text-[11px] font-semibold text-[#f5ebe0]/60 text-center shadow-soft">
            {m.body}
          </div>
        </div>
      )
    }
    return (
      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
          <div
            className={`rounded-[1.75rem] px-5 py-3 text-[14px] leading-relaxed shadow-soft ${
              mine
                ? 'rounded-br-sm bg-[#f27059] text-white'
                : m.is_ai
                  ? 'rounded-bl-sm bg-[#9c6644]/10 border border-[#f5ebe0]/10 text-white'
                  : 'rounded-bl-sm bg-[#9c6644] border border-[#f5ebe0]/10 text-white'
            }`}
          >
            {m.is_ai && (
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f27059]">
                <Sparkles size={11} /> Luna
              </div>
            )}
            {!mine && !m.is_ai && m.sender && (
              <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5ebe0]/80">
                {m.sender.first_name || m.sender.username}
              </div>
            )}
            <p className="whitespace-pre-wrap">{m.body}</p>

            {m.metadata?.type === 'profile_card' && m.metadata?.profile && (
              <div className="mt-4 rounded-2xl border border-[#f5ebe0]/10 bg-[#1e1410] p-5 text-[#f5ebe0] shadow-soft">
                <div className="text-lg font-bold font-display text-white">{m.metadata.profile.display_name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#f5ebe0]/80">
                  {getGoalIcon(m.metadata.profile.connection_goal)}
                  <span>
                    {[m.metadata.profile.location, m.metadata.profile.connection_goal].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <p className="mt-3.5 text-xs text-[#f5ebe0]/80 leading-relaxed border-t border-[#f5ebe0]/10 pt-3.5 italic">
                  "{m.metadata.profile.bio || 'No bio shared yet.'}"
                </p>
                {Array.isArray(m.metadata.profile.interests) && m.metadata.profile.interests.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.metadata.profile.interests.map((item: string) => (
                      <span key={item} className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[10px] font-semibold text-terracotta-500 border border-terracotta-200/20">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {m.metadata?.type === 'profile_locked_premium' && (
              <div className="mt-4 rounded-2xl border border-[#f27059]/30 bg-[#f27059]/5 p-5 text-[#f5ebe0] shadow-soft max-w-sm">
                <div className="flex items-center gap-2 text-[#f27059] font-bold text-xs">
                  <Lock size={14} className="animate-pulse" />
                  <span>Premium Match Recommendation</span>
                </div>
                <div className="mt-2 text-lg font-bold font-display text-white">Profile Locked</div>
                <div className="mt-2 flex items-center gap-1 bg-[#f27059]/10 border border-[#f27059]/20 rounded-full px-3 py-1 w-max text-[10px] font-bold text-[#f27059] uppercase tracking-wider">
                  🔥 {m.metadata.score}% Compatibility
                </div>
                <p className="mt-3 text-xs text-[#f5ebe0]/60 leading-relaxed">
                  Unlock detailed bios, values alignment, and direct messaging with this premium candidate by upgrading.
                </p>
                <button
                  onClick={onGoToCounseling}
                  className="mt-4 w-full rounded-full bg-[#f27059] py-2.5 text-xs font-bold text-white hover:bg-[#e05e47] active:scale-95 transition-all shadow-glow flex items-center justify-center gap-1.5"
                >
                  <Unlock size={12} />
                  Upgrade to Reveal Profile
                </button>
              </div>
            )}

            {m.metadata?.type === 'date_proposal' && (
              <div className="mt-4 rounded-2xl border border-[#f5ebe0]/10 bg-[#1e1410] p-5 text-[#f5ebe0] shadow-soft max-w-sm">
                <div className="flex items-center gap-2 text-[#f27059] font-bold text-xs">
                  <Calendar size={14} /> Meetup Proposal
                </div>
                <div className="mt-2 text-sm font-bold font-display text-white">{m.metadata.venue_name}</div>
                <div className="text-xs text-[#f5ebe0]/70 mt-1">{m.metadata.proposed_time ? new Date(m.metadata.proposed_time).toLocaleString() : ''}</div>
                
                {m.sender?.id !== currentUserId && (
                  <div className="flex gap-2.5 mt-4 pt-4 border-t border-[#f5ebe0]/10">
                    <button
                      onClick={() => respondToDate(m.metadata.meeting_id, 'decline')}
                      className="flex-1 rounded-full border border-[#f5ebe0]/20 bg-transparent py-2 text-xs font-bold text-[#f5ebe0] hover:bg-[#f5ebe0]/10 active:scale-95 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respondToDate(m.metadata.meeting_id, 'accept')}
                      className="flex-1 rounded-full bg-[#f27059] py-2 text-xs font-bold text-white shadow-glow hover:bg-[#e05e47] active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="mt-1 px-2.5 text-[9px] font-semibold text-cocoa-300">
            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#1e1410]/70 p-0 md:relative md:inset-auto md:z-0 md:p-0 md:bg-transparent md:h-full flex gap-6 w-full">
      <section className="flex-1 flex h-full flex-col overflow-hidden">
        
        {/* Chat Header */}
        <header className="flex items-center justify-between border-b border-[#f5ebe0]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#8ea869] text-[#1e1410] font-bold border border-[#8ea869]/20">
              {conversation.is_luna ? <Sparkles size={16} /> : <MessageCircle size={16} />}
            </div>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base">{conversation.title}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#f5ebe0]/80">
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-[#f5ebe0]/30'}`} />
                {conversation.is_luna ? 'Your private AI concierge' : connected ? 'Live conversation' : 'Reconnecting…'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!conversation.is_luna && (
              <>
                {/* E2EE Lock indicator */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#f5ebe0]/80 border border-[#f5ebe0]/10 bg-[#9c6644]/10 rounded-full px-3 py-1">
                  {conversation.is_contact_sharing_allowed ? <Unlock size={11} className="text-emerald-500" /> : <Lock size={11} className="text-[#f27059]" />}
                  <span>{conversation.is_contact_sharing_allowed ? 'Direct' : 'Shielded'}</span>
                </div>

                {!conversation.is_contact_sharing_allowed && (
                  <button
                    onClick={permitContact}
                    disabled={permitting}
                    className="text-[10px] font-bold bg-[#f27059] text-white hover:bg-[#e05e47] rounded-full px-3 py-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {permitting ? 'Consenting...' : 'Unlock Sharing'}
                  </button>
                )}

                {/* Call buttons */}
                <button
                  onClick={startCall}
                  className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white transition-all active:scale-95"
                  title="Video Call"
                >
                  <Video size={16} />
                </button>

                {/* Plan Date button */}
                <button
                  onClick={() => { setShowDatePicker(true); loadVenues(); }}
                  className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white transition-all active:scale-95"
                  title="Plan Meetup Date"
                >
                  <Calendar size={16} />
                </button>

                {/* Send SMS Nudge button */}
                <button
                  onClick={async () => {
                    setSmsSending(true)
                    setError('')
                    try {
                      const { data } = await api.post(`/conversations/${conversation.id}/send-sms/`)
                      dispatch(addMessage({ conversationId: conversation.id, message: data.message }))
                    } catch (e: any) {
                      console.error("SMS nudge failed", e)
                      setError(e?.response?.data?.detail || 'The SMS could not be sent. Please try again.')
                    } finally {
                      setSmsSending(false)
                    }
                  }}
                  disabled={smsSending}
                  className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white transition-all active:scale-95"
                  title={smsSending ? 'Sending SMS...' : 'Send SMS Nudge'}
                >
                  <Smartphone size={16} />
                </button>

                {/* Match Board Toggle button */}
                <button
                  onClick={() => setShowSideBoard(!showSideBoard)}
                  className={`rounded-full p-2 transition-all active:scale-95 ${
                    showSideBoard 
                      ? 'text-[#f27059] bg-[#f27059]/10' 
                      : 'text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white'
                  }`}
                  title="Toggle Match Info & Progress Board"
                >
                  <Info size={16} />
                </button>
              </>
            )}
            <button
              aria-label="Back to conversations"
              onClick={onClose}
              className="rounded-full p-2 text-[#f5ebe0]/80 hover:bg-[#9c6644]/20 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto py-6">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3.5 flex gap-3 text-[11px] text-[#f5ebe0]/70 leading-relaxed shadow-soft">
            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-yellow-500 uppercase tracking-wider block mb-1">Safety Advisory</span>
              Be cautious of what personal information, phone numbers, or social media handles you share in chats. Luna operates with a strict meaningful connection policy, but does not monitor private off-platform interactions. Luna shall not be held liable or accountable for off-platform behaviors, financial transfers, or personal data shared between users.
            </div>
          </div>
          {(conversation.messages || []).map(renderMessage)}
          {(!conversation.messages || conversation.messages.length === 0) && (
            <p className="mt-16 text-center text-xs font-semibold text-[#f5ebe0]/40">This conversation has just begun.</p>
          )}
          {sending && conversation.is_luna && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#f27059] bg-[#f27059]/10 rounded-full px-4 py-2 w-max border border-[#f27059]/20">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f27059]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f27059] [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f27059] [animation-delay:0.4s]" />
              Luna is drafting compatibility insights...
            </div>
          )}
          {typingName && (
            <p className="text-[10px] text-[#f5ebe0]/60 italic px-2">{typingName} is typing...</p>
          )}
          <div ref={endRef} />
        </div>

        {conversation.luna_stage === 'left' && (
          <div className="bg-terracotta-50 border-t border-b border-terracotta-200/40 px-5 py-3.5 flex items-center justify-between text-xs text-cocoa-900 font-semibold shadow-soft">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-terracotta-500 shrink-0 border-0" />
              <span>Luna is away letting you talk privately. Click below to bring Luna back and debrief!</span>
            </span>
            <button
              onClick={reengage}
              disabled={sending}
              className="rounded-full bg-terracotta-500 px-4 py-2 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all shrink-0 ml-4"
            >
              Re-engage Luna
            </button>
          </div>
        )}

        {/* WebRTC Video Call Overlay */}
        {callActive && (
          <div className="absolute inset-0 z-50 bg-cocoa-900/90 flex flex-col justify-between p-6 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-terracotta-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Speed Date Calling Mode</span>
              </div>
              <div className="rounded-full bg-yellow-500/20 px-4 py-1.5 border border-yellow-500/30 text-xs font-bold text-yellow-300">
                Time Remaining: {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="flex-1 my-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="bg-cocoa-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-video relative shadow-2xl">
                {localStream ? (
                  <video
                    ref={el => { if (el) el.srcObject = localStream; }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-white/50">Your camera is loading...</div>
                )}
                <div className="absolute bottom-3 left-3 bg-cocoa-900/60 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] font-bold">You</div>
              </div>

              <div className="bg-cocoa-900/50 border border-white/10 rounded-2xl overflow-hidden aspect-video relative shadow-2xl">
                {remoteStream ? (
                  <video
                    ref={el => { if (el) el.srcObject = remoteStream; }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-white/50 animate-pulse">Waiting for participant to connect...</div>
                )}
                <div className="absolute bottom-3 left-3 bg-cocoa-900/60 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] font-bold">Match Connection</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={endCall}
                className="rounded-full bg-[#0f4c81] hover:bg-[#0c3e69] px-8 py-3 text-xs font-bold shadow-2xl active:scale-95 transition-all"
              >
                End Speed Date
              </button>
            </div>
          </div>
        )}

        {/* Date Proposal Modal Overlay */}
        {showDatePicker && (
          <div className="absolute inset-0 z-40 bg-cocoa-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-cream border border-cocoa-900/5 rounded-[2rem] shadow-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowDatePicker(false)}
                className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-cocoa-900/5 text-cocoa-500"
              >
                <X size={16} />
              </button>
              <h3 className="font-bold text-lg font-display text-cocoa-900 flex items-center gap-2">
                <Calendar className="text-terracotta-500" size={20} />
                Plan Meetup Date
              </h3>
              <p className="text-xs text-cocoa-500 mt-1">Select one of Luna's safety-curated venues equidistant to both of you.</p>

              {loadingVenues ? (
                <div className="py-12 flex flex-col items-center gap-2 animate-pulse">
                  <span className="h-5 w-5 rounded-full border-2 border-terracotta-500 border-t-transparent animate-spin"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cocoa-400">Luna is studying the map…</span>
                </div>
              ) : (
                <form onSubmit={proposeDate} className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-cocoa-400 block">Select Venue</label>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {venues.map(v => {
                        const isSel = selectedVenue?.name === v.name
                        return (
                          <div
                            key={v.name}
                            onClick={() => setSelectedVenue({ name: v.name, address: v.address })}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                              isSel
                                ? 'border-terracotta-500 bg-terracotta-50/50'
                                : 'border-cocoa-900/5 bg-white hover:border-terracotta-500/20'
                            }`}
                          >
                            <div className="font-bold text-xs text-cocoa-900">{v.name}</div>
                            <div className="text-[10px] text-cocoa-500 mt-0.5">{v.address}</div>
                            <div className="text-[9px] text-terracotta-600 mt-1 italic font-semibold">{v.reason}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-cocoa-400 block">Proposed Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={proposedTime}
                      onChange={e => setProposedTime(e.target.value)}
                      className="premium-input mt-1.5"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedVenue || !proposedTime}
                    className="w-full rounded-full bg-terracotta-500 px-6 py-3 font-bold text-white shadow-premium hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50 mt-4"
                  >
                    Send Date Proposal
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Chat Form */}
        <form onSubmit={send} className="py-4 border-t border-[#f5ebe0]/10">
          {error && <p className="mb-2.5 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200/50 p-2.5 rounded-xl">{error}</p>}
          <div className="flex items-end gap-3 rounded-2xl bg-[#9c6644]/10 p-1.5 border border-[#f5ebe0]/10 focus-within:border-[#f27059] focus-within:ring-4 focus-within:ring-[#f27059]/10 transition-all">
            <textarea
              rows={1}
              value={body}
              onChange={e => updateBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(e as any)
                }
              }}
              placeholder={conversation.is_luna ? 'Message Luna…' : 'Write a message…'}
              className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-[#f5ebe0]/50"
            />
            <button
              aria-label="Send message"
              disabled={sending || !body.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f27059] text-white hover:bg-[#e05e47] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="mt-2.5 text-center text-[10px] text-[#f5ebe0]/50">
            Press <strong className="text-white">Enter</strong> to send · <strong className="text-white">Shift + Enter</strong> for newline
          </p>
        </form>
      </section>

      {/* Side board / partner summary panel */}
      {!conversation.is_luna && showSideBoard && (() => {
        const partner = conversation.participants.find(p => p.id !== activeProfileId)
        if (!partner) return null
        
        // Progress steps computation
        const msgCount = conversation.messages?.length || 0
        const isIcebreaker = msgCount >= 4
        const isDeeper = msgCount >= 10
        const isContactShared = conversation.is_contact_sharing_allowed
        const isMeetingScheduled = conversation.messages?.some(m => m.metadata?.meeting_id) || false
        
        const board = conversation.luna_board || {}
        const rawSummary = activeProfileId ? (board.summaries?.[String(activeProfileId)] || board.summaries?.[activeProfileId]) : undefined
        const partnerSummary = rawSummary || `${partner.display_name} is located in ${partner.location || 'Uganda'}. Connection goal: ${partner.connection_goal}.`
        const relationshipProgress = board.progress || "Match connected! Start chatting to unlock compatibility intelligence from Luna."

        return (
          <aside className="hidden lg:flex w-80 shrink-0 flex-col bg-[#1c120e] border border-[#f5ebe0]/10 rounded-[2rem] shadow-soft overflow-y-auto p-5 text-[#f5ebe0] animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-[#f5ebe0]/10">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#9c6644]/20 text-[#f27059] font-bold text-xl border border-[#f5ebe0]/10 mb-3 shadow-inner relative overflow-hidden">
                {partner.profile_picture ? (
                  <img src={partner.profile_picture} alt={partner.display_name} className="w-full h-full object-cover" />
                ) : (
                  partner.display_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <h3 className="font-bold text-white text-sm">{partner.display_name}</h3>
              <p className="text-[10px] text-[#f5ebe0]/60 mt-0.5">{partner.location || 'Uganda'}</p>
              
              <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f27059]/10 border border-[#f27059]/20 text-[9px] font-bold text-[#f27059] uppercase tracking-wider">
                {getGoalIcon(partner.connection_goal)}
                <span>{partner.connection_goal}</span>
              </div>
            </div>

            {/* Profile summary from Luna */}
            <div className="mt-5 space-y-2">
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-[#f5ebe0]/40 flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#f27059]" />
                Luna's Partner Summary
              </h4>
              <div className="rounded-2xl bg-[#9c6644]/5 border border-[#f5ebe0]/5 p-4 text-xs text-[#f5ebe0]/80 leading-relaxed italic">
                "{partnerSummary}"
              </div>
            </div>

            {/* Match progression / timeline */}
            <div className="mt-6 space-y-3 flex-1">
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-[#f5ebe0]/40 flex items-center gap-1.5">
                <TrendingUp size={11} className="text-[#f27059]" />
                Relationship Progress
              </h4>
              <p className="text-xs text-[#f5ebe0]/85 leading-relaxed font-semibold">
                {relationshipProgress}
              </p>

              {/* Graphical checklist steps */}
              <div className="mt-4 space-y-4 relative pl-4 border-l border-[#f5ebe0]/10 ml-2">
                {[
                  { label: "Connection Established", desc: "Matched and introduced by Luna.", checked: true },
                  { label: "First Exchange", desc: "Exchanged initial warm messages.", checked: isIcebreaker },
                  { label: "Deeper Flow", desc: "Shared values and interests details.", checked: isDeeper },
                  { label: "Shield Unlocked", desc: "Allowed sharing contact details.", checked: isContactShared },
                  { label: "Meetup Planned", desc: "Proposed or scheduled a date.", checked: isMeetingScheduled }
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[22px] top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border text-[8px] font-bold ${
                      step.checked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-[#1c120e] border-[#f5ebe0]/20 text-[#f5ebe0]/30'
                    }`}>
                      {step.checked ? "✓" : ""}
                    </span>
                    <div>
                      <div className={`text-[11px] font-bold ${step.checked ? 'text-white' : 'text-[#f5ebe0]/40'}`}>
                        {step.label}
                      </div>
                      <div className="text-[9px] text-[#f5ebe0]/50 mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )
      })()}
    </div>
  )
}

function Counseling({ profile, onSaved, tab, setTab }: { profile: Profile; onSaved: (profile: Profile) => void; tab: 'ai' | 'couples'; setTab: (t: 'ai' | 'couples') => void }) {
  const [loading, setLoading] = useState(false)
  const [cState, setCState] = useState<Conversation | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  
  const [partnerName, setPartnerName] = useState('')
  const [partnerPhone, setPartnerPhone] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [schedError, setSchedError] = useState('')

  const [checkoutPhone, setCheckoutPhone] = useState(profile.phone_number || '')
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<'mtn' | 'airtel'>('mtn')
  const [premiumPrice, setPremiumPrice] = useState<{ amount_ugx: number; amount_usd: number } | null>(null)

  useEffect(() => {
    api.get('/profiles/premium-price/')
      .then(res => setPremiumPrice(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (!paymentReference) return

    let intervalId = setInterval(async () => {
      try {
        const res = await api.get(`/profiles/me/payment-status/?reference=${paymentReference}`)
        const status = res.data.status
        setPaymentStatus(status)

        if (status === 'successful') {
          clearInterval(intervalId)
          setPaymentReference(null)
          // Refresh profile details in frontend
          const profRes = await api.get('/profiles/me/')
          onSaved(profRes.data)
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(intervalId)
          setPaymentError(`Payment failed or cancelled (Status: ${status}).`)
          setPaymentReference(null)
        }
      } catch (err) {
        console.error(err)
        clearInterval(intervalId)
        setPaymentError('An error occurred while tracking payment status.')
        setPaymentReference(null)
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [paymentReference])

  const initiateNylonPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkoutPhone.trim() || isInitiatingPayment) return
    setIsInitiatingPayment(true)
    setPaymentError(null)
    setPaymentStatus(null)

    try {
      const res = await api.post('/profiles/me/initiate-nylon-payment/', {
        phone_number: checkoutPhone.trim(),
        amount: premiumPrice?.amount_ugx || 11000
      })
      setPaymentReference(res.data.reference)
      setPaymentStatus(res.data.status)
    } catch (err: any) {
      setPaymentError(err.response?.data?.phone_number?.[0] || 'Failed to initiate payment.')
    } finally {
      setIsInitiatingPayment(false)
    }
  }

  const loadAI = async () => {
    setLoading(true)
    try {
      const res = await api.post('/counseling/ai/')
      setCState(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const res = await api.get('/counseling/sessions/')
      setSessions(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (tab === 'ai') {
      loadAI()
    } else if (tab === 'couples' && profile.is_premium) {
      loadSessions()
    }
  }, [tab, profile.is_premium])

  const sendCounselingMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending || !cState) return
    const text = body.trim()
    setBody('')
    setSending(true)
    try {
      const res = await api.post(`/conversations/${cState.id}/messages/`, { body: text })
      setCState(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...(prev.messages || []), res.data.message, res.data.luna_reply].filter(Boolean)
        }
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const scheduleSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerName || !partnerPhone || !scheduledTime || scheduling) return
    setScheduling(true)
    setSchedError('')
    try {
      const res = await api.post('/counseling/schedule/', {
        partner_name: partnerName,
        partner_phone: partnerPhone,
        scheduled_time: scheduledTime
      })
      setSessions(prev => [res.data, ...prev])
      setPartnerName('')
      setPartnerPhone('')
      setScheduledTime('')
    } catch (err: any) {
      setSchedError(err.response?.data?.detail || 'Failed to schedule session.')
    } finally {
      setScheduling(false)
    }
  }

  return (
    <section className="mx-auto flex h-full w-full max-w-4xl flex-col bg-[#1e1410] border border-[#f5ebe0]/10 shadow-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden lg:h-[calc(100vh-210px)]">
      <header className="border-b border-[#f5ebe0]/10 bg-[#1e1410] px-5 py-4 sm:px-7 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold text-white text-base">Relationship Counseling</h2>
          <p className="text-xs text-[#f5ebe0]/60 mt-0.5">Private self-reflection and professional guidance</p>
        </div>
        <div className="flex gap-1.5 bg-[#9c6644]/10 rounded-full p-1 border border-[#f5ebe0]/5">
          <button
            onClick={() => setTab('ai')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              tab === 'ai' ? 'bg-[#f27059] text-white' : 'text-[#f5ebe0]/60 hover:text-white'
            }`}
          >
            AI Counselor
          </button>
          <button
            onClick={() => setTab('couples')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
              tab === 'couples' ? 'bg-[#f27059] text-white' : 'text-[#f5ebe0]/60 hover:text-white'
            }`}
          >
            Couples Therapy
            {!profile.is_premium && <Lock size={10} />}
          </button>
        </div>
      </header>

      {tab === 'ai' ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1410]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#f5ebe0]/50">
              Initializing AI therapy session...
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cState?.messages?.map(m => {
                  const mine = !m.is_ai
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`rounded-[1.75rem] px-5 py-3 text-[14px] leading-relaxed shadow-soft ${
                            mine
                              ? 'rounded-br-sm bg-[#f27059] text-white'
                              : 'rounded-bl-sm bg-[#9c6644]/10 border border-[#f5ebe0]/10 text-white'
                          }`}
                        >
                          {!mine && (
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f27059]">
                              <Sparkles size={11} /> Luna Therapy
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-[1.75rem] rounded-bl-sm bg-[#9c6644]/10 border border-[#f5ebe0]/10 px-5 py-3 text-sm text-white/50 animate-pulse">
                      Luna is typing thoughts...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={sendCounselingMessage} className="border-t border-[#f5ebe0]/10 p-5 bg-[#1e1410] shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Describe what's happening or how you feel..."
                    className="flex-1 rounded-2xl border border-[#f5ebe0]/10 bg-[#9c6644]/5 px-5 py-3.5 text-sm text-white placeholder-[#f5ebe0]/40 focus:border-[#f27059] focus:outline-none transition-all"
                  />
                  <button
                    disabled={sending || !body.trim()}
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f27059] text-white hover:bg-[#e05e47] active:scale-95 disabled:opacity-30 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!profile.is_premium ? (
            paymentReference ? (
              <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 bg-[#9c6644]/5 border border-[#f5ebe0]/10 rounded-[2rem] shadow-premium animate-pulse">
                <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-[#f27059]/20 border-t-[#f27059] animate-spin" />
                  <Lock size={24} className="text-[#f27059]" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Awaiting PIN Confirmation</h3>
                <p className="mt-2 text-xs text-[#f5ebe0]/70 leading-relaxed">
                  We have sent a Mobile Money payment prompt to <span className="font-semibold text-white">{checkoutPhone}</span>.
                  Please approve the {premiumPrice ? `${premiumPrice.amount_ugx.toLocaleString()} UGX` : '11,000 UGX'} request on your phone.
                </p>
                <div className="mt-6 px-4 py-2 rounded-xl bg-[#291e19] border border-[#f5ebe0]/5 text-[10px] font-mono text-[#f5ebe0]/50 select-all">
                  Ref: {paymentReference}
                </div>
                <div className="mt-1 text-[10px] text-[#f27059] font-semibold animate-pulse">
                  Status: {paymentStatus || 'Initiated'}
                </div>
                <button
                  onClick={() => {
                    setPaymentReference(null)
                    setPaymentError('Payment confirmation cancelled by user.')
                  }}
                  className="mt-6 text-xs font-semibold text-[#f5ebe0]/60 hover:text-white underline transition-all"
                >
                  Cancel & try again
                </button>
              </div>
            ) : (
              <div className="flex flex-col p-8 sm:p-10 max-w-md mx-auto my-6 bg-[#9c6644]/5 border border-[#f5ebe0]/10 rounded-[2rem] shadow-premium text-center">
                <div className="mx-auto p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full w-fit mb-5">
                  <Lock size={28} />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Unlock Couples Therapy</h3>
                <p className="mt-2 text-xs text-[#f5ebe0]/70 leading-relaxed">
                  Premium members can schedule live counseling sessions with certified human relationship therapists, including automated meeting links.
                </p>

                {paymentError && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 text-left">
                    {paymentError}
                  </div>
                )}

                <form onSubmit={initiateNylonPayment} className="mt-6 space-y-5 text-left">
                  {/* Provider Selection */}
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/60 block mb-2 text-center">
                      Select Payment Provider
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('mtn')}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                          selectedProvider === 'mtn'
                            ? 'border-[#f27059] bg-[#f27059]/5 shadow-[0_0_15px_rgba(242,112,89,0.25)]'
                            : 'border-[#f5ebe0]/10 bg-[#9c6644]/5 hover:border-[#f5ebe0]/20'
                        }`}
                      >
                        <img src="/mtn.png" alt="MTN Mobile Money" className="h-10 w-auto object-contain rounded-lg" />
                        <span className="text-[10px] font-bold mt-1 text-[#f5ebe0]">MTN MoMo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('airtel')}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                          selectedProvider === 'airtel'
                            ? 'border-[#f27059] bg-[#f27059]/5 shadow-[0_0_15px_rgba(242,112,89,0.25)]'
                            : 'border-[#f5ebe0]/10 bg-[#9c6644]/5 hover:border-[#f5ebe0]/20'
                        }`}
                      >
                        <img src="/airtel.png" alt="Airtel Money" className="h-10 w-auto object-contain rounded-lg" />
                        <span className="text-[10px] font-bold mt-1 text-[#f5ebe0]">Airtel Money</span>
                      </button>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/60 block mb-1.5">
                      {selectedProvider === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={checkoutPhone}
                      onChange={e => setCheckoutPhone(e.target.value)}
                      placeholder="e.g. +256700000000"
                      className="premium-input w-full !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059]"
                    />
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex justify-between items-center bg-[#291e19] border border-[#f5ebe0]/5 rounded-2xl p-4 mt-2">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/40 block">Total Amount</span>
                      <span className="text-xs font-semibold text-white">Luna Premium Lifetime Upgrade</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#f27059] font-display block">
                        {premiumPrice ? `${premiumPrice.amount_ugx.toLocaleString()} UGX` : '11,000 UGX'}
                      </span>
                      <span className="text-[10px] text-[#f5ebe0]/40 font-semibold block mt-0.5">
                        ~ ${premiumPrice?.amount_usd || 3} USD
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isInitiatingPayment || !checkoutPhone.trim()}
                    className="w-full rounded-full bg-[#f27059] py-3.5 text-xs font-bold text-white hover:bg-[#e05e47] active:scale-95 disabled:opacity-50 transition-all shadow-glow flex items-center justify-center gap-2"
                  >
                    {isInitiatingPayment ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        Initiating...
                      </>
                    ) : (
                      `Pay with ${selectedProvider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}`
                    )}
                  </button>
                </form>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <form onSubmit={scheduleSession} className="bg-[#9c6644]/5 border border-[#f5ebe0]/10 rounded-[2rem] p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Calendar size={16} className="text-[#f27059]" />
                    Schedule a Therapist Session
                  </h3>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const res = await api.post('/profiles/me/toggle-premium-test/')
                        onSaved(res.data)
                      } catch (e) {
                        console.error(e)
                      }
                    }} 
                    className="text-[10px] font-bold text-yellow-500 hover:underline select-none"
                  >
                    🔧 Reset to Free for testing
                  </button>
                </div>
                {schedError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400">
                    {schedError}
                  </div>
                )}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/60 block mb-1.5">Partner's Full Name</label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="premium-input w-full !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/60 block mb-1.5">Partner's Phone number</label>
                  <input
                    type="tel"
                    required
                    value={partnerPhone}
                    onChange={e => setPartnerPhone(e.target.value)}
                    placeholder="e.g. +256..."
                    className="premium-input w-full !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#f5ebe0]/60 block mb-1.5">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="premium-input w-full !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="w-full rounded-full bg-[#f27059] py-3.5 text-xs font-bold text-white hover:bg-[#e05e47] transition-all"
                >
                  {scheduling ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Calendar size={16} className="text-[#8ea869]" />
                  Upcoming Scheduled Sessions
                </h3>
                {sessions.length === 0 ? (
                  <div className="text-xs text-[#f5ebe0]/50 p-6 text-center border border-[#f5ebe0]/10 rounded-2xl bg-[#9c6644]/5">
                    No sessions scheduled yet. Book your first couples therapy session above!
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {sessions.map(s => (
                      <div key={s.id} className="border border-[#f5ebe0]/10 rounded-2xl p-4.5 bg-[#9c6644]/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-white">Joint session with {s.partner_name}</div>
                            <div className="text-[11px] text-[#f5ebe0]/60 mt-0.5">{new Date(s.scheduled_time).toLocaleString()}</div>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            {s.status}
                          </span>
                        </div>
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#8ea869]/10 hover:bg-[#8ea869]/20 border border-[#8ea869]/20 text-[#8ea869] font-bold py-2.5 text-xs transition-all"
                        >
                          <Video size={13} />
                          Join Google Meet Session
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Preferences({ profile, onSaved, navigateToPage }: { profile: Profile; onSaved: (profile: Profile) => void; navigateToPage: (page: 'conversations' | 'preferences' | 'counseling', subTab?: 'ai' | 'couples') => void }) {
  const [form, setForm] = useState({
    ...profile,
    username: profile.user.username,
    first_name: profile.user.first_name || '',
    email: profile.user.email || '',
    values: profile.values.join(', '),
    interests: profile.interests.join(', '),
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, profile_picture: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const save = async () => {
    setBusy(true)
    try {
      const { data } = await api.patch('/profiles/me/', {
        ...form,
        user: {
          username: form.username,
          first_name: form.first_name,
          email: form.email,
        },
        values: String(form.values).split(',').map(x => x.trim()).filter(Boolean),
        interests: String(form.interests).split(',').map(x => x.trim()).filter(Boolean)
      })
      onSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.is_premium) {
      navigateToPage('counseling', 'couples')
      return
    }
    if (!password) {
      setDeleteError('Confirm password to delete account.')
      return
    }
    if (!window.confirm('WARNING: Are you absolutely sure you want to permanently delete your account? This action is irreversible.')) {
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete('/profiles/me/account/', { data: { password } })
      api.post('/auth/logout/').catch(() => {})
      window.location.href = '/'
    } catch (err: any) {
      setDeleteError(err.response?.data?.password?.[0] || err.response?.data?.detail || 'An error occurred during account deletion.')
    } finally {
      setDeleting(false)
    }
  }

  const togglePremiumTest = async () => {
    try {
      const res = await api.post('/profiles/me/toggle-premium-test/')
      onSaved(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const labelStyle = 'text-xs font-bold uppercase tracking-wider text-[#f5ebe0]/80 block mb-1.5'

  return (
    <section className="mx-auto max-w-2xl py-10 w-full animate-fade-in">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f27059]">Account Details</p>
      <h1 className="mt-2 text-3xl font-bold font-display text-white">Preferences</h1>
      
      <div className="bg-[#1e1410] border border-[#f5ebe0]/10 mt-8 rounded-[2rem] p-6 sm:p-8 space-y-6 text-[#f5ebe0]">
        
        {/* Profile Picture */}
        <div>
          <label className={labelStyle}>Profile Picture</label>
          <div className="flex items-center gap-4 mt-2">
            {form.profile_picture ? (
              <img src={form.profile_picture} className="h-16 w-16 rounded-full object-cover border border-[#f5ebe0]/20" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#8ea869] text-[#1e1410] font-bold text-xl uppercase shrink-0">
                {((form.display_name || form.username).substring(0, 2))}
              </div>
            )}
            <label className="cursor-pointer rounded-full bg-[#f5ebe0]/10 border border-[#f5ebe0]/20 px-4 py-2 text-xs font-bold text-white hover:bg-[#f5ebe0]/20 active:scale-95 transition-all">
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {form.profile_picture && (
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, profile_picture: '' }))}
                className="text-xs text-[#f27059] font-bold hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelStyle}>Display name</label>
            <input
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelStyle}>First Name</label>
            <input
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
        </div>

        {/* Contacts & Credentials */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelStyle}>Username</label>
            <input
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className={labelStyle}>Email Address (Contact)</label>
            <input
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelStyle}>About you</label>
          <textarea
            className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20 resize-none"
            rows={3}
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div>
          <label className={labelStyle}>Values</label>
          <input
            className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
            value={String(form.values)}
            onChange={e => setForm({ ...form, values: e.target.value as any })}
            placeholder="Separate values with commas"
          />
        </div>

        <div>
          <label className={labelStyle}>Interests</label>
          <input
            className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
            value={String(form.interests)}
            onChange={e => setForm({ ...form, interests: e.target.value as any })}
            placeholder="Separate interests with commas"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelStyle}>My Gender</label>
            <select
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value as any })}
            >
              <option value="male">Man</option>
              <option value="female">Woman</option>
              <option value="other">Other / Non-binary</option>
            </select>
          </div>

          <div>
            <label className={labelStyle}>Show me profiles of</label>
            <select
              className="premium-input !bg-[#291e19] !border-[#f5ebe0]/10 !text-[#f5ebe0] focus:!border-[#f27059] focus:!ring-[#f27059]/20"
              value={form.gender_preference}
              onChange={e => setForm({ ...form, gender_preference: e.target.value as any })}
            >
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="both">Everyone</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className={labelStyle}>Discoverability & Alerts</label>
          <div className="space-y-3 mt-3">
            {profile.is_premium ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#f27059]/30 bg-[#f27059]/10 p-4.5 text-white shadow-premium">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f27059]">Luna Premium</div>
                  <div className="text-[11px] text-[#f5ebe0]/70 mt-0.5">Your subscription is active. Enjoy all premium benefits!</div>
                  <button type="button" onClick={togglePremiumTest} className="mt-2 text-[10px] text-yellow-400 font-bold hover:underline select-none block text-left">
                    🔧 Toggle Premium status for testing (Dev Mode)
                  </button>
                </div>
                <span className="rounded-full bg-[#f27059] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">Active</span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-[#f5ebe0]/10 bg-[#9c6644]/5 p-4.5 text-[#f5ebe0]/70">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f5ebe0]/50">Luna Premium</div>
                  <div className="text-[11px] text-[#f5ebe0]/50 mt-0.5">Upgrade in the Counseling tab to unlock all advanced features.</div>
                  <button type="button" onClick={togglePremiumTest} className="mt-2 text-[10px] text-yellow-500 font-bold hover:underline select-none block text-left">
                    🔧 Toggle Premium status for testing (Dev Mode)
                  </button>
                </div>
                <span className="rounded-full bg-[#f5ebe0]/10 px-3 py-1 text-[10px] font-bold text-[#f5ebe0]/40 uppercase tracking-wider">Inactive</span>
              </div>
            )}
            {([
              ['is_discoverable', 'Allow Luna to look for introductions', 'Let Gemini match your profile with other verified users.'],
              ['ai_profile_consent', 'Allow AI profile analysis', 'Use Gemini to build compatibility score metrics.'],
              ['sms_match_notifications', 'SMS connection notifications', 'Send quick text alerts when you get introduced.'],
              ['sms_unread_reminders', 'SMS unread reminders', 'Alert your phone if you have unread direct messages.'],
              ['sms_safety_alerts', 'SMS safety alerts', 'Verify emergency and safety warnings by SMS.']
            ] as const).map(([field, label, desc]) => (
              <label
                key={field}
                className={`flex items-start gap-4 rounded-2xl border p-4.5 cursor-pointer transition-all ${
                  form[field]
                    ? 'border-[#f27059]/30 bg-[#f27059]/10 text-white'
                    : 'border-[#f5ebe0]/10 bg-[#9c6644]/10 hover:border-[#f27059]/20 text-[#f5ebe0]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form[field])}
                  onChange={e => setForm({ ...form, [field]: e.target.checked })}
                  className="mt-0.5 rounded border-[#f5ebe0]/10 text-[#f27059] focus:ring-[#f27059]/20 h-4 w-4"
                />
                <div>
                  <span className={`block font-bold text-xs ${form[field] ? 'text-[#f27059]' : 'text-white'}`}>{label}</span>
                  <span className="block text-[10px] text-[#f5ebe0]/70 mt-0.5">{desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="mt-4 w-full rounded-full bg-[#f27059] px-6 py-3.5 font-bold text-white hover:bg-[#e05e47] active:scale-95 transition-all disabled:opacity-50 shadow-glow"
        >
          {busy ? 'Saving...' : saved ? '✓ Changes Saved' : 'Save changes'}
        </button>

        {/* Delete Account section */}
        <div className="mt-8 pt-8 border-t border-[#f5ebe0]/10">
          <label className="text-xs font-bold uppercase tracking-wider text-red-500 block mb-1.5">Danger Zone</label>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-[#f5ebe0]">
            <h4 className="text-sm font-bold text-white">Permanently Delete Account</h4>
            <p className="text-xs text-[#f5ebe0]/70 mt-1 leading-relaxed">
              This will instantly erase your profile summaries, conversations, matches, and details. This cannot be undone.
            </p>
            
            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
              {deleteError && <div className="text-xs text-red-400 font-bold">{deleteError}</div>}
              <div>
                <input
                  type="password"
                  placeholder="Enter password to confirm deletion"
                  className="premium-input !bg-[#291e19] !border-red-500/20 !text-[#f5ebe0] focus:!border-red-500 focus:!ring-red-500/20 text-xs py-2"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-full bg-red-500 hover:bg-red-600 px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  )
}

export default function Dashboard({ onGoToAdmin }: { onGoToAdmin?: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector((s: RootState) => s.luna)
  const [inboxTab, setInboxTab] = useState<'chats' | 'offers'>('chats')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [counselingTab, setCounselingTab] = useState<'ai' | 'couples'>('ai')

  const getInitialStateFromUrl = () => {
    const p = window.location.pathname
    if (p === '/preferences') {
      return { page: 'preferences' as const, chatId: null }
    }
    if (p === '/counseling') {
      return { page: 'counseling' as const, chatId: null }
    }
    if (p.startsWith('/chat/')) {
      const id = parseInt(p.split('/')[2], 10)
      return { page: 'conversations' as const, chatId: isNaN(id) ? null : id }
    }
    return { page: 'conversations' as const, chatId: null }
  }

  const [urlState, setUrlState] = useState(getInitialStateFromUrl)
  const page = urlState.page
  const chatId = urlState.chatId

  const navigateToPage = (newPage: 'conversations' | 'preferences' | 'counseling', subTab?: 'ai' | 'couples') => {
    const path = newPage === 'preferences' ? '/preferences' : (newPage === 'counseling' ? '/counseling' : '/dashboard')
    window.history.pushState({}, '', path)
    setUrlState({ page: newPage, chatId: null })
    if (newPage === 'counseling' && subTab) {
      setCounselingTab(subTab)
    }
  }

  const navigateToChat = (id: number | null) => {
    const path = id === null ? '/dashboard' : `/chat/${id}`
    window.history.pushState({}, '', path)
    setUrlState({ page: 'conversations', chatId: id })
  }

  useEffect(() => {
    const handlePop = () => {
      setUrlState(getInitialStateFromUrl())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    dispatch(loadDashboard())
  }, [dispatch])

  const profile = state.profile
  const conversation = state.conversations.find(c => c.id === chatId)

  if (!profile) return null

  return (
    <div className="noise min-h-screen bg-[#1e1410] text-[#f5ebe0] selection:bg-[#f27059]/20 flex flex-col overflow-x-hidden">
      <AppHeader page={page} setPage={navigateToPage} profile={profile} onGoToAdmin={onGoToAdmin} />
      
      <main className={`mx-auto w-full ${page === 'conversations' ? 'max-w-[1440px]' : 'max-w-6xl'} px-5 pb-10 flex-1 flex flex-col transition-all duration-300`}>
        {page === 'conversations' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-8 flex-1 items-stretch md:h-[calc(100vh-160px)]">
            
            {/* Conversations List Panel */}
            <section className={`flex flex-col h-full ${chatId !== null ? 'md:col-span-4 lg:col-span-3 hidden md:flex' : 'md:col-span-5 lg:col-span-4 flex'}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f27059]">Your inbox</p>
                <h1 className="mt-2 text-3xl font-bold font-display text-white">Conversations</h1>
                <p className="mt-2 text-sm text-[#f5ebe0]/80">Luna brings potential connections here privately, one at a time.</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 border-b border-[#f5ebe0]/10 pb-3 mt-6">
                <button
                  onClick={() => setInboxTab('chats')}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    inboxTab === 'chats'
                      ? 'bg-[#f27059] text-white shadow-premium'
                      : 'text-[#f5ebe0]/80 hover:bg-[#1e1410] hover:text-white'
                  }`}
                >
                  Chats ({state.conversations.filter(c => !c.is_counseling).length})
                </button>
                <button
                  onClick={() => setInboxTab('offers')}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    inboxTab === 'offers'
                      ? 'bg-[#f27059] text-white shadow-premium'
                      : 'text-[#f5ebe0]/80 hover:bg-[#1e1410] hover:text-white'
                  }`}
                >
                  Match Offers ({state.matches.filter(m => m.status === 'suggested').length})
                </button>
              </div>

              <div className="mt-5 space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-2">
                {inboxTab === 'chats' ? (
                  <>
                    {state.conversations.filter(c => !c.is_counseling).map(c => {
                      const isSelected = c.id === chatId
                      return (
                        <button
                          key={c.id}
                          onClick={() => navigateToChat(c.id)}
                          className={`flex w-full items-center gap-4 rounded-2xl p-4.5 text-left transition-all duration-200 border ${
                            isSelected
                              ? 'bg-[#1e1410] border-[#f27059]/30 text-white shadow-premium'
                              : 'bg-[#1e1410]/50 border-[#f5ebe0]/10 hover:border-[#f27059]/30 hover:bg-[#1e1410] text-[#f5ebe0]'
                          }`}
                        >
                          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                            isSelected ? 'bg-[#f27059] text-white shadow-premium' : 'bg-[#8ea869] text-[#1e1410] border border-[#8ea869]/20'
                          }`}>
                            {c.is_luna ? <Sparkles size={16} /> : <MessageCircle size={16} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-sm truncate ${isSelected ? 'text-[#f27059]' : 'text-white'}`}>
                                {c.title}
                              </span>
                              {c.unread_count > 0 && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#f27059] shadow-glow" />
                              )}
                            </div>
                            <div className="mt-1 truncate text-xs text-[#f5ebe0]/60">
                              {c.messages && c.messages.length ? c.messages[c.messages.length - 1].body : 'Start the conversation'}
                            </div>
                          </div>
                          <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'text-[#f27059]' : 'text-[#f5ebe0]/40'}`} />
                        </button>
                      )
                    })}
                    
                    {!state.loading && state.conversations.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#f5ebe0]/10 bg-[#291e19]/50 p-8 text-center text-xs font-semibold text-[#f5ebe0]/50">
                        Your Luna inbox is being prepared.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {state.matches.filter(m => m.status === 'suggested').map(m => (
                      <div
                        key={m.id}
                        className="bg-[#1e1410] border border-[#f5ebe0]/10 rounded-2xl p-5 shadow-soft flex flex-col gap-3 transition-all hover:border-[#f27059]/20 text-[#f5ebe0]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-white">{m.profile.display_name}</span>
                            <span className="text-[10px] block mt-0.5 uppercase tracking-wider font-bold text-[#f27059]">{m.profile.connection_goal}</span>
                          </div>
                          <span className="rounded-full bg-[#8ea869]/10 px-2.5 py-1 text-[10px] font-bold text-[#8ea869] border border-[#8ea869]/20">
                            {m.score}% Match
                          </span>
                        </div>

                        {m.profile.bio && (
                          <p className="text-[11px] text-[#f5ebe0]/80 italic leading-relaxed border-t border-b border-[#f5ebe0]/10 py-3">
                            "{m.profile.bio}"
                          </p>
                        )}

                        {m.ai_explanation ? (
                          <div className="text-[10px] text-[#f5ebe0]/90 leading-normal bg-[#9c6644]/10 rounded-xl p-3 border border-[#f5ebe0]/10">
                            <span className="font-bold text-[#f27059] block mb-1">Luna's Compatibility Insight:</span>
                            {m.ai_explanation}
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/matches/${m.id}/explain/`)
                                dispatch(loadDashboard())
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                            className="text-[10px] font-bold text-[#f27059] hover:text-[#e05e47] text-left flex items-center gap-1.5"
                          >
                            <Sparkles size={12} className="animate-pulse" /> Ask Luna to explain match compatibility
                          </button>
                        )}

                        <div className="flex gap-2.5 mt-2">
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/matches/${m.id}/pass/`)
                                dispatch(loadDashboard())
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                            className="flex-1 rounded-full border border-[#f5ebe0]/20 bg-transparent text-[10px] font-bold text-[#f5ebe0] py-2.5 hover:bg-[#f5ebe0]/10 active:scale-95 transition-all"
                          >
                            Pass
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.post(`/matches/${m.id}/accept/`)
                                dispatch(loadDashboard())
                                if (res.data.conversation_id) {
                                  navigateToChat(res.data.conversation_id)
                                }
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                            className="flex-1 rounded-full bg-[#f27059] text-[10px] font-bold text-white py-2.5 hover:bg-[#e05e47] active:scale-95 shadow-premium transition-all"
                          >
                            Accept & Chat
                          </button>
                        </div>
                      </div>
                    ))}

                    {state.matches.filter(m => m.status === 'suggested').length === 0 && (
                      <div className="rounded-2xl border border-dashed border-cocoa-900/10 bg-white/20 p-8 text-center text-xs font-semibold text-cocoa-500">
                        No new suggested matches at this moment. Luna is continually screening profiles.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Profile Card settings widget */}
              <div className="mt-6 border-t border-[#f5ebe0]/10 pt-4">
                <div 
                  onClick={() => navigateToPage('preferences')}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#1e1410]/50 border border-[#f5ebe0]/10 hover:bg-[#1e1410] hover:border-[#f27059]/30 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {profile.profile_picture ? (
                    <img 
                      src={profile.profile_picture} 
                      alt={profile.display_name || profile.user.username} 
                      className="h-10 w-10 rounded-full object-cover border border-[#f5ebe0]/20" 
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#8ea869] text-[#1e1410] font-bold text-sm uppercase border border-[#8ea869]/20 shrink-0">
                      {((profile.display_name || profile.user.username).substring(0, 2))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{profile.display_name || profile.user.username}</div>
                    <div className="text-[11px] font-semibold text-[#f5ebe0]/40 mt-0.5">
                      {profile.is_premium ? (
                        <span className="text-[#eab308] font-bold uppercase tracking-wider">Premium</span>
                      ) : (
                        <span>Free Tier</span>
                      )}
                    </div>
                  </div>
                </div>
                {!profile.is_premium && (
                  <button
                    onClick={() => navigateToPage('counseling')}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-full border border-[#f5ebe0]/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-[#f5ebe0] py-2.5 transition-all shadow-soft active:scale-[0.98]"
                  >
                    <Gift size={12} className="text-[#f27059]" />
                    Claim offer
                  </button>
                )}
              </div>

            </section>

            {/* Conversation Window/Placeholder Pane */}
            <section className={`h-full ${chatId !== null ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-7 lg:col-span-8'} ${chatId === null ? 'hidden md:flex md:items-center md:justify-center' : 'flex flex-col'}`}>
              {conversation ? (
                <Chat conversation={conversation} onClose={() => navigateToChat(null)} onReload={() => dispatch(loadDashboard())} onGoToCounseling={() => navigateToPage('counseling', 'couples')} />
              ) : (
                <div className="hidden md:flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border border-dashed border-cocoa-900/10 bg-white/20 h-full w-full">
                  <div className="p-4 bg-terracotta-50 rounded-full border border-terracotta-200/50 text-terracotta-500 mb-4 animate-bounce">
                    <Sparkles size={36} />
                  </div>
                  <h3 className="text-lg font-bold text-cocoa-900 font-display">Select a conversation</h3>
                  <p className="mt-2 text-xs text-cocoa-500 max-w-xs leading-relaxed">
                    Click a connection profile or message with Luna on the left to read messages and compatibility insights.
                  </p>
                </div>
              )}
            </section>

          </div>
        ) : page === 'preferences' ? (
          <Preferences profile={profile} onSaved={p => dispatch(setProfile(p))} navigateToPage={navigateToPage} />
        ) : (
          <Counseling profile={profile} onSaved={p => dispatch(setProfile(p))} tab={counselingTab} setTab={setCounselingTab} />
        )}
      </main>

      <footer className="w-full border-t border-[#f5ebe0]/10 py-6 text-center text-xs text-[#f5ebe0]/40">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Luna. All rights reserved.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-white transition-all underline decoration-dotted"
            >
              Privacy Policy & Safety Disclaimer
            </button>
          </div>
        </div>
      </footer>

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#1e1410] border border-[#f5ebe0]/10 rounded-[2rem] shadow-soft overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-5 border-b border-[#f5ebe0]/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold font-display">
                <Shield className="text-[#f27059]" size={20} />
                <span>Luna Privacy Policy & Safety Disclaimer</span>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="rounded-full p-1.5 hover:bg-[#f5ebe0]/10 text-[#f5ebe0]/70 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </header>
            
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#f5ebe0]/80 leading-relaxed">
              <section className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#f27059]">
                  <AlertTriangle size={13} /> Chat Safety Disclaimer
                </h4>
                <p>
                  Luna acts as an AI matchmaker to facilitate initial introductions and connection conversations. Luna has no control over, and does not accept responsibility for, the actions, conduct, or behavior of any users off-platform. 
                </p>
                <p className="font-semibold text-white/95">
                  Be extremely cautious when sharing sensitive personal information, credentials, location, or payment details. Never send money, complete commercial transactions, or offer services in chats.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#f27059]">
                  <Shield size={13} /> Strict Connection Guidelines
                </h4>
                <p>
                  This platform is strictly for meaningful and authentic human connections. Begging for financial help, soliciting cash/momo transfers, commercial sales, spamming, and prostitution are strictly prohibited. 
                </p>
                <p>
                  Accounts violating these guidelines will be flagged by automated system filters and immediately suspended from all platform operations.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#f27059]">
                  <Users size={13} /> Data Collection & Handling
                </h4>
                <p>
                  By consenting to onboard with Luna, your bio, lifestyle preferences, deal-breakers, and interests are safely analyzed to recommend matching profiles. 
                </p>
                <p>
                  Your counseling conversations with Luna remain confidential and encrypted. We do not sell or share private chat records or personal identification details with third-party networks.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#f27059]">
                  <Lock size={13} /> User Rights & Account Deletion
                </h4>
                <p>
                  You hold full rights over your profile data. At any time, you can edit your matching discoverability or request permanent account deletion via the Preferences panel. Deletion permanently erases your profile, messages, and matches from our records.
                </p>
              </section>
            </div>

            <footer className="px-6 py-4 border-t border-[#f5ebe0]/10 flex justify-end bg-cocoa-900/10">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="rounded-full bg-[#f27059] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#e05e47] active:scale-95 transition-all shadow-glow"
              >
                Understand & Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
