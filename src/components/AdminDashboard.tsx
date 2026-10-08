import { useEffect, useState } from 'react'
import { ArrowLeft, Shield, UserX, UserCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import api from '../lib/api'

type Metric = {
  profiles: number
  onboarded_profiles: number
  suggested_matches: number
  accepted_matches: number
  conversations: number
  messages: number
  open_reports: number
}

type Report = {
  id: number
  reporter_name: string
  reported_name: string
  conversation: number
  reason: string
  details: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  resolution_notes: string
  created_at: string
  reviewed_at: string | null
}

type AdminUser = {
  id: number
  username: string
  display_name: string
  email: string
  phone_number: string
  is_active: boolean
  onboarding_complete: boolean
}

type Props = {
  onBack: () => void
}

export default function AdminDashboard({ onBack }: Props) {
  const [metrics, setMetrics] = useState<Metric | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports')
  const [loading, setLoading] = useState(true)
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({})

  const loadData = async () => {
    try {
      setLoading(true)
      const [mRes, rRes, uRes] = await Promise.all([
        api.get('/ops/metrics/'),
        api.get('/moderation/reports/'),
        api.get('/moderation/reports/users/'),
      ])
      setMetrics(mRes.data)
      setReports(rRes.data.results ?? rRes.data)
      setUsers(uRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resolveReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    const notes = actionNotes[reportId] || ''
    try {
      await api.post(`/moderation/reports/${reportId}/resolve/`, { status, resolution_notes: notes })
      // Clear notes and reload
      setActionNotes(prev => {
        const copy = { ...prev }
        delete copy[reportId]
        return copy
      })
      await loadData()
    } catch (err) {
      console.error('Failed to resolve report:', err)
    }
  }

  const toggleSuspend = async (profileId: number) => {
    try {
      await api.post(`/moderation/reports/users/${profileId}/suspend/`)
      await loadData()
    } catch (err) {
      console.error('Failed to toggle user suspension:', err)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#168eea] text-sm font-bold text-[#168eea] noise">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Shield className="animate-spin text-[#168eea]" size={24} />
          <span className="font-display tracking-wide">Loading safety matrix…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#168eea] text-[#ffffff] pb-16 noise">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#ffffff]/10 bg-[#000000] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#ffffff]/10 bg-[#000000] text-[#ffffff] hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight flex items-center gap-2 text-white">
              <Shield className="text-[#168eea]" size={20} />
              Belong Control Panel
            </h1>
            <p className="text-[10px] text-[#ffffff]/80 font-bold uppercase tracking-wider">Moderator Dashboard</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#000000] border border-[#ffffff]/10 rounded-3xl p-5 shadow-soft">
              <p className="text-xs font-bold text-[#ffffff]/60 uppercase tracking-wider">Total Profiles</p>
              <p className="text-2xl font-bold font-display text-white mt-1">{metrics.profiles}</p>
              <p className="text-[10px] text-[#ffffff]/80 mt-2 font-medium">{metrics.onboarded_profiles} completed onboarding</p>
            </div>
            <div className="bg-[#000000] border border-[#ffffff]/10 rounded-3xl p-5 shadow-soft">
              <p className="text-xs font-bold text-[#ffffff]/60 uppercase tracking-wider">Matches Formed</p>
              <p className="text-2xl font-bold font-display text-white mt-1">{metrics.accepted_matches}</p>
              <p className="text-[10px] text-[#ffffff]/80 mt-2 font-medium">{metrics.suggested_matches} currently suggested</p>
            </div>
            <div className="bg-[#000000] border border-[#ffffff]/10 rounded-3xl p-5 shadow-soft">
              <p className="text-xs font-bold text-[#ffffff]/60 uppercase tracking-wider">Total Messages</p>
              <p className="text-2xl font-bold font-display text-white mt-1">{metrics.messages}</p>
              <p className="text-[10px] text-[#ffffff]/80 mt-2 font-medium">Across {metrics.conversations} chats</p>
            </div>
            <div className="bg-[#000000] border border-[#ffffff]/10 rounded-3xl p-5 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#168eea]/20 rounded-full filter blur-2xl opacity-50 -mr-6 -mt-6"></div>
              <p className="text-xs font-bold text-[#ffffff]/60 uppercase tracking-wider">Pending Reports</p>
              <p className="text-2xl font-bold font-display text-[#168eea] mt-1">{metrics.open_reports}</p>
              <p className="text-[10px] text-[#ffffff]/80 mt-2 font-medium flex items-center gap-1">
                <AlertTriangle size={10} className="text-[#168eea] animate-pulse" /> Urgent attention needed
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#ffffff]/10 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-bold tracking-tight transition-all border-b-2 ${
              activeTab === 'reports'
                ? 'border-[#168eea] text-[#168eea]'
                : 'border-transparent text-[#ffffff]/60 hover:text-white'
            }`}
          >
            Safety Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-bold tracking-tight transition-all border-b-2 ${
              activeTab === 'users'
                ? 'border-[#168eea] text-[#168eea]'
                : 'border-transparent text-[#ffffff]/60 hover:text-white'
            }`}
          >
            User Directory ({users.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'reports' ? (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-[#000000] border border-[#ffffff]/10 rounded-[2rem] p-12 text-center text-[#ffffff]/60 shadow-soft">
                <Shield className="mx-auto text-[#ffffff]/40 mb-3" size={32} />
                <p className="font-bold text-lg font-display text-white">No reports filed</p>
                <p className="text-xs mt-1">Our community is chatting safely and respectfully.</p>
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="bg-[#000000] border border-[#ffffff]/10 rounded-3xl p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          r.status === 'open' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          r.status === 'reviewing' ? 'bg-[#168eea]/10 text-[#168eea] border border-[#168eea]/20' :
                          'bg-[#ffffff]/10 text-[#ffffff] border border-[#ffffff]/20'
                        }`}>
                          {r.status === 'open' && <AlertTriangle size={10} />}
                          {r.status === 'reviewing' && <Clock size={10} />}
                          {r.status === 'resolved' && <CheckCircle size={10} />}
                          {r.status}
                        </span>
                        <span className="text-[10px] text-[#ffffff]/50 font-bold uppercase">Report #{r.id}</span>
                      </div>
                      <h3 className="font-bold text-base font-display mt-2 text-white">
                        {r.reporter_name} reported {r.reported_name}
                      </h3>
                      <p className="text-xs text-[#168eea] mt-1 font-bold uppercase tracking-wider">Reason: {r.reason}</p>
                      <p className="text-xs text-[#ffffff]/90 mt-3 bg-[#168eea]/10 border border-[#ffffff]/10 rounded-2xl p-4 italic">"{r.details}"</p>
                    </div>
                    <div className="text-right text-[10px] text-[#ffffff]/50 font-bold">
                      Filed on {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>

                  {r.status !== 'resolved' && r.status !== 'dismissed' && (
                    <div className="mt-6 border-t border-[#ffffff]/10 pt-4">
                      <textarea
                        value={actionNotes[r.id] || ''}
                        onChange={e => setActionNotes({ ...actionNotes, [r.id]: e.target.value })}
                        placeholder="Resolution notes or actions taken..."
                        className="w-full text-xs bg-[#111111] border border-[#ffffff]/10 text-white rounded-2xl p-3 focus:outline-none focus:border-[#168eea]/30 transition-all resize-none h-16"
                      />
                      <div className="flex gap-3 justify-end mt-3">
                        <button
                          onClick={() => resolveReport(r.id, 'dismissed')}
                          className="rounded-full border border-[#ffffff]/20 bg-transparent text-xs font-bold text-[#ffffff] px-5 py-2 hover:bg-[#ffffff]/10 active:scale-95 transition-all"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => resolveReport(r.id, 'resolved')}
                          className="rounded-full bg-[#168eea] text-xs font-bold text-white px-5 py-2 hover:bg-[#0875c6] active:scale-95 transition-all"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-[#000000] border border-[#ffffff]/10 rounded-[2rem] overflow-hidden shadow-soft">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#ffffff]/10 bg-[#000000] text-[10px] font-bold uppercase tracking-wider text-[#ffffff]/60">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Display Name</th>
                  <th className="px-6 py-4">Contact info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff]/10 text-[#ffffff]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#ffffff]/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                    <td className="px-6 py-4 text-[#ffffff]/90 font-semibold">{u.display_name}</td>
                    <td className="px-6 py-4 text-[#ffffff]/70">
                      <div>{u.email}</div>
                      <div className="text-[10px] mt-0.5">{u.phone_number || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold uppercase text-[9px] ${
                        u.is_active ? 'bg-[#ffffff]/10 text-[#ffffff] border border-[#ffffff]/20' : 'bg-[#168eea]/10 text-[#168eea] border border-[#168eea]/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-[#ffffff]' : 'bg-[#168eea]'}`}></span>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleSuspend(u.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-wide transition-all shadow-soft active:scale-95 ${
                          u.is_active
                            ? 'bg-[#168eea] text-white hover:bg-[#0875c6]'
                            : 'bg-[#ffffff] text-[#000000] hover:bg-[#d4d4d4]'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserX size={12} /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} /> Restore
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
