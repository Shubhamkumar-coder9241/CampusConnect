import { Check, X } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-[#237a52] text-white hover:bg-[#1d6445] shadow-sm', soft: 'bg-[#eaf3e8] text-[#286849] hover:bg-[#dcebdd]',
    outline: 'border border-[#dfe7df] bg-white text-[#3a4c40] hover:border-[#b9ccbb] hover:bg-[#f9fbf8]', dark: 'bg-[#263a30] text-white hover:bg-[#1c2d24]',
    ghost: 'text-[#647269] hover:bg-[#f0f4ef]', lime: 'bg-[#d8f36a] text-[#263a30] hover:bg-[#c9e752]', danger: 'bg-[#fff0ee] text-[#b4483e] hover:bg-[#ffe3df]',
  }
  const sizes = { sm: 'h-9 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-sm' }
  return <button className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>
}

export function Card({ children, className = '', ...props }) {
  return <section className={`rounded-2xl border border-[#e8ede7] bg-white card-shadow ${className}`} {...props}>{children}</section>
}

export function Badge({ children, tone = 'green', className = '' }) {
  const tones = { green: 'bg-[#eaf4ec] text-[#31734f]', lime: 'bg-[#f3f8d8] text-[#69791e]', orange: 'bg-[#fff1e3] text-[#a9691e]', blue: 'bg-[#edf3fa] text-[#526d98]', gray: 'bg-[#f1f3f0] text-[#707a72]', red: 'bg-[#fff0ee] text-[#b4483e]', white: 'bg-white/15 text-white' }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.green} ${className}`}>{children}</span>
}

export function Avatar({ initials, color = '#d8eadb', size = 'md', online = false, className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base', xl: 'h-[76px] w-[76px] text-xl' }
  return <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-[#34463b] ring-2 ring-white ${sizes[size]} ${className}`} style={{ backgroundColor: color }}>{initials}<span className="sr-only">avatar</span>{online && <i className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#56b878]" />}</span>
}

export function ProgressBar({ value, color = 'bg-[#65ad75]', className = '' }) {
  return <div className={`h-2 overflow-hidden rounded-full bg-[#edf1eb] ${className}`}><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
}

export function SectionHeading({ title, subtitle, action, className = '' }) {
  return <div className={`mb-4 flex items-end justify-between gap-3 ${className}`}><div><h2 className="text-[17px] font-extrabold tracking-normal text-[#28392f]">{title}</h2>{subtitle && <p className="mt-1 text-sm text-[#818d83]">{subtitle}</p>}</div>{action}</div>
}

export function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <div className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#6b966f]">{eyebrow}</div>}<h1 className="text-[29px] font-extrabold leading-tight text-[#26382d] sm:text-[34px]">{title}</h1>{subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#758178]">{subtitle}</p>}</div>{action}</div>
}

export function Tabs({ items, active, onChange, className = '' }) {
  return <div className={`nav-scroll flex items-center gap-1 overflow-x-auto border-b border-[#e8ede7] ${className}`}>{items.map((item) => <button key={item} onClick={() => onChange(item)} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${active === item ? 'border-[#2b8057] text-[#286c4a]' : 'border-transparent text-[#879188] hover:text-[#34473b]'}`}>{item}</button>)}</div>
}

export function SelectField({ label, value, onChange, options, className = '' }) {
  return <label className={`flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#707b72] ${className}`}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-[#e3e9e2] bg-white px-3 text-sm font-medium text-[#39483d] outline-none focus:border-[#8eb696]">{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}

export function EmptyState({ icon: Icon, title, description }) {
  return <div className="rounded-2xl border border-dashed border-[#dfe7df] bg-white px-6 py-14 text-center"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5ed] text-[#54875d]">{Icon && <Icon size={21} />}</span><h3 className="text-base font-bold text-[#36473b]">{title}</h3><p className="mx-auto mt-1.5 max-w-sm text-sm text-[#818c83]">{description}</p></div>
}

export function Modal({ title, subtitle, onClose, children, width = 'max-w-lg' }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17251d]/45 p-4 backdrop-blur-[3px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7`} role="dialog" aria-modal="true" aria-label={title}><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold text-[#27382d]">{title}</h2>{subtitle && <p className="mt-1 text-sm text-[#7e897f]">{subtitle}</p>}</div><button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-[#77837a] hover:bg-[#f1f4f0]"><X size={18} /></button></div>{children}</div></div>
}

export function Checkmark({ checked }) {
  return <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${checked ? 'border-[#3e925d] bg-[#3e925d] text-white' : 'border-[#d7dfd6] bg-white text-transparent'}`}><Check size={13} strokeWidth={3} /></span>
}