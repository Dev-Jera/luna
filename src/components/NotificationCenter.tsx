import { useEffect, useState } from 'react'
import { Bell, Check, X, BellOff } from 'lucide-react'
import api from '../lib/api'
import type { Notification } from '../types'

export default function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    api.get('/notifications/')
      .then(({ data }) => setItems(data.results ?? data))
      .catch(() => {})
  }, [])

  const unread = items.filter(x => !x.read_at).length

  const readAll = async () => {
    await api.post('/notifications/read-all/')
    setItems(items.map(x => ({ ...x, read_at: new Date().toISOString() })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 ${
          open 
            ? 'bg-[#f27059] border-[#f27059]/30 text-white' 
            : 'border-[#f5ebe0]/10 bg-[#f5ebe0]/5 text-[#f5ebe0]/80 hover:bg-[#f5ebe0]/10 hover:text-white'
        }`}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#f27059] px-1 text-[9px] font-bold text-white shadow-glow border border-[#1e1410] animate-pulse">
            {unread}
          </span>
        )}
      </button>
      
      {open && (
        <div className="glass absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-[#f5ebe0]/10 bg-[#1e1410] shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-[#f5ebe0]/10 p-4 bg-[#291e19]">
            <div>
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <p className="text-[10px] text-[#f5ebe0]/60 font-semibold">Activity while you were away</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-[#f5ebe0]/80 hover:bg-[#f5ebe0]/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f5ebe0]/10">
            {items.map(n => (
              <div
                key={n.id}
                className={`p-4 transition-colors ${
                  n.read_at 
                    ? 'opacity-60 bg-[#1e1410]' 
                    : 'bg-[#f27059]/5'
                }`}
              >
                <div className="text-xs font-bold text-white">{n.title}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-normal text-[#f5ebe0]/85 font-medium">{n.body}</p>
                <time className="mt-2 block text-[9px] font-semibold text-[#f5ebe0]/40">
                  {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="p-8 text-center text-xs font-semibold text-[#f5ebe0]/40 flex flex-col items-center justify-center gap-2">
                <BellOff size={24} className="text-[#f5ebe0]/30" />
                <span>You’re all caught up.</span>
              </div>
            )}
          </div>
          
          {unread > 0 && (
            <button
              onClick={readAll}
              className="flex w-full items-center justify-center gap-2 border-t border-[#f5ebe0]/10 bg-[#f27059]/10 p-3.5 text-xs font-bold text-[#f27059] hover:bg-[#f27059]/20 transition-colors"
            >
              <Check size={13} strokeWidth={3} />
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  )
}
