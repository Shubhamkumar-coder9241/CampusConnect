import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Flag, Headphones, LoaderCircle, Mic, MicOff, MonitorUp, Users, Video as VideoIcon, VideoOff, Wifi } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, SectionHeading } from '../../components/ui.jsx'
import FocusTimer from './FocusTimer.jsx'
import GoalChecklist from './GoalChecklist.jsx'
import PodChat from './PodChat.jsx'
import SessionSummary from './SessionSummary.jsx'

const goals = ['Revise array operations', 'Solve 2 easy problems', 'Solve 2 medium problems', 'Discuss one difficult problem', 'Write final notes']
const seedMessages = [
  { id: 'm1', name: 'Aman', initials: 'AK', color: '#9cc7b1', text: 'Has anyone solved the sliding window problem?', time: '6:54 PM' },
  { id: 'm2', name: 'Sana', initials: 'SK', color: '#c1a7dc', text: 'I’m trying it now. Start with the smallest valid window.', time: '6:56 PM' },
  { id: 'm3', name: 'Aman', initials: 'AK', color: '#9cc7b1', text: 'Let’s discuss after the sprint.', time: '6:57 PM' },
]

export default function PodRoom() {
  const { podId } = useParams()
  const navigate = useNavigate()
  const { updateRoadmapFromSession, setToast, podList, podLoading, podError, authUser } = useOutletContext()
  const pod = podList.find((item) => item.id === podId)
  const [membershipOverride, setMembershipOverride] = useState(null)
  const joined = membershipOverride?.podId === pod?.id ? membershipOverride.joined : Boolean(pod?.isMember)
  const [checked, setChecked] = useState([0])
  const [messages, setMessages] = useState(seedMessages)
  const [camera, setCamera] = useState(false)
  const [microphone, setMicrophone] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [summary, setSummary] = useState(false)
  const [finished, setFinished] = useState(false)
  const [minutesStudied, setMinutesStudied] = useState(0)
  const onTimerComplete = useCallback(() => { setMinutesStudied(pod?.duration || 50); setSummary(true); setFinished(true) }, [pod?.duration])
  const roomMembers = useMemo(() => {
    const colors = ['#9cc7b1', '#c1a7dc', '#a6c9dd', '#efc2a1']
    if (pod?.memberProfiles) return pod.memberProfiles.map((member, index) => ({
      ...member,
      color: member.color || colors[index % colors.length],
      isCurrentUser: member.id === authUser?.id,
    }))
    return (pod?.memberNames || []).map((name, index) => ({
      name,
      initials: name.split(' ').map((part) => part[0]).join(''),
      color: colors[index % colors.length],
      isCurrentUser: false,
      role: 'member',
    }))
  }, [pod, authUser?.id])

  if (!pod) return podLoading
    ? <div className="flex min-h-60 items-center justify-center gap-2 text-sm font-semibold text-[#397950]"><LoaderCircle size={18} className="animate-spin" />Loading study pod...</div>
    : <EmptyState icon={Users} title="Study pod not found" description={podError || 'This study pod is unavailable or may have been removed.'} />

  return <div className="fade-up"><Link to="/pods" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5f7d64]"><ArrowLeft size={14} />All study pods</Link><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-[#61a46b]" />LIVE STUDY POD</Badge><Badge tone="gray">{pod.duration} minute sprint</Badge></div><h1 className="text-[26px] font-extrabold text-[#293b30] sm:text-[31px]">{pod.topic}</h1><p className="mt-1.5 text-sm text-[#7d897f]">{pod.detail} <span className="mx-1 text-[#c3cbc2]">·</span> {pod.goal}</p></div><div className="flex items-center gap-2"><div className="flex -space-x-2">{roomMembers.slice(0, 4).map((member) => <Avatar key={member.name} initials={member.initials} color={member.color} online size="sm" />)}</div><span className="text-xs text-[#7a867c]">{roomMembers.length} here</span></div></div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-4"><FocusTimer key={pod.id} minutes={pod.duration} onComplete={onTimerComplete} /><Card className="p-5"><SectionHeading title="Today's focus" subtitle="Keep it small. Keep it moving." action={<Badge tone="orange"><TargetIcon />Session goal</Badge>} /><div className="mb-2 rounded-xl bg-[#f7f8f5] px-3 py-2.5 text-sm font-semibold text-[#536157]">{pod.goal}</div><GoalChecklist goals={goals} checked={checked} onToggle={(index) => setChecked((value) => value.includes(index) ? value.filter((item) => item !== index) : [...value, index])} /><div className="mt-2 flex items-center justify-between border-t border-[#edf0eb] pt-3"><span className="text-[11px] text-[#879188]">{checked.length} of {goals.length} goals complete</span><Button variant={finished ? 'soft' : 'outline'} size="sm" onClick={() => { setMinutesStudied((value) => value || 1); setSummary(true); setFinished(true) }}><Flag size={13} />{finished ? 'View summary' : 'Finish session'}</Button></div></Card>
      <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0eb] px-5 py-4"><div><h2 className="text-sm font-extrabold text-[#34453a]">Video room</h2><p className="mt-1 text-[11px] text-[#879188]">A quiet place to work side-by-side</p></div><Badge tone="gray"><Wifi size={11} />Mock integration</Badge></div><div className="grid gap-4 p-4 sm:grid-cols-[1fr_200px] sm:p-5"><div className="soft-grid flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-[#edf2ea] p-4 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#4b7955]"><Headphones size={21} /></span><p className="mt-3 text-sm font-bold text-[#46574a]">Focus room is ready</p><p className="mt-1 max-w-xs text-[10px] leading-4 text-[#849185]">Camera, microphone and screen sharing can connect here later using LiveKit or ZegoCloud.</p></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-1">{[{ label: 'Camera', active: camera, icon: camera ? VideoIcon : VideoOff, set: setCamera }, { label: 'Microphone', active: microphone, icon: microphone ? Mic : MicOff, set: setMicrophone }, { label: 'Screen share', active: sharing, icon: MonitorUp, set: setSharing }].map(({ label, active, icon: Icon, set }) => <button key={label} onClick={() => { set((value) => !value); setToast({ type: 'info', message: `${label} ${active ? 'off' : 'on'} in this mock room.` }) }} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[10px] font-semibold transition-colors sm:justify-start sm:px-3 sm:text-xs ${active ? 'border-[#9fc3a0] bg-[#edf6ec] text-[#35714d]' : 'border-[#e8ece6] text-[#737f75] hover:bg-[#f7f9f6]'}`}><Icon size={15} />{label}<span className={`ml-auto hidden h-1.5 w-1.5 rounded-full sm:block ${active ? 'bg-[#59a56a]' : 'bg-[#c9d0c8]'}`} /></button>)}</div></div></Card>
      <Card className="p-5"><SectionHeading title="In this session" subtitle="A small group, working toward the same thing." /><div className="grid gap-2 sm:grid-cols-2">{roomMembers.map((member) => <div key={member.id || member.name} className="flex items-center gap-3 rounded-xl bg-[#f7f8f5] p-3"><Avatar initials={member.initials} color={member.color} online size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#48574b]">{member.name}{member.isCurrentUser ? ' (you)' : ''}</span><span className="mt-0.5 block text-[10px] text-[#8b968d]">{member.role === 'owner' ? 'Pod host' : 'Pod member'}</span></span><span className="h-2 w-2 rounded-full bg-[#6aaf78]" /></div>)}</div></Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-[#9aa39a]">Be respectful. Share the thinking, not just the answers.</p><Button variant={joined ? 'outline' : 'soft'} size="sm" onClick={() => { setMembershipOverride({ podId: pod.id, joined: !joined }); setToast({ type: 'success', message: joined ? 'You left the study pod.' : 'You joined the study pod.' }); if (joined) navigate('/pods') }}>{joined ? 'Leave pod' : 'Join pod'}</Button></div>
    </div><Card className="overflow-hidden xl:sticky xl:top-[88px]"><PodChat messages={messages} onSend={(text) => setMessages((value) => [...value, { id: `m-${Date.now()}`, name: 'Shubham', initials: 'SP', color: '#e8b784', text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), self: true }])} /></Card></div>{summary && <SessionSummary pod={pod} checkedCount={checked.length} goalCount={goals.length} studiedMinutes={minutesStudied || 1} onClose={() => setSummary(false)} onUpdateRoadmap={updateRoadmapFromSession} />}</div>
}

function TargetIcon() { return <Check size={12} /> }