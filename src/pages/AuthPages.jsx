import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, LoaderCircle } from 'lucide-react'
import { Button, Card } from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'

function authErrorMessage(error) {
  const message = error?.message?.toLowerCase() || ''
  if (message.includes('invalid login credentials')) return 'The email or password is incorrect.'
  if (message.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (message.includes('user already registered')) return 'An account with this email already exists.'
  if (message.includes('password should be at least')) return 'Your password must be at least 6 characters.'
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  return error?.message || 'Something went wrong. Please try again.'
}

function AuthShell({ title, subtitle, children, footer }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f9f5] px-4 py-10">
    <div className="w-full max-w-md">
      <Link to="/login" className="mx-auto mb-7 flex w-fit items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#287b53] text-[#e7f594]"><BookOpen size={22} strokeWidth={2.5} /></span>
        <span><span className="block font-extrabold leading-tight text-[#263b2e]">CampusSetu</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.09em] text-[#8b968d]">Learn together</span></span>
      </Link>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-[#26382d]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#758178]">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
      <p className="mt-5 text-center text-sm text-[#758178]">{footer}</p>
    </div>
  </main>
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, required = true }) {
  return <label className="block text-xs font-semibold text-[#5b695e]">{label}<input required={required} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className="mt-1.5 h-11 w-full rounded-xl border border-[#e0e7df] bg-white px-3 text-sm font-normal text-[#39483d] outline-none transition-colors placeholder:text-[#a1aaa2] focus:border-[#84ae8a]" /></label>
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (signInError) {
      setError(authErrorMessage(signInError))
      return
    }
    navigate('/')
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to continue your CampusSetu learning journey." footer={<>New to CampusSetu? <Link to="/signup" className="font-bold text-[#397950]">Create an account</Link></>}>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete="current-password" />
      {error && <p role="alert" className="rounded-xl bg-[#fff0ee] px-3 py-2.5 text-sm leading-5 text-[#b4483e]">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <><LoaderCircle size={16} className="animate-spin" />Signing in...</> : <>Sign in<ArrowRight size={16} /></>}</Button>
    </form>
  </AuthShell>
}

export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }
    if (password.length < 6) {
      setError('Your password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    })
    setLoading(false)
    if (signUpError) {
      setError(authErrorMessage(signUpError))
      return
    }
    if (data.session) {
      window.location.hash = '#/'
      return
    }
    setMessage('Account created. Check your email to confirm your account, then sign in.')
  }

  return <AuthShell title="Create your account" subtitle="Join students who are learning, building, and growing together." footer={<>Already have an account? <Link to="/login" className="font-bold text-[#397950]">Sign in</Link></>}>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
      <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
      <Field label="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />
      {error && <p role="alert" className="rounded-xl bg-[#fff0ee] px-3 py-2.5 text-sm leading-5 text-[#b4483e]">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-[#eaf4ec] px-3 py-2.5 text-sm leading-5 text-[#31734f]">{message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <><LoaderCircle size={16} className="animate-spin" />Creating account...</> : <>Create account<ArrowRight size={16} /></>}</Button>
    </form>
  </AuthShell>
}
