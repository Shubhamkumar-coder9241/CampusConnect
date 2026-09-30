import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui.jsx'

export default function FocusTimer({ minutes = 50, onComplete }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(() => setRemaining((value) => {
      if (value <= 1) {
        window.clearInterval(interval)
        setRunning(false)
        onComplete?.()
        return 0
      }
      setElapsed((seconds) => seconds + 1)
      return value - 1
    }), 1000)
    return () => window.clearInterval(interval)
  }, [running, onComplete])

  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
  const progress = ((minutes * 60 - remaining) / (minutes * 60)) * 100
  function reset() { setRunning(false); setRemaining(minutes * 60); setElapsed(0) }

  return <div className="rounded-2xl bg-[#f4f7f1] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#849187]">Focus timer</p><div className="mt-1 font-mono text-[38px] font-bold tabular-nums leading-none text-[#2c4335]">{formatted}</div><p className="mt-2 text-xs text-[#849087]">{running ? 'One thing at a time.' : remaining === 0 ? 'Sprint complete. Nice work.' : '50-minute focus sprint'}</p></div><div className="flex gap-2"><Button aria-label={running ? 'Pause timer' : 'Start timer'} onClick={() => remaining > 0 && setRunning((value) => !value)} variant={running ? 'dark' : 'primary'}>{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Pause' : 'Start'}</Button><Button aria-label="Reset timer" onClick={reset} variant="outline"><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></Button></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e4e9df]"><div className="h-full rounded-full bg-[#65a76e] transition-all duration-1000" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-right text-[10px] font-medium text-[#98a197]">{Math.floor(elapsed / 60)} min studied</p></div>
}