import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {Circle} from 'lucide-react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import AdminDashboard from './components/AdminDashboard'
import api from './lib/api'
import {loadDashboard,setProfile} from './store'
import type {AppDispatch,RootState} from './store'

export default function App(){
  const [session,setSession]=useState<'checking'|'authenticated'|'anonymous'>('checking')
  const [path, setPath] = useState(window.location.pathname)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const dispatch=useDispatch<AppDispatch>()
  const {profile,loading,error}=useSelector((s:RootState)=>s.luna)
  
  useEffect(()=>{
    api.get('/auth/session/')
      .then(()=>{
        setSession('authenticated')
        dispatch(loadDashboard())
        const currentPath = window.location.pathname
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/how-it-works') {
          window.history.replaceState({}, '', '/')
          setPath('/')
        } else if (currentPath !== '/' && currentPath !== '/admin' && currentPath !== '/dashboard' && currentPath !== '/home' && currentPath !== '/preferences' && currentPath !== '/counseling' && !currentPath.startsWith('/chat/')) {
          window.history.replaceState({}, '', '/')
          setPath('/')
        }
      })
      .catch(()=>setSession('anonymous'))
  },[dispatch])

  useEffect(() => {
    const handleLogout = () => setSession('anonymous')
    window.addEventListener('auth-logged-out', handleLogout)
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => {
      window.removeEventListener('auth-logged-out', handleLogout)
      window.removeEventListener('popstate', handlePop)
    }
  }, [])
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to PWA prompt: ${outcome}`)
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  if(session==='checking') {
    if (window.location.pathname === '/' || window.location.pathname === '/how-it-works') {
      return <Auth />
    }
    return (
      <div className="grid min-h-screen place-items-center bg-warmbg text-sm font-bold text-white noise">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Circle className="animate-spin text-white" size={24} strokeWidth={3} />
          <span className="font-display tracking-wide">Belong is listening…</span>
        </div>
      </div>
    )
  }
  
  if(session==='anonymous') return <Auth/>
  
  if(loading&&!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-warmbg text-sm font-bold text-white noise">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Circle className="animate-spin text-white" size={24} />
          <span className="font-display tracking-wide">Finding your people…</span>
        </div>
      </div>
    )
  }
  
  if(error&&!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-warmbg text-white noise">
        <div className="text-center max-w-sm p-8 bg-cream border border-cocoa-900/5 rounded-[2rem] shadow-premium">
          <p className="font-bold text-lg font-display text-cocoa-900">We couldn’t open Belong.</p>
          <p className="text-xs text-cocoa-500 mt-2">There was an issue connecting to the servers.</p>
          <button
            onClick={async()=>{await api.post('/auth/logout/');location.reload()}}
            className="mt-6 rounded-full bg-terracotta-600 px-6 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-terracotta-700 active:scale-95 transition-all"
          >
            Return to sign in
          </button>
        </div>
      </div>
    )
  }
  
  if(profile&&!profile.onboarding_complete)return <Onboarding profile={profile} onComplete={p=>dispatch(setProfile(p))}/>
  
  return (
    <>
      {path === '/admin' && profile?.user.is_staff ? (
        <AdminDashboard onBack={() => { window.history.pushState({}, '', '/dashboard'); setPath('/dashboard') }} />
      ) : profile ? (
        <Dashboard onGoToAdmin={() => { window.history.pushState({}, '', '/admin'); setPath('/admin') }}/>
      ) : null}

      {showInstallBanner && (
        <div className="fixed bottom-6 left-6 right-6 z-50 md:left-auto md:max-w-sm bg-cream border border-cocoa-900/10 rounded-3xl p-5 shadow-premium flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs font-display text-cocoa-900">Install Belong</h4>
              <p className="text-[10px] text-cocoa-500 mt-1 leading-normal">Add Belong directly to your home screen for instant, secure matching notifications and speed dates.</p>
            </div>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-cocoa-400 hover:text-cocoa-900 text-xs font-bold font-display"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="flex-1 rounded-full border border-cocoa-900/5 bg-white text-[10px] font-bold text-cocoa-500 py-2 hover:bg-cocoa-50 transition-all"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 rounded-full bg-terracotta-500 text-[10px] font-bold text-white py-2 hover:bg-terracotta-600 active:scale-95 shadow-premium transition-all"
            >
              Install Now
            </button>
          </div>
        </div>
      )}
    </>
  )
}
