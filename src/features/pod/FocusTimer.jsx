import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui.jsx'
import { supabase } from '../../lib/supabaseClient.js'

const TOTAL_SECONDS = 50 * 60

async function requestTimerState(podId, action = 'get') {
  const { data, error } = await supabase.rpc('study_pod_timer', {
    p_pod_id: podId,
    p_action: action,
  })
  if (error) throw error
  const state = Array.isArray(data) ? data[0] : data
  if (!state) throw new Error('The timer state was not returned.')
  return state
}

export default function FocusTimer({ podId, onComplete }) {
  const [timerState, setTimerState] = useState(null)
  const [displayTime, setDisplayTime] = useState(() => performance.now())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const timerStateRef = useRef(null)
  const requestVersionRef = useRef(0)
  const busyRef = useRef(false)
  const completeNotifiedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let active = true
    let refreshing = false

    async function syncTimer(action = 'get') {
      if (action === 'get' && (refreshing || busyRef.current)) return
      if (action === 'get') refreshing = true
      const requestVersion = ++requestVersionRef.current
      if (action !== 'get') {
        busyRef.current = true
        setBusy(true)
      }
      try {
        const nextState = await requestTimerState(podId, action)
        if (!active || requestVersion !== requestVersionRef.current) return
        const previousState = timerStateRef.current
        const snapshot = { ...nextState, receivedAt: performance.now() }
        timerStateRef.current = snapshot
        setTimerState(snapshot)
        setDisplayTime(snapshot.receivedAt)
        setError('')
        if (snapshot.is_complete && previousState?.is_running && !completeNotifiedRef.current) {
          completeNotifiedRef.current = true
          onCompleteRef.current?.()
        } else if (!snapshot.is_complete) {
          completeNotifiedRef.current = false
        }
      } catch (requestError) {
        if (import.meta.env.DEV) console.error(`Unable to ${action} shared pod timer:`, requestError)
        if (active && requestVersion === requestVersionRef.current) {
          setError('The shared timer could not be synchronized. Retrying...')
        }
      } finally {
        if (action === 'get') refreshing = false
        if (action !== 'get' && requestVersion === requestVersionRef.current) {
          busyRef.current = false
          setBusy(false)
        }
        if (active && requestVersion === requestVersionRef.current) setLoading(false)
      }
    }

    syncTimer()
    const refreshInterval = window.setInterval(() => syncTimer(), 2000)
    const displayInterval = window.setInterval(() => setDisplayTime(performance.now()), 1000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
      window.clearInterval(displayInterval)
    }
  }, [podId])

  const serverRemaining = timerState?.remaining_seconds ?? TOTAL_SECONDS
  const elapsedSinceSync = timerState?.is_running
    ? Math.floor((displayTime - timerState.receivedAt) / 1000)
    : 0
  const remaining = Math.max(0, serverRemaining - elapsedSinceSync)
  const running = Boolean(timerState?.is_running)
  const complete = Boolean(timerState?.is_complete) || (running && remaining === 0)
  const hasStarted = Boolean(timerState?.timer_started_at)
  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
  const progress = ((TOTAL_SECONDS - remaining) / TOTAL_SECONDS) * 100

  function performAction(action) {
    if (busyRef.current || loading || !timerState) return
    const actionVersion = ++requestVersionRef.current
    busyRef.current = true
    setBusy(true)
    setError('')
    requestTimerState(podId, action).then((nextState) => {
      if (actionVersion !== requestVersionRef.current) return
      const previousState = timerStateRef.current
      const snapshot = { ...nextState, receivedAt: performance.now() }
      timerStateRef.current = snapshot
      setTimerState(snapshot)
      setDisplayTime(snapshot.receivedAt)
      if (snapshot.is_complete && previousState?.is_running && !completeNotifiedRef.current) {
        completeNotifiedRef.current = true
        onCompleteRef.current?.()
      } else if (!snapshot.is_complete) {
        completeNotifiedRef.current = false
      }
    }).catch((requestError) => {
      if (import.meta.env.DEV) console.error(`Unable to ${action} shared pod timer:`, requestError)
      if (actionVersion === requestVersionRef.current) setError('The shared timer could not be updated. Please try again.')
    }).finally(() => {
      if (actionVersion === requestVersionRef.current) {
        busyRef.current = false
        setBusy(false)
      }
    })
  }

  const primaryAction = running ? 'pause' : hasStarted ? 'resume' : 'start'
  const primaryLabel = loading
    ? 'Loading...'
    : busy
      ? 'Updating...'
      : complete
        ? 'Complete'
        : running
          ? 'Pause'
          : hasStarted
            ? 'Resume'
            : 'Start'

  return <div className="rounded-2xl bg-[#f4f7f1] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#849187]">Focus timer</p><div className="mt-1 font-mono text-[38px] font-bold tabular-nums leading-none text-[#2c4335]">{formatted}</div><p className="mt-2 text-xs text-[#849087]">{complete ? 'Sprint complete. Nice work.' : running ? 'One thing at a time.' : '50-minute focus sprint'}</p></div><div className="flex gap-2"><Button aria-label={`${primaryLabel} shared timer`} onClick={() => performAction(primaryAction)} disabled={loading || busy || complete || !timerState} variant={running ? 'dark' : 'primary'}>{running ? <Pause size={16} /> : <Play size={16} />}{primaryLabel}</Button><Button aria-label="Reset timer" onClick={() => performAction('reset')} disabled={loading || busy || !timerState || complete} variant="outline"><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></Button></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e4e9df]"><div className="h-full rounded-full bg-[#65a76e] transition-all duration-1000" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-right text-[10px] font-medium text-[#98a197]">{Math.floor((TOTAL_SECONDS - remaining) / 60)} min studied</p>{loading && <p className="mt-2 text-[11px] text-[#849087]">Syncing session...</p>}{error && <p role="alert" className="mt-2 text-xs text-[#a94840]">{error}</p>}</div>
}