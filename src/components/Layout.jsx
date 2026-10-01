import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, Compass, House, LogOut, Map, Menu, MessageCircle, Moon, Plus, Search, Sun, Users, X, Zap } from 'lucide-react'
import { Avatar } from './ui.jsx'
import { currentStudent } from '../data/students.js'

const navItems = [
  { label: 'Home', to: '/', icon: House }, { label: 'Discover', to: '/discover', icon: Compass }, { label: 'Ask a Senior', to: '/mentors', icon: MessageCircle },
  { label: 'Study Pods', to: '/pods', icon: Users }, { label: 'Resources', to: '/resources', icon: BookOpen }, { label: 'Campus Pulse', to: '/pulse', icon: Zap }, { label: 'Roadmap', to: '/roadmap', icon: Map },
]
const mobileItems = [navItems[0], navItems[1], navItems[3], navItems[4], { label: 'More', to: '/profile', icon: Menu }]

export default function Layout({ appState }) {
  const [search, setSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const userProfile = appState.profile || currentStudent
  const userName = userProfile.name || appState.authUser?.user_metadata?.name || appState.authUser?.email || currentStudent.name
  const userInitials = userProfile.initials || userName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  function searchSubmit(event) {
    event.preventDefault()
    if (search.trim()) navigate(`/discover?q=${encodeURIComponent(search.trim())}`)
  }

  return <div className="min-h-screen md:flex">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] flex-col border-r border-[#e7ece6] bg-[#fbfcfa] px-5 py-6 md:flex">
      <NavLink to="/" className="mb-9 flex items-center gap-3 px-2"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#287b53] text-[#e7f594]"><BookOpen size={21} strokeWidth={2.5} /></span><span><span className="block font-extrabold leading-tight text-[#263b2e]">CampusSetu</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.09em] text-[#8b968d]">Learn together</span></span></NavLink>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#9aa49b]">Your campus</div>
      <nav className="flex flex-col gap-1">{navItems.map(({ label, to, icon: Icon }) => <NavLink key={label} to={to} end={to === '/'} className={({ isActive }) => `flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors ${isActive ? 'bg-[#e9f2e8] text-[#286e4a]' : 'text-[#758177] hover:bg-[#f0f4ef] hover:text-[#36493c]'}`}><Icon size={17} strokeWidth={1.9} /><span>{label}</span>{label === 'Ask a Senior' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e5a248]" />}</NavLink>)}</nav>
      <div className="mt-auto rounded-2xl bg-[#edf4dc] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#dceba7] text-[#5b7138]"><Zap size={18} /></div><p className="text-[13px] font-bold text-[#3c5133]">A little progress adds up.</p><p className="mt-1 text-xs leading-5 text-[#748364]">Your next study session is one good step away.</p><NavLink to="/pods" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#3f7145]">Find a study pod <Plus size={14} /></NavLink></div>
      <div className="mt-4 flex items-center gap-2 rounded-xl p-2 hover:bg-[#f0f4ef]"><button onClick={() => navigate('/profile')} className="flex min-w-0 flex-1 items-center gap-3 text-left"><Avatar initials={userInitials} color={userProfile.color} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#334338]">{userName}</span><span className="block truncate text-[11px] text-[#879188]">{appState.authUser?.email || `${userProfile.semester}rd semester · ${userProfile.branch}`}</span></span></button><button onClick={appState.logout} title="Log out" aria-label="Log out" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#89948a] hover:bg-white hover:text-[#b4483e]"><LogOut size={15} /></button></div>
    </aside>

    <div className="min-w-0 flex-1 md:ml-[238px]">
      <header className="sticky top-0 z-30 border-b border-[#e9eee8] bg-[#f7f9f5]/95 backdrop-blur-xl">
        <div className="page-wrap flex h-[68px] items-center justify-between gap-3">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5 md:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#287b53] text-[#e7f594]"><BookOpen size={19} /></span><span className="font-extrabold text-[#263b2e]">CampusSetu</span></NavLink>
          <form onSubmit={searchSubmit} className="hidden h-10 w-full max-w-[360px] items-center gap-2.5 rounded-xl border border-[#e5eae4] bg-white px-3 text-[#9aa39a] md:flex"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, subjects, resources..." className="min-w-0 flex-1 bg-transparent text-xs text-[#34443a] outline-none placeholder:text-[#a2aaa2]" /></form>
          <div className="ml-auto flex items-center gap-1.5"><button onClick={() => appState.setDarkMode((value) => !value)} title={appState.darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6e7c71] hover:bg-white">{appState.darkMode ? <Sun size={17} /> : <Moon size={17} />}</button><button onClick={() => appState.setToast({ type: 'info', message: 'You’re all caught up. Your next pod starts at 7:00 PM.' })} title="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#6e7c71] hover:bg-white"><Bell size={17} /><span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#eaa251] ring-2 ring-[#f7f9f5]" /></button><NavLink to="/profile" className="ml-1 flex items-center gap-2"><Avatar initials={userInitials} color={userProfile.color} size="sm" /><span className="hidden max-w-[150px] truncate text-xs font-bold text-[#35453a] lg:block">{userName}</span></NavLink><button onClick={() => setMobileMenu((value) => !value)} className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-[#607166] md:hidden" aria-label="Open menu">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button></div>
        </div>
        {mobileMenu && <div className="absolute left-0 right-0 top-full border-b border-[#e5eae4] bg-white px-4 py-3 shadow-lg md:hidden"><form onSubmit={searchSubmit} className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-[#e5eae4] px-3 text-[#91a096]"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CampusSetu" className="min-w-0 flex-1 outline-none" /></form><div className="grid grid-cols-2 gap-1">{[...navItems, { label: 'Profile', to: '/profile', icon: Users }].map(({ label, to, icon: Icon }) => <NavLink key={label} onClick={() => setMobileMenu(false)} to={to} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#526257] hover:bg-[#f1f5f0]"><Icon size={16} />{label}</NavLink>)}</div></div>}
      </header>
      <main className="page-wrap min-h-[calc(100vh-68px)] pb-24 pt-7 md:pb-12 md:pt-8"><Outlet context={appState} /></main>
    </div>

    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e3eae2] bg-white/95 px-2 pt-2 backdrop-blur-xl md:hidden">{mobileItems.map(({ label, to, icon: Icon }) => { const active = location.pathname === to || (to === '/pods' && location.pathname.startsWith('/pods/')) || (to === '/resources' && location.pathname.startsWith('/resources/')); return <NavLink key={label} to={to} className={`flex min-h-12 flex-col items-center gap-1 text-[10px] font-semibold ${active ? 'text-[#27764e]' : 'text-[#879188]'}`}><Icon size={19} strokeWidth={active ? 2.5 : 1.8} /><span>{label}</span></NavLink> })}</nav>
    {appState.toast && <div className={`fixed bottom-20 left-1/2 z-[90] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-6 ${appState.toast.type === 'error' ? 'bg-[#a94840]' : appState.toast.type === 'info' ? 'bg-[#375c76]' : 'bg-[#286e4a]'}`}><span className="h-2 w-2 rounded-full bg-[#d8f36a]" />{appState.toast.message}</div>}
    <style>{appState.darkMode ? '.dark-theme{filter:invert(.88) hue-rotate(155deg)}.dark-theme img,.dark-theme svg{filter:invert(1) hue-rotate(-155deg)}' : ''}</style>
  </div>
}