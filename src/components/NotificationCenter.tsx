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
            ? 'bg-terracotta-50 border-terracotta-200/50 text-terracotta-500' 
            : 'border-cocoa-900/10 bg-white/50 text-cocoa-500 hover:bg-cocoa-900/5 hover:text-cocoa-900'
        }`}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-terracotta-500 px-1 text-[9px] font-bold text-white shadow-glow border border-white animate-pulse">
            {unread}
          </span>
        )}
      </button>
      
      {open && (
        <div className="glass absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-cocoa-900/10 bg-white shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-cocoa-900/5 p-4 bg-warmbg/30">
            <div>
              <h3 className="text-sm font-bold text-cocoa-900">Notifications</h3>
              <p className="text-[10px] text-cocoa-500 font-semibold">Activity while you were away</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-cocoa-500 hover:bg-cocoa-900/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          
          <div className="max-h-[320px] overflow-y-auto divide-y divide-cocoa-900/5">
            {items.map(n => (
              <div
                key={n.id}
                className={`p-4 transition-colors ${
                  n.read_at 
                    ? 'opacity-60 bg-white' 
                    : 'bg-terracotta-50/20'
                }`}
              >
                <div className="text-xs font-bold text-cocoa-900">{n.title}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-normal text-cocoa-500 font-medium">{n.body}</p>
                <time className="mt-2 block text-[9px] font-semibold text-cocoa-300">
                  {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="p-8 text-center text-xs font-semibold text-cocoa-300 flex flex-col items-center justify-center gap-2">
                <BellOff size={24} className="text-cocoa-300/60" />
                <span>You’re all caught up.</span>
              </div>
            )}
          </div>
          
          {unread > 0 && (
            <button
              onClick={readAll}
              className="flex w-full items-center justify-center gap-2 border-t border-cocoa-900/5 bg-warmbg/10 p-3.5 text-xs font-bold text-terracotta-500 hover:bg-terracotta-50 transition-colors"
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
