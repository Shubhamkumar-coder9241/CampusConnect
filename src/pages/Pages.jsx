import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, BookOpen, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Clock3, Code2, Compass, Download, ExternalLink, FileText, Filter, Flag, GraduationCap, Heart, Lightbulb, LoaderCircle, MapPin, MessageCircle, MoreHorizontal, Plus, Search, ShieldCheck, Sparkles, Target, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, Checkmark, EmptyState, Modal, PageHeading, ProgressBar, SectionHeading, SelectField, Tabs } from '../components/ui.jsx'
import { currentStudent, students } from '../data/students.js'
import { mentors } from '../data/mentors.js'
import { resources } from '../data/resources.js'
import { pulseItems } from '../data/pulse.js'
import { calculateMatch } from '../lib/matching.js'
import { supabase } from '../lib/supabaseClient.js'

function MatchScore({ score }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6e7] px-2.5 py-1 text-[11px] font-extrabold text-[#427744]"><span className="h-1.5 w-1.5 rounded-full bg-[#75a84f]" />{score}% match</span>
}

function PersonCard({ person, mentor = false, onConnect, onProfile, sent = false, status, connecting = false, matchProfile = currentStudent, compact = false }) {
  const connectionStatus = status || (sent ? 'Connected' : 'Connect')
  const unavailable = connectionStatus !== 'Connect'
  const match = calculateMatch(matchProfile, person)
  return <Card className={`p-4 sm:p-5 ${compact ? '' : 'flex flex-col'}`}>
    <div className="flex items-start gap-3"><Avatar initials={person.initials} color={person.color} size="lg" online /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-extrabold text-[#304136]">{person.name}</h3>{mentor && <Badge tone="orange">Senior</Badge>}</div><p className="mt-1 text-xs text-[#818c83]">{person.branch || 'Branch not set'}{person.semester !== '' && person.semester != null ? ` · Semester ${person.semester}` : ''}</p><p className="mt-1 truncate text-[11px] text-[#9aa39a]">{person.college || 'College not set'}</p></div><MatchScore score={match.score} /></div>
    <div className="mt-4 flex flex-wrap gap-1.5">{(mentor ? person.expertise : [...(person.skills || []).slice(0, 2), ...(person.subjects || []).slice(0, 2)]).map((skill) => <Badge key={skill} tone="gray">{skill}</Badge>)}</div>
    <div className="mt-4 rounded-xl bg-[#f6f8f4] px-3 py-2.5"><p className="text-[11px] leading-5 text-[#78847a]"><Sparkles size={12} className="mr-1 inline text-[#d28c37]" />{match.reasons.join(' + ')} · {person.availability || 'Availability not set'}</p></div>
    {mentor && person.experience && <div className="mt-3 flex flex-wrap gap-1.5">{person.experience.map((tag) => <Badge key={tag} tone="lime"><Award size={11} />{tag}</Badge>)}</div>}
    <div className="mt-auto flex gap-2 pt-4"><Button onClick={onConnect} disabled={connecting || unavailable} variant={unavailable ? 'soft' : 'primary'} className="flex-1">{connecting ? <><LoaderCircle size={15} className="animate-spin" />Sending...</> : unavailable ? <><Check size={15} />{mentor ? 'Request sent' : connectionStatus}</> : <>{mentor ? 'Request guidance' : 'Connect'}<ArrowRight size={14} /></>}</Button><Button onClick={onProfile} variant="outline" aria-label={`View ${person.name} profile`}><MoreHorizontal size={17} /></Button></div>
  </Card>
}

function PodCard({ pod }) {
  const navigate = useNavigate()
  const { joinStudyPod, setToast } = useOutletContext()
  const [joining, setJoining] = useState(false)
  const joined = Boolean(pod.isMember)
  async function onJoin() {
    if (joining || joined) return
    setJoining(true)
    try {
      const result = await joinStudyPod(pod.id)
      setToast({ type: result.alreadyMember ? 'info' : 'success', message: result.alreadyMember ? 'You are already a member of this study pod.' : `You joined ${pod.name}.` })
      navigate(`/pods/${pod.id}`)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Unable to join study pod:', error)
      setToast({ type: 'error', message: error.message === 'This study pod is full.' ? error.message : 'We could not join that study pod. Please try again.' })
    } finally {
      setJoining(false)
    }
  }
  return <Card className="flex flex-col p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e9] text-[#42764f]"><Code2 size={19} /></span><Badge tone={pod.status === 'Starting soon' ? 'orange' : 'green'}>{pod.status === 'Starting soon' ? '● Starting soon' : '● Open'}</Badge></div><h3 className="mt-4 text-base font-extrabold text-[#304136]">{pod.topic}</h3><p className="mt-1 text-sm text-[#78847a]">{pod.detail}</p><div className="mt-4 space-y-2 text-xs text-[#66746a]"><p className="flex items-center gap-2"><Target size={14} className="text-[#809386]" />{pod.goal}</p><p className="flex items-center gap-2"><Clock3 size={14} className="text-[#809386]" />{pod.duration} min · {pod.time}</p><p className="flex items-center gap-2"><Users size={14} className="text-[#809386]" />Hosted by {pod.host}</p></div><div className="mt-auto flex items-center justify-between border-t border-[#edf0eb] pt-4"><div className="flex -space-x-2">{pod.memberNames.slice(0, 4).map((name, i) => <Avatar key={name} initials={name.split(' ').map((part) => part[0]).join('')} size="sm" color={['#b7d1b5', '#efc2a1', '#c7b4df', '#9ec4dc'][i]} />)}<span className="ml-3 self-center text-xs text-[#828d84]">{pod.members}/{pod.maxMembers}</span></div><Button size="sm" variant={joined ? 'soft' : 'primary'} onClick={() => joined ? navigate(`/pods/${pod.id}`) : onJoin(pod)} disabled={joining || (!joined && pod.members >= pod.maxMembers)}>{joining ? <><LoaderCircle size={13} className="animate-spin" />Joining</> : joined ? 'Open room' : pod.members >= pod.maxMembers ? 'Full' : 'Join pod'}{!joining && <ArrowRight size={13} />}</Button></div></Card>
}

function ResourceCard({ resource }) {
  return <Card className="group flex min-h-[185px] flex-col p-4 transition-transform hover:-translate-y-0.5 sm:p-5"><div className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${resource.type === 'PYQ' ? 'bg-[#fff2e3] text-[#c17b2e]' : 'bg-[#edf4ec] text-[#47815a]'}`}><FileText size={19} /></span><Badge tone={resource.type === 'PYQ' ? 'orange' : resource.type === 'Syllabus' ? 'blue' : 'green'}>{resource.type}</Badge></div><h3 className="mt-4 text-[14px] font-bold leading-5 text-[#334339]">{resource.title}</h3><p className="mt-1 text-xs text-[#849087]">{resource.subject}</p><div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-[#89948a]"><span>Semester {resource.semester} · {resource.year}</span><Link to={`/resources/${resource.id}`} className="inline-flex items-center gap-1 font-bold text-[#367a52] group-hover:gap-2">Open <ArrowUpRight size={13} /></Link></div></Card>
}

function OpportunityCard({ item }) {
  const { setToast } = useOutletContext()
  const tones = { Hackathons: 'orange', Internships: 'green', Exams: 'red', Workshops: 'blue', 'My College': 'lime', 'My Branch': 'gray' }
  return <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={tones[item.category] || 'green'}>{item.category}</Badge><span className="text-xs text-[#929c92]">{item.date}</span></div><h3 className="mt-3 text-[15px] font-extrabold leading-6 text-[#304136]">{item.title}</h3><p className="mt-1 text-xs font-medium text-[#829086]">{item.org}</p><p className="mt-3 text-[13px] leading-6 text-[#68766c]">{item.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0eb] pt-3"><div className="flex flex-wrap items-center gap-2">{item.verified && <Badge tone="green"><ShieldCheck size={12} />Verified source</Badge>}<Badge tone="gray">{item.tag}</Badge></div><div className="flex items-center gap-3"><span className="text-xs font-bold text-[#8c6f43]">Deadline · {item.deadline}</span><button onClick={() => setToast({ type: 'info', message: `${item.org} is the listed source for this update.` })} className="text-xs font-bold text-[#397950]">Source</button></div></div></Card>
}

export function HomePage() {
  const { connections, setConnections, setToast, roadmap } = useOutletContext()
  const navigate = useNavigate()
  const recommendations = [students[0], students[1], mentors[0]]
  return <div className="fade-up space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-semibold text-[#709075]">Wednesday, September 30, 2026 <span className="mx-1.5 text-[#c6cdc4]">/</span> Your campus, connected</p><h1 className="text-[28px] font-extrabold leading-tight text-[#26382d] sm:text-[34px]">Good morning, Shubham <span className="text-[#d99a42]">☀</span></h1><p className="mt-2 text-sm text-[#78847a]">Keep building your learning journey.</p></div><Button onClick={() => navigate('/discover')} variant="dark"><Compass size={16} />Find your people</Button></div>

    <section className="relative overflow-hidden rounded-[24px] bg-[#236c4a] p-5 text-white sm:p-7"><div className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-1 top-9 h-40 w-40 rounded-full border border-white/10" /><div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><Badge tone="white"><span className="h-1.5 w-1.5 rounded-full bg-[#d9f36a]" />Your student snapshot</Badge><h2 className="mt-4 max-w-lg text-2xl font-extrabold leading-tight text-white sm:text-[30px]">Good things happen when you learn together.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/70">A better study partner, a helpful senior, your next big opportunity. It all starts with one connection.</p><div className="mt-5 flex flex-wrap gap-2"><Badge tone="white"><GraduationCap size={13} />CSE · Semester 3</Badge><Badge tone="white"><Target size={13} />Placement / Internship</Badge><Badge tone="white"><Clock3 size={13} />Evenings available</Badge></div></div><div className="grid grid-cols-2 gap-2.5">{[{ icon: Code2, label: 'Currently learning', value: 'Data Structures' }, { icon: MapPin, label: 'Your campus', value: 'Pune Govt. Poly.' }, { icon: Users, label: 'Learning circle', value: '3 connections' }, { icon: Target, label: 'Roadmap progress', value: `${Math.round(roadmap.reduce((total, item) => total + item.progress, 0) / roadmap.length)}% complete` }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.08] p-3.5"><Icon size={15} className="mb-2 text-[#d8f36a]" /><p className="text-[10px] text-white/60">{label}</p><p className="mt-1 text-xs font-bold text-white sm:text-sm">{value}</p></div>)}</div></div></section>
    <section className="relative overflow-hidden rounded-[24px] bg-[#236c4a] p-5 text-white sm:p-7"><div className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-1 top-9 h-40 w-40 rounded-full border border-white/10" /><div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><Badge tone="white"><span className="h-1.5 w-1.5 rounded-full bg-[#d9f36a]" />Your student snapshot</Badge><h2 className="mt-4 max-w-lg text-2xl font-extrabold leading-tight text-white sm:text-[30px]">Good things happen when you learn together.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/70">A better study partner, a helpful senior, your next big opportunity. It all starts with one connection.</p><div className="mt-5 flex flex-wrap gap-2"><Badge tone="white"><GraduationCap size={13} />CSE · Semester 3</Badge><Badge tone="white"><Target size={13} />Placement / Internship</Badge><Badge tone="white"><Clock3 size={13} />Evenings available</Badge></div></div><div className="grid grid-cols-2 gap-2.5">{[{ icon: Code2, label: 'Currently learning', value: 'Data Structures' }, { icon: MapPin, label: 'Your campus', value: 'Pune Govt. Poly.' }, { icon: Users, label: 'Learning circle', value: '3 connections' }, { icon: Target, label: 'Roadmap progress', value: `${Math.ceil(roadmap.reduce((total, item) => total + item.progress, 0) / roadmap.length)}% complete` }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.08] p-3.5"><Icon size={15} className="mb-2 text-[#d8f36a]" /><p className="text-[10px] text-white/60">{label}</p><p className="mt-1 text-xs font-bold text-white sm:text-sm">{value}</p></div>)}</div></div></section>

    <section><SectionHeading title="Your growth loop" subtitle="One connected journey, one good next step." /><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{[{ n: '01', label: 'Your profile', icon: GraduationCap, to: '/profile' }, { n: '02', label: 'Find your people', icon: Users, to: '/discover' }, { n: '03', label: 'Study together', icon: MessageCircle, to: '/pods' }, { n: '04', label: 'Learn & practice', icon: BookOpen, to: '/resources' }, { n: '05', label: 'Find opportunity', icon: BriefcaseBusiness, to: '/pulse' }, { n: '06', label: 'Track progress', icon: MapPin, to: '/roadmap' }].map(({ n, label, icon: Icon, to }, index) => <Link to={to} key={label} className="group relative flex min-h-[88px] flex-col justify-between rounded-2xl border border-[#e6ebe4] bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#a9c8aa] hover:shadow-md sm:p-4"><div className="flex items-center justify-between"><Icon size={17} className={index === 2 ? 'text-[#cf8b3d]' : 'text-[#4f865e]'} /><span className="text-[10px] font-bold text-[#b1bbb2]">{n}</span></div><p className="text-xs font-bold text-[#435347]">{label}</p>{index < 5 && <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[#f4f7f3] p-0.5 text-[#b8c2b7] lg:block"><ArrowRight size={13} /></span>}</Link>)}</div></section>

    <div className="grid gap-7 xl:grid-cols-[1.45fr_.85fr]"><section><SectionHeading title="People worth meeting" subtitle="Good company makes the hard parts easier." action={<Link to="/discover" className="text-xs font-bold text-[#397950]">See everyone <ArrowRight size={13} className="ml-1 inline" /></Link>} /><div className="grid gap-3 md:grid-cols-2">{recommendations.slice(0, 2).map((person) => <PersonCard key={person.id} person={person} sent={Boolean(connections[person.id])} onConnect={() => { setConnections((value) => ({ ...value, [person.id]: true })); setToast({ type: 'success', message: `You’re connected with ${person.name}.` }) }} onProfile={() => navigate('/discover')} />)}</div><Link to="/mentors" className="mt-3 flex items-center justify-between rounded-2xl border border-[#eadfca] bg-[#fffaf0] p-4"><div className="flex items-center gap-3"><Avatar initials={mentors[0].initials} color={mentors[0].color} size="md" /><span><span className="block text-xs font-bold text-[#5b4b35]">Meet Sana, CSE ’26</span><span className="mt-1 block text-[11px] text-[#887961]">Placed at Persistent · mentors in DSA</span></span></div><ArrowUpRight size={17} className="text-[#a67a43]" /></Link></section>
      <div className="space-y-5"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-4"><div><Badge tone="orange">UP NEXT</Badge><h3 className="mt-2 text-[15px] font-extrabold text-[#314137]">DSA Problem Solving Sprint</h3></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff2e3] text-[#be813e]"><Clock3 size={19} /></span></div><div className="px-5 py-4"><p className="text-xs text-[#7c897e]">Arrays & linked lists · solve 5 problems together</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#879188]"><span><CalendarDays size={13} className="mr-1 inline" />Today · 7:00 PM</span><span><Users size={13} className="mr-1 inline" />3 members</span><span><Clock3 size={13} className="mr-1 inline" />50 min</span></div><Button onClick={() => navigate('/pods/dsa-sprint')} className="mt-4 w-full">Enter study pod <ArrowRight size={15} /></Button></div></Card>
        <Card className="bg-[#fffdf8] p-5"><div className="flex items-start justify-between"><div><Badge tone="orange">FRESH OPPORTUNITY</Badge><h3 className="mt-3 text-sm font-extrabold text-[#344239]">Inter-Polytechnic Hackathon 2026</h3></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0df] text-[#c38037]"><Lightbulb size={18} /></span></div><p className="mt-2 text-xs text-[#7f887f]">Team up with 2–4 diploma students. Entries close October 18.</p><div className="mt-3 flex items-center justify-between"><Badge><ShieldCheck size={12} />Verified source</Badge><Link to="/pulse" className="text-xs font-bold text-[#a06b31]">View details <ArrowRight size={13} className="ml-1 inline" /></Link></div></Card></div></div>

    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><Card className="p-5 sm:p-6"><SectionHeading title="Keep your momentum" subtitle="You’re further along than you think." action={<Link to="/roadmap" className="text-xs font-bold text-[#397950]">Full roadmap <ArrowRight size={13} className="ml-1 inline" /></Link>} /><div className="mt-4 space-y-4">{roadmap.slice(0, 5).map((step, index) => <div key={step.id} className="grid grid-cols-[22px_1fr_34px] items-center gap-2"><span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full ${step.progress === 100 ? 'bg-[#5aa271] text-white' : index === 3 ? 'border-2 border-[#5aa271] bg-white text-[#397950]' : 'bg-[#f0f2ed] text-[#9aa39a]'}`}>{step.progress === 100 ? <Check size={12} /> : <span className="text-[9px] font-bold">{index + 1}</span>}</span><div className="min-w-0"><div className="mb-1.5 flex justify-between gap-2"><span className="text-xs font-bold text-[#4d5c50]">{step.name}</span><span className="text-[10px] text-[#8c978d]">{step.progress === 100 ? 'Done' : step.progress ? `${step.progress}%` : 'Next up'}</span></div><ProgressBar value={step.progress} /></div><span className="text-[10px] text-[#a1aaa1]">{step.progress ? `${step.progress}%` : ''}</span></div>)}</div></Card><section><SectionHeading title="A good next step" subtitle="Pick up where you left off." /><div className="grid gap-3"><Link to="/resources/ds-2025" className="group flex items-center gap-3 rounded-2xl border border-[#e6ebe4] bg-white p-4 hover:border-[#b6cdb6]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1e3] text-[#bd7d37]"><FileText size={18} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#415146]">Data Structures — End Semester PYQ</span><span className="mt-1 block text-[11px] text-[#8b968c]">MSBTE · Summer 2025</span></span><ArrowUpRight size={16} className="text-[#9baa9c] group-hover:text-[#3f7953]" /></Link><Link to="/pulse" className="group flex items-center gap-3 rounded-2xl border border-[#e6ebe4] bg-white p-4 hover:border-[#b6cdb6]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ec] text-[#47815a]"><BriefcaseBusiness size={18} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#415146]">Internships for diploma students</span><span className="mt-1 block text-[11px] text-[#8b968c]">2 opportunities closing soon</span></span><ArrowUpRight size={16} className="text-[#9baa9c] group-hover:text-[#3f7953]" /></Link></div><div className="mt-4 flex flex-wrap gap-2">{[{ label: 'Find a study partner', to: '/discover', icon: Users }, { label: 'Ask a senior', to: '/mentors', icon: MessageCircle }, { label: 'Explore PYQs', to: '/resources', icon: BookOpen }, { label: 'Join a study pod', to: '/pods', icon: Compass }].map(({ label, to, icon: Icon }) => <Button key={label} onClick={() => navigate(to)} variant="outline" size="sm"><Icon size={14} />{label}</Button>)}</div></section></div>
  </div>
}

export function DiscoverPage() {
  const { setConnections, setToast, authUser, profile } = useOutletContext()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.toLowerCase() || ''
  const [tab, setTab] = useState('Study Partner')
  const [filters, setFilters] = useState({ Branch: 'Any branch', Semester: 'Any semester', Skill: 'Any skill', Subject: 'Any subject', Goal: 'Any goal', Availability: 'Any time' })
  const [students, setStudents] = useState([])
  const [connectionStatuses, setConnectionStatuses] = useState({})
  const [matchSkills, setMatchSkills] = useState([])
  const [matchSubjects, setMatchSubjects] = useState([])
  const [matchProfileFields, setMatchProfileFields] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [connectingId, setConnectingId] = useState(null)
  const tabs = ['Study Partner', 'Senior Mentor', 'Project Partner', 'Communities']
  useEffect(() => {
    let active = true
    async function loadDiscoverData() {
      setLoading(true)
      setLoadError('')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) throw new Error('Please sign in again to find students.')
        const { data: rows, error: profilesError } = await supabase.from('profiles')
          .select('id, name, college, branch, semester, career_goal, interests, preferred_study_time, avatar_url')
          
        if (profilesError) throw profilesError
        const allProfiles = rows || []
        const profileRows = allProfiles.filter((row) => row.id !== user.id)
        const profileIds = profileRows.map((row) => row.id)
        const relationUserIds = [...profileIds, user.id]
        const [skillsResult, subjectsResult, userSkillsResult, userSubjectsResult, connectionsResult] = await Promise.all([
          supabase.from('skills').select('id, name'),
          supabase.from('subjects').select('id, name'),
          supabase.from('user_skills').select('user_id, skill_id').in('user_id', relationUserIds),
          supabase.from('user_subjects').select('user_id, subject_id').in('user_id', relationUserIds),
          supabase.from('connections').select('student_a, student_b, status').or(`student_a.eq.${user.id},student_b.eq.${user.id}`),
        ])
        const queryError = skillsResult.error || subjectsResult.error || userSkillsResult.error || userSubjectsResult.error || connectionsResult.error
        if (queryError) throw queryError
        const skillNames = new Map((skillsResult.data || []).map((skill) => [skill.id, skill.name]))
        const subjectNames = new Map((subjectsResult.data || []).map((subject) => [subject.id, subject.name]))
        const userSkills = new Map()
        const userSubjects = new Map()
        for (const relation of userSkillsResult.data || []) {
          if (!userSkills.has(relation.user_id)) userSkills.set(relation.user_id, [])
          const name = skillNames.get(relation.skill_id)
          if (name) userSkills.get(relation.user_id).push(name)
        }
        for (const relation of userSubjectsResult.data || []) {
          if (!userSubjects.has(relation.user_id)) userSubjects.set(relation.user_id, [])
          const name = subjectNames.get(relation.subject_id)
          if (name) userSubjects.get(relation.user_id).push(name)
        }
        const colors = ['#9cc7b1', '#edb2a0', '#a9b9df', '#dfc088', '#a6c9dd', '#c1a7dc']
        const people = profileRows.map((row) => ({
          id: row.id,
          name: row.name || '',
          initials: (row.name || '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''),
          color: colors[[...row.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length],
          college: row.college || '',
          branch: row.branch || '',
          semester: row.semester ?? '',
          goal: row.career_goal || '',
          interests: Array.isArray(row.interests) ? row.interests : [],
          availability: row.preferred_study_time || '',
          avatar_url: row.avatar_url || null,
          skills: userSkills.get(row.id) || [],
          subjects: userSubjects.get(row.id) || [],
        }))
        const ownProfile = allProfiles.find((row) => row.id === user.id)
        const statuses = {}
        for (const connection of connectionsResult.data || []) {
          const personId = connection.student_a === user.id ? connection.student_b : connection.student_b === user.id ? connection.student_a : null
          if (!personId) continue
          const status = ['accepted', 'connected'].includes(String(connection.status).toLowerCase()) ? 'Connected' : 'Pending'
          if (status === 'Connected' || !statuses[personId]) statuses[personId] = status
        }
        if (active) {
          setStudents(people)
          setConnectionStatuses(statuses)
          setMatchSkills(userSkills.get(user.id) || [])
          setMatchSubjects(userSubjects.get(user.id) || [])
          setMatchProfileFields({
            goal: ownProfile?.career_goal || '',
            semester: ownProfile?.semester ?? '',
            availability: ownProfile?.preferred_study_time || '',
            interests: Array.isArray(ownProfile?.interests) ? ownProfile.interests : [],
          })
          setLoading(false)
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Unable to load Discover data:', error)
        if (active) {
          setLoadError('We could not load students right now. Please try again in a moment.')
          setLoading(false)
        }
      }
    }
    loadDiscoverData()
    return () => { active = false }
  }, [authUser?.id])

  async function sendConnection(person) {
    if (!person?.id || person.id === authUser?.id) {
      setToast({ type: 'error', message: 'You cannot connect with your own profile.' })
      return
    }
    setConnectingId(person.id)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError || new Error('Your session expired. Please sign in again.')
      if (user.id === person.id) throw new Error('You cannot connect with your own profile.')
      const pairFilter = `and(student_a.eq.${user.id},student_b.eq.${person.id}),and(student_a.eq.${person.id},student_b.eq.${user.id})`
      const { data: existing, error: existingError } = await supabase.from('connections')
        .select('student_a, student_b, status').or(pairFilter).limit(1).maybeSingle()
      if (existingError) throw existingError
      if (existing) {
        const status = ['accepted', 'connected'].includes(String(existing.status).toLowerCase()) ? 'Connected' : 'Pending'
        setConnectionStatuses((current) => ({ ...current, [person.id]: status }))
        setToast({ type: 'info', message: status === 'Connected' ? `You’re already connected with ${person.name}.` : `A connection request with ${person.name} already exists.` })
        return
      }
      const { error: insertError } = await supabase.from('connections').insert({ student_a: user.id, student_b: person.id, status: 'pending' })
      if (insertError) throw insertError
      setConnectionStatuses((current) => ({ ...current, [person.id]: 'Pending' }))
      setConnections((current) => ({ ...current, [person.id]: true }))
      setToast({ type: 'success', message: `Connection request sent to ${person.name}.` })
    } catch (error) {
      if (import.meta.env.DEV) console.error('Unable to create connection request:', error)
      setToast({ type: 'error', message: 'We could not send that request. Please try again.' })
    } finally {
      setConnectingId(null)
    }
  }

  const candidates = tab === 'Senior Mentor' ? mentors : students
  const filtered = candidates.filter((person) => (filters.Branch === 'Any branch' || person.branch === filters.Branch) && (filters.Semester === 'Any semester' || String(person.semester) === filters.Semester) && (filters.Skill === 'Any skill' || [...(person.skills || []), ...(person.expertise || [])].includes(filters.Skill)) && (filters.Subject === 'Any subject' || [...(person.subjects || []), ...(person.expertise || [])].includes(filters.Subject)) && (filters.Goal === 'Any goal' || person.goal === filters.Goal || person.expertise?.includes(filters.Goal)) && (filters.Availability === 'Any time' || person.availability === filters.Availability) && (!query || `${person.name} ${person.branch} ${person.skills?.join(' ')} ${person.subjects?.join(' ')} ${person.goal || ''}`.toLowerCase().includes(query)))
  const skills = [...new Set(candidates.flatMap((person) => [...(person.skills || []), ...(person.expertise || [])]))]
  const subjects = [...new Set(candidates.flatMap((person) => [...(person.subjects || []), ...(person.expertise || [])]))]
  const filterOptions = tab === 'Senior Mentor' ? {
    Branch: [...new Set(candidates.map((person) => person.branch).filter(Boolean))],
    Semester: [...new Set(candidates.map((person) => String(person.semester)).filter(Boolean))].sort(),
    Goal: [...new Set(candidates.flatMap((person) => person.expertise || []))],
    Availability: [...new Set(candidates.map((person) => person.availability).filter(Boolean))],
  } : {
    Branch: [...new Set(candidates.map((person) => person.branch).filter(Boolean))],
    Semester: [...new Set(candidates.map((person) => String(person.semester)).filter(Boolean))].sort(),
    Goal: [...new Set(candidates.map((person) => person.goal).filter(Boolean))],
    Availability: [...new Set(candidates.map((person) => person.availability).filter(Boolean))],
  }
  const matchProfile = { ...profile, ...matchProfileFields, skills: matchSkills, subjects: matchSubjects }
  return <div className="fade-up"><PageHeading eyebrow="Find your circle" title="Find the right people" subtitle="Connect with students and seniors who match your learning goals." action={<Badge tone="lime"><Sparkles size={13} />Matched for you</Badge>} /><Tabs items={tabs} active={tab} onChange={setTab} className="mb-5" />
    <Card className="mb-5 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#59675d]"><Filter size={14} />Refine your matches <button onClick={() => setFilters({ Branch: 'Any branch', Semester: 'Any semester', Skill: 'Any skill', Subject: 'Any subject', Goal: 'Any goal', Availability: 'Any time' })} className="ml-auto text-[11px] font-semibold text-[#47815a]">Reset filters</button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[['Branch', ['Any branch', ...filterOptions.Branch]], ['Semester', ['Any semester', ...filterOptions.Semester]], ['Skill', ['Any skill', ...skills]], ['Subject', ['Any subject', ...subjects]], ['Goal', ['Any goal', ...filterOptions.Goal]], ['Availability', ['Any time', ...filterOptions.Availability]]].map(([label, options]) => <SelectField key={label} label={label} value={filters[label]} options={[...new Set(options)]} onChange={(value) => setFilters((current) => ({ ...current, [label]: value }))} />)}</div></Card>
    {tab === 'Communities' ? <div className="grid gap-4 md:grid-cols-2">{[{ name: 'Pune DSA Circle', subject: 'Data Structures · all CSE semesters', count: '38 learners', icon: Code2 }, { name: 'Build in Public: Poly Edition', subject: 'Projects · portfolio · feedback', count: '24 learners', icon: Lightbulb }, { name: 'MSBTE Exam Study Group', subject: 'PYQs · revision sessions', count: '61 learners', icon: BookOpen }, { name: 'Women in Tech — Pune Poly', subject: 'Peer support · career starts', count: '19 learners', icon: Heart }].map(({ name, subject, count, icon: Icon }) => <Card key={name} className="flex items-center gap-4 p-5"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ec] text-[#438056]"><Icon size={20} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-[#35453a]">{name}</h3><p className="mt-1 text-xs text-[#838f85]">{subject}</p><p className="mt-2 text-[11px] font-semibold text-[#628069]">{count}</p></div><Button variant="soft" size="sm" onClick={() => setToast({ type: 'success', message: `You joined ${name}.` })}>Join</Button></Card>)}</div> : loadError && tab !== 'Senior Mentor' ? <EmptyState icon={Users} title="Students are unavailable right now" description={loadError} /> : loading && tab !== 'Senior Mentor' ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e8ede7] bg-white px-6 py-14 text-sm font-semibold text-[#397950]"><LoaderCircle size={18} className="animate-spin" />Finding students...</div> : filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((person) => <PersonCard key={person.id} person={person} mentor={tab === 'Senior Mentor'} status={tab === 'Senior Mentor' ? undefined : connectionStatuses[person.id] || 'Connect'} connecting={connectingId === person.id} matchProfile={matchProfile} onConnect={tab === 'Senior Mentor' ? () => { setConnections((value) => ({ ...value, [person.id]: true })); setToast({ type: 'success', message: `Guidance requested from ${person.name}.` }) } : () => sendConnection(person)} onProfile={() => setToast({ type: 'info', message: `${person.name} · ${person.branch} · ${person.college}` })} />)}</div> : <EmptyState icon={Users} title="No one fits those filters just yet" description="Try broadening a filter to find more learning partners." />}
  </div>
}

const guidanceTopics = ['Placement', 'Internship', 'Project', 'Programming', 'Higher Studies', 'Exam Preparation']

function expertiseFromProfile(profile, skills, subjects) {
  const goal = String(profile.career_goal || '').toLowerCase()
  const interests = (Array.isArray(profile.interests) ? profile.interests : []).join(' ').toLowerCase()
  const skillText = skills.join(' ').toLowerCase()
  const subjectText = subjects.join(' ').toLowerCase()
  const text = `${goal} ${interests} ${skillText} ${subjectText}`
  const relevance = {
    Placement: /placement|interview|resume|aptitude|career|job|dsa|problem.solving/.test(text),
    Internship: /internship|intern/.test(text),
    Project: /project|portfolio|build|github|hackathon/.test(text),
    Programming: skills.length > 0 || /programming|coding|software|developer/.test(text),
    'Higher Studies': /higher.stud|university|degree|entrance|mht.cet/.test(text),
    'Exam Preparation': subjects.length > 0 || /exam|preparation|syllabus|pyq/.test(text),
  }
  return guidanceTopics.filter((value) => relevance[value])
}

export function MentorsPage() {
  const { authUser, profile, setToast } = useOutletContext()
  const [topic, setTopic] = useState('Placement')
  const [selected, setSelected] = useState(null)
  const [requestTopic, setRequestTopic] = useState(topic)
  const [mentorProfiles, setMentorProfiles] = useState([])
  const [mentorRequests, setMentorRequests] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sending, setSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const matching = mentorProfiles.filter((mentor) => mentor.expertise.includes(topic))

  useEffect(() => {
    let active = true
    async function loadMentorRequests() {
      setLoading(true)
      setLoadError('')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) throw new Error('Please sign in again to view mentor requests.')
        const [profilesResult, skillsResult, subjectsResult, requestsResult] = await Promise.all([
          supabase.from('profiles').select('id, name, college, branch, semester, career_goal, interests, preferred_study_time, avatar_url').neq('id', user.id),
          supabase.from('skills').select('id, name'),
          supabase.from('subjects').select('id, name'),
          supabase.from('mentor_requests').select('mentor_id, topic, status, created_at').eq('student_id', user.id).order('created_at', { ascending: false }),
        ])
        if (profilesResult.error) throw profilesResult.error
        if (skillsResult.error) throw skillsResult.error
        if (subjectsResult.error) throw subjectsResult.error
        if (requestsResult.error) throw requestsResult.error
        const candidateRows = (profilesResult.data || []).filter((row) => Number(row.semester) > Number(profile.semester))
        const candidateIds = candidateRows.map((row) => row.id)
        const [userSkillsResult, userSubjectsResult] = candidateIds.length ? await Promise.all([
          supabase.from('user_skills').select('user_id, skill_id').in('user_id', candidateIds),
          supabase.from('user_subjects').select('user_id, subject_id').in('user_id', candidateIds),
        ]) : [{ data: [], error: null }, { data: [], error: null }]
        if (userSkillsResult.error) throw userSkillsResult.error
        if (userSubjectsResult.error) throw userSubjectsResult.error
        const skillNames = new Map((skillsResult.data || []).map((item) => [item.id, item.name]))
        const subjectNames = new Map((subjectsResult.data || []).map((item) => [item.id, item.name]))
        const skillsByUser = new Map()
        const subjectsByUser = new Map()
        for (const row of userSkillsResult.data || []) {
          const name = skillNames.get(row.skill_id)
          if (name) skillsByUser.set(row.user_id, [...(skillsByUser.get(row.user_id) || []), name])
        }
        for (const row of userSubjectsResult.data || []) {
          const name = subjectNames.get(row.subject_id)
          if (name) subjectsByUser.set(row.user_id, [...(subjectsByUser.get(row.user_id) || []), name])
        }
        const colors = ['#9cc7b1', '#edb2a0', '#a9b9df', '#dfc088', '#a6c9dd', '#c1a7dc']
        const profiles = candidateRows.map((row) => {
          const skills = skillsByUser.get(row.id) || []
          const subjects = subjectsByUser.get(row.id) || []
          return {
            id: row.id,
            name: row.name || '',
            initials: (row.name || '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''),
            color: colors[[...row.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length],
            college: row.college || '',
            branch: row.branch || '',
            semester: row.semester,
            goal: row.career_goal || '',
            interests: Array.isArray(row.interests) ? row.interests : [],
            availability: row.preferred_study_time || '',
            avatar_url: row.avatar_url || null,
            skills,
            subjects,
            expertise: expertiseFromProfile(row, skills, subjects),
            experience: [],
          }
        })
        const requestsByMentor = {}
        for (const request of requestsResult.data || []) {
          if (!requestsByMentor[request.mentor_id]) {
            requestsByMentor[request.mentor_id] = { topic: request.topic, status: request.status }
          }
        }
        if (active) {
          setMentorProfiles(profiles)
          setMentorRequests(requestsByMentor)
          setLoading(false)
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Unable to load mentor requests:', error)
        if (active) {
          setLoadError('We could not load mentor requests right now. Please try again in a moment.')
          setLoading(false)
        }
      }
    }
    loadMentorRequests()
    return () => { active = false }
  }, [authUser?.id, profile.semester])

  function sendRequest(event) {
    event.preventDefault()
    if (!selected?.id) {
      setRequestError('This senior is not available for requests right now.')
      return
    }
    const mentorId = selected.id
    setSending(true)
    setRequestError('')
    async function saveRequest() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw authError || new Error('Your session expired. Please sign in again.')
        if (user.id === mentorId) throw new Error('You cannot request guidance from your own profile.')
        const { data: existing, error: existingError } = await supabase.from('mentor_requests')
          .select('topic, status').eq('student_id', user.id).eq('mentor_id', mentorId).eq('status', 'pending').limit(1).maybeSingle()
        if (existingError) throw existingError
        if (existing) {
          setMentorRequests((current) => ({ ...current, [selected.id]: { topic: existing.topic, status: existing.status } }))
          setToast({ type: 'info', message: `A request to ${selected.name} is already pending.` })
          setSelected(null)
          return
        }
        const { error: insertError } = await supabase.from('mentor_requests').insert({
          student_id: user.id,
          mentor_id: mentorId,
          topic: requestTopic,
          status: 'pending',
        })
        if (insertError) throw insertError
        setMentorRequests((current) => ({ ...current, [selected.id]: { status: 'pending', topic: requestTopic } }))
        setToast({ type: 'success', message: `Guidance request sent to ${selected.name}.` })
        setSelected(null)
      } catch (error) {
        if (import.meta.env.DEV) console.error('Unable to send mentor request:', error)
        setRequestError('We could not send your request. Please try again.')
      } finally {
        setSending(false)
      }
    }
    saveRequest()
  }
  if (loadError) return <div className="fade-up"><PageHeading eyebrow="Learn from experience" title="Ask a Senior" subtitle="Get practical guidance from students who have already been through it." /><EmptyState icon={Users} title="Mentor requests are unavailable" description={loadError} /></div>
  return <div className="fade-up"><PageHeading eyebrow="Learn from experience" title="Ask a Senior" subtitle="Get practical guidance from students who have already been through it." /><div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{guidanceTopics.map((value, index) => { const Icon = [BriefcaseBusiness, Compass, Lightbulb, Code2, GraduationCap, BookOpen][index]; return <button key={value} onClick={() => setTopic(value)} className={`flex min-h-[85px] flex-col justify-between rounded-2xl border p-3 text-left transition-colors ${topic === value ? 'border-[#74a581] bg-[#edf5eb]' : 'border-[#e7ece5] bg-white hover:border-[#c5d5c5]'}`}><Icon size={17} className={topic === value ? 'text-[#35764d]' : 'text-[#88958b]'} /><span className={`text-xs font-bold ${topic === value ? 'text-[#326c48]' : 'text-[#5c695f]'}`}>{value}</span></button> })}</div><SectionHeading title={`${topic} mentors`} subtitle={`${matching.length} seniors with relevant experience`} />{loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e8ede7] bg-white px-6 py-14 text-sm font-semibold text-[#397950]"><LoaderCircle size={18} className="animate-spin" />Loading mentor requests...</div> : matching.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{matching.map((mentor) => {
    const request = mentorRequests[mentor.id]
    const mentorId = mentor.id
    const isSelf = Boolean(authUser?.id && mentor.id === authUser.id)
    const requestStatus = request?.status?.toLowerCase()
    const statusLabel = requestStatus ? requestStatus[0].toUpperCase() + requestStatus.slice(1) : ''
    return <Card key={mentor.id} className="flex flex-col p-5"><div className="flex items-start gap-3"><Avatar initials={mentor.initials} color={mentor.color} size="lg" online /><div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold text-[#34443a]">{mentor.name}</h3><p className="mt-1 text-xs text-[#808c82]">{mentor.branch} · Semester {mentor.semester}</p><p className="mt-1 text-[11px] text-[#96a097]">{mentor.college}</p></div><MatchScore score={calculateMatch(profile, mentor).score} /></div><div className="mt-4 flex flex-wrap gap-1.5">{mentor.skills.map((skill) => <Badge key={skill} tone="gray">{skill}</Badge>)}</div><div className="mt-3 space-y-1">{mentor.experience.slice(0, 2).map((item) => <p key={item} className="text-[11px] text-[#6e7c71]"><Award size={12} className="mr-1.5 inline text-[#b88848]" />{item}</p>)}</div>{request ? <div className="mt-auto pt-4"><div className="mb-3 flex items-center justify-between rounded-xl bg-[#f6f7f2] p-3"><span><span className="block text-xs font-bold text-[#4a594e]">{request.topic} guidance</span><span className="mt-1 block text-[11px] text-[#919a91]">Request · {statusLabel}</span></span><Badge tone={requestStatus === 'accepted' ? 'green' : requestStatus === 'rejected' ? 'red' : 'orange'}>{statusLabel}</Badge></div>{requestStatus === 'accepted' ? <Link to="/pods/dsa-sprint"><Button className="w-full">Start a study pod <ArrowRight size={15} /></Button></Link> : requestStatus === 'rejected' ? <Button variant="outline" className="w-full" disabled={!mentorId || isSelf} onClick={() => { setSelected(mentor); setRequestTopic(topic); setRequestError('') }}>Request again</Button> : null}</div> : <Button className="mt-auto mt-4 w-full" disabled={!mentorId || isSelf} title={!mentorId ? 'This senior profile is not available for requests yet.' : isSelf ? 'You cannot request guidance from your own profile.' : undefined} onClick={() => { setSelected(mentor); setRequestTopic(topic); setRequestError('') }}>Request guidance <MessageCircle size={15} /></Button>}</Card>
  })}</div> : <EmptyState icon={Users} title="No mentors for this topic yet" description="Choose another guidance topic to see available seniors." />}{selected && <Modal title={`Ask ${selected.name}`} subtitle="Choose a topic for your guidance request." onClose={() => { if (!sending) setSelected(null) }}><form onSubmit={sendRequest} className="space-y-4"><SelectField label="Guidance topic" value={requestTopic} options={selected.expertise} onChange={setRequestTopic} />{requestError && <p role="alert" className="rounded-xl bg-[#fff0ee] px-3 py-2.5 text-sm leading-5 text-[#b4483e]">{requestError}</p>}<div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" disabled={sending} onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" disabled={sending}>{sending ? <><LoaderCircle size={15} className="animate-spin" />Sending...</> : <>Send request <ArrowRight size={14} /></>}</Button></div></form></Modal>}</div>
}

export function PodsPage() {
  const { podList, setToast, podLoading, podError, createStudyPod } =
    useOutletContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("50");
  const [saving, setSaving] = useState(false);
  const visible = podList.filter(
    (pod) =>
      `${pod.topic} ${pod.detail}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (level === "All levels" || pod.level === level),
  );
  const runningPods = visible.filter(
    (pod) => String(pod.status).toLowerCase() === "running",
  );
  const upcomingPods = visible.filter(
    (pod) => String(pod.status).toLowerCase() !== "running",
  );
  function createPod(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    async function save() {
      try {
        const created = await createStudyPod({
          name: title.trim(),
          topic: title.trim(),
          goal: goal.trim(),
          description: "",
          maxMembers: 6,
          duration: Number(duration),
        });
        setCreating(false);
        setTitle("");
        setGoal("");
        setToast({
          type: "success",
          message: `${created.name} is ready. You are the pod host.`,
        });
        navigate(`/pods/${created.id}`);
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("Unable to create study pod:", error);
        setToast({
          type: "error",
          message: "We could not create the study pod. Please try again.",
        });
      } finally {
        setSaving(false);
      }
    }
    save();
  }
  return (
    <div className="fade-up">
      <PageHeading
        eyebrow="Better together"
        title="Study Pods"
        subtitle="Small, focused study sessions with students who are working toward the same thing."
        action={
          <Button onClick={() => setCreating(true)} disabled={saving}>
            <Plus size={15} />
            Create a pod
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#e3e9e2] bg-white px-3 text-[#909b91]">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics and subjects"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#39483d] outline-none"
          />
        </label>
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="h-10 rounded-xl border border-[#e3e9e2] bg-white px-3 text-sm text-[#536056]"
        >
          <option>All levels</option>
          <option>Intermediate</option>
          <option>Beginner friendly</option>
        </select>
      </div>
      {podLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#e8ede7] bg-white p-3 text-xs font-semibold text-[#397950]">
          <LoaderCircle size={15} className="animate-spin" />
          Loading study pods...
        </div>
      )}
      {podError && (
        <div role="alert" className="mb-4 rounded-xl border border-[#f0d9d6] bg-[#fff7f6] p-3 text-sm text-[#9f5148]">
          We couldn’t refresh study pods. You can still create a pod; try reloading to view existing pods.
        </div>
      )}
      <section className="mb-7">
        <SectionHeading title="Running Study Pods" subtitle="Sessions in progress." />
        {!podLoading && !podError && (runningPods.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {runningPods.map((pod) => <PodCard key={pod.id} pod={pod} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#dfe7df] bg-white px-4 py-5 text-sm text-[#818c83]">
            No study pods are running right now.
          </p>
        ))}
      </section>
      <section>
        <SectionHeading title="Upcoming Study Pods" subtitle="Open sessions to join." />
        {!podLoading && !podError && (upcomingPods.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingPods.map((pod) => <PodCard key={pod.id} pod={pod} />)}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={query ? 'No upcoming pods match your search' : 'No upcoming study pods yet'}
            description={query ? 'Try another topic or clear your search.' : 'Create a pod to start a focused study session.'}
          />
        ))}
      </section>
      {creating && (
        <Modal
          title="Create a study pod"
          subtitle="Pick a focused goal and invite classmates to learn alongside you."
          onClose={() => { if (!saving) setCreating(false) }}
        >
          <form onSubmit={createPod} className="space-y-4">
            <label className="block text-xs font-semibold text-[#59675d]">
              Pod topic
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. React hooks practice"
                className="mt-1.5 h-10 w-full rounded-xl border border-[#e0e7df] px-3 text-sm font-normal outline-none focus:border-[#84ae8a]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#59675d]">
              Session goal
              <textarea
                required
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows="3"
                placeholder="What should the group accomplish?"
                className="mt-1.5 w-full rounded-xl border border-[#e0e7df] p-3 text-sm font-normal outline-none focus:border-[#84ae8a]"
              />
            </label>
            <SelectField
              label="Focus session length"
              value={duration}
              options={["25", "40", "50"]}
              onChange={setDuration}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><LoaderCircle size={15} className="animate-spin" />Creating...</> : <>Create and enter <ArrowRight size={14} /></>}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ResourceListPage() {
  const [filters, setFilters] = useState({ branch: 'All branches', semester: 'All semesters', subject: 'All subjects', year: 'Any year', type: 'All types' })
  const filtered = resources.filter((item) => (filters.branch === 'All branches' || item.branch === filters.branch || item.branch === 'All branches') && (filters.semester === 'All semesters' || String(item.semester) === filters.semester) && (filters.subject === 'All subjects' || item.subject === filters.subject) && (filters.year === 'Any year' || String(item.year) === filters.year) && (filters.type === 'All types' || item.type === filters.type))
  const subjects = [...new Set(resources.map((resource) => resource.subject))]
  return <div className="fade-up"><PageHeading eyebrow="Learn from what came before" title="Resource Hub" subtitle="Find PYQs, notes and study material for your semester." action={<Badge tone="green"><ShieldCheck size={13} />Student-verified library</Badge>} /><Card className="mb-5 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#58665c]"><Filter size={14} />Find the right resource</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[['branch', 'Branch', ['All branches', 'CSE', 'IT', 'E&TC']], ['semester', 'Semester', ['All semesters', '2', '3', '4', '5']], ['subject', 'Subject', ['All subjects', ...subjects]], ['year', 'Year', ['Any year', '2026', '2025', '2024']], ['type', 'Type', ['All types', 'PYQ', 'Notes', 'Syllabus', 'Study Material']]].map(([key, label, options]) => <SelectField key={key} label={label} value={filters[key]} options={options} onChange={(value) => setFilters((current) => ({ ...current, [key]: value }))} />)}</div></Card><div className="mb-4 flex items-center justify-between"><p className="text-xs font-medium text-[#849087]">Showing <strong className="text-[#526055]">{filtered.length}</strong> resources</p><button onClick={() => setFilters({ branch: 'All branches', semester: 'All semesters', subject: 'All subjects', year: 'Any year', type: 'All types' })} className="text-xs font-bold text-[#47815a]">Clear filters</button></div>{filtered.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <EmptyState icon={FileText} title="No resources match those filters" description="Clear a filter or try a different subject." />}</div>
}

export function ResourceDetailPage() {
  const { resourceId } = useParams()
  const { setToast } = useOutletContext()
  const resource = resources.find((item) => item.id === resourceId)
  const navigate = useNavigate()
  if (!resource) return <EmptyState icon={FileText} title="Resource not found" description="Head back to the Resource Hub to browse the library." />
  return <div className="fade-up"><Link to="/resources" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5d7c63]"><ArrowRight size={14} className="rotate-180" />Back to resources</Link><div className="grid gap-5 lg:grid-cols-[1fr_330px]"><div><PageHeading eyebrow={`${resource.subject} · Semester ${resource.semester}`} title={resource.title} subtitle={`${resource.source} · ${resource.year}`} /><div className="soft-grid min-h-[390px] rounded-2xl border border-[#e0e6dd] bg-[#edf2ea] p-5 sm:p-9"><div className="mx-auto max-w-[520px] rounded-md border border-[#e7e9e3] bg-white p-6 shadow-[0_8px_28px_rgba(32,48,38,.10)] sm:p-10"><div className="flex items-center justify-between border-b border-[#e9ece7] pb-4"><span className="text-[9px] font-bold uppercase tracking-[.08em] text-[#778579]">Maharashtra State Board</span><span className="text-[9px] text-[#9ca49b]">{resource.year} Examination</span></div><div className="py-9 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf4ec] text-[#427951]"><FileText size={23} /></span><p className="mt-4 text-[9px] font-bold uppercase tracking-[.12em] text-[#8a978c]">{resource.type} · {resource.branch}</p><h2 className="mx-auto mt-2 max-w-xs text-xl font-extrabold text-[#2c3e31]">{resource.subject}</h2><p className="mt-2 text-xs text-[#849085]">Semester {resource.semester} · {resource.year}</p><div className="mx-auto mt-7 max-w-xs space-y-2 text-left">{['Attempt any five questions.', 'Draw a neat diagram wherever necessary.', 'Figures to the right indicate full marks.'].map((line, index) => <p key={line} className="border-b border-dashed border-[#ebeee8] py-2 text-[10px] text-[#89958b]">Q.{index + 1} &nbsp; {line}</p>)}</div><Badge className="mt-6" tone="green"><ShieldCheck size={12} />Verified campus resource</Badge></div></div></div></div><aside className="space-y-4"><Card className="p-5"><Badge tone={resource.type === 'PYQ' ? 'orange' : 'green'}>{resource.type}</Badge><h2 className="mt-3 text-base font-extrabold text-[#34443a]">Resource details</h2><dl className="mt-4 space-y-3">{[['Subject', resource.subject], ['Branch', resource.branch], ['Semester', `Semester ${resource.semester}`], ['Year', resource.year], ['Pages', `${resource.pages} pages`], ['Topics', resource.topic]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 border-b border-[#eff1ed] pb-2 text-xs"><dt className="text-[#8a958b]">{label}</dt><dd className="text-right font-semibold text-[#4c5a4f]">{value}</dd></div>)}</dl><Button className="mt-4 w-full" onClick={() => setToast({ type: 'info', message: 'Resource preview opened. A verified file can be attached later.' })}><ExternalLink size={14} />Open resource</Button><Button className="mt-2 w-full" variant="outline" onClick={() => setToast({ type: 'success', message: 'Resource saved to your study list.' })}><Download size={14} />Save for later</Button></Card><Card className="bg-[#f5f8ee] p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3edca] text-[#63773f]"><Users size={17} /></span><h3 className="mt-3 text-sm font-bold text-[#46563d]">Better with a study buddy?</h3><p className="mt-1 text-xs leading-5 text-[#79836e]">Take this topic into a focused study session.</p><Button variant="soft" className="mt-3 w-full" onClick={() => navigate('/pods/dsa-sprint')}>Discuss in a Pod <ArrowRight size={14} /></Button></Card></aside></div></div>
}

export function PulsePage() {
  const [active, setActive] = useState('For you')
  const categories = ['For you', 'My College', 'My Branch', 'Hackathons', 'Exams', 'Internships', 'Workshops']
  const filtered = pulseItems.filter((item) => active === 'For you' || item.category === active)
  return <div className="fade-up"><PageHeading eyebrow="Around your campus" title="Campus Pulse" subtitle="Important opportunities and updates for Polytechnic students." action={<Badge tone="lime"><span className="h-1.5 w-1.5 rounded-full bg-[#8da747]" />Updated today</Badge>} /><Tabs items={categories} active={active} onChange={setActive} className="mb-5" /><div className="mb-5 grid gap-3 sm:grid-cols-3">{[{ value: '3', label: 'Closing this week', icon: Clock3 }, { value: '2', label: 'Internships open', icon: BriefcaseBusiness }, { value: '1', label: 'From your campus', icon: GraduationCap }].map(({ value, label, icon: Icon }) => <Card key={label} className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ec] text-[#48815b]"><Icon size={18} /></span><span><span className="block text-lg font-extrabold text-[#34443a]">{value}</span><span className="text-[11px] text-[#849087]">{label}</span></span></Card>)}</div><div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => <OpportunityCard key={item.id} item={item} />)}</div></div>
}

export function RoadmapPage() {
  const { roadmap, setRoadmap, recentSessions } = useOutletContext()
  const total = Math.ceil(roadmap.reduce((sum, item) => sum + item.progress, 0) / roadmap.length)
  function toggle(itemId, taskIndex) {
    setRoadmap((items) => items.map((item) => {
      if (item.id !== itemId) return item
      const done = item.checkedTasks || []
      const next = done.includes(taskIndex) ? done.filter((index) => index !== taskIndex) : [...done, taskIndex]
      const base = item.progress === 100 ? 100 : 0
      const percent = item.id === 'react' && !item.checkedTasks ? Math.max(base, item.progress) : Math.round(next.length / item.checklist.length * 100)
      return { ...item, checkedTasks: next, progress: percent, status: percent === 100 ? 'Completed' : percent > 0 ? 'In progress' : 'Not started' }
    }))
  }
  return <div className="fade-up"><PageHeading eyebrow="Small steps, real momentum" title="My Learning Roadmap" subtitle="Turn your goals into concrete next steps." action={<Badge tone="lime"><Target size={13} />Built for placement prep</Badge>} /><Card className="mb-6 overflow-hidden"><div className="grid gap-5 bg-[#236c4a] p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div><Badge tone="white"><MapPin size={12} />Your path to a first developer role</Badge><h2 className="mt-3 text-xl font-extrabold text-white">A practical path, at your pace.</h2><p className="mt-1.5 text-sm text-white/70">Nine skills. One portfolio project. Your next step is already here.</p></div><div className="flex items-center gap-4 sm:w-56"><div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#d8f36a] transition-all" style={{ width: `${total}%` }} /></div><span className="text-2xl font-extrabold">{total}%</span></div></div><div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#eef1ea] px-5 py-3 text-[11px] text-[#78867b]"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#5da773]" />Completed</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full border-2 border-[#5da773]" />In progress</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#e7ebe5]" />Up next</span></div></Card><div className="grid gap-6 xl:grid-cols-[1fr_320px]"><section className="space-y-3">{roadmap.map((item, index) => <Card key={item.id} className="p-4 sm:p-5"><div className="flex gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${item.status === 'Completed' ? 'bg-[#e9f3e7] text-[#398253]' : item.status === 'In progress' ? 'bg-[#f2f7df] text-[#788a39]' : 'bg-[#f0f2ee] text-[#919b91]'}`}>{item.status === 'Completed' ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold text-[#36473c]">{item.name}</h3><p className="mt-1 text-xs text-[#879188]">{item.description}</p></div><Badge tone={item.status === 'Completed' ? 'green' : item.status === 'In progress' ? 'lime' : 'gray'}>{item.status}</Badge></div><div className="mt-3 flex items-center gap-3"><ProgressBar value={item.progress} className="flex-1" /><span className="w-9 text-right text-[11px] font-bold text-[#7c897e]">{item.progress}%</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{item.checklist.map((task, taskIndex) => <button key={task} onClick={() => toggle(item.id, taskIndex)} className="flex items-center gap-2 text-left text-[11px] text-[#77847a]"><Checkmark checked={item.checkedTasks?.includes(taskIndex) || (item.progress === 100 && !item.checkedTasks)} />{task}</button>)}</div></div></div></Card>)}</section><aside><Card className="p-5"><SectionHeading title="Recent study sessions" subtitle="Progress that happened with people." /><div className="space-y-4">{recentSessions.map((session, index) => <div key={session.id} className="flex gap-3"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-[#fff2e3] text-[#b77834]' : 'bg-[#edf3fa] text-[#617c9f]'}`}><BookOpen size={16} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#46554a]">{session.title}</p><p className="mt-1 text-[11px] text-[#8a958b]">{session.duration} min · {session.member}</p><p className="mt-1 text-[10px] text-[#a2aaa1]">{session.date}</p></div></div>)}</div><Link to="/pods"><Button variant="soft" className="mt-5 w-full">Find your next session <ArrowRight size={14} /></Button></Link></Card><div className="mt-4 rounded-2xl border border-[#eae5d8] bg-[#fffaf0] p-4"><Lightbulb size={17} className="text-[#c38c3f]" /><p className="mt-2 text-xs font-bold text-[#615638]">Your next step: React routing</p><p className="mt-1 text-[11px] leading-5 text-[#877c5f]">Try building a small, multi-page app with React Router.</p><Link to="/pods/react-sprint" className="mt-2 inline-block text-[11px] font-bold text-[#907138]">Study with a pod <ArrowRight size={12} className="inline" /></Link></div></aside></div></div>
}

export function ExistingProfilePage() {
  const [editing, setEditing] = useState(false)
  const { profile, saveProfile, setToast } = useOutletContext()
  const [draft, setDraft] = useState(profile)
  async function save(event) {
    event.preventDefault()
    try {
      await saveProfile(draft)
      setEditing(false)
      setToast({ type: 'success', message: 'Your profile was updated.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update your profile.' })
    }
  }
  const sections = [{ label: 'Skills', values: profile.skills, icon: Code2 }, { label: 'Subjects', values: profile.subjects, icon: BookOpen }, { label: 'Career goal', values: [profile.goal], icon: Target }, { label: 'Interests', values: profile.interests, icon: Heart }]
  return <div className="fade-up"><PageHeading eyebrow="A little about you" title="Your profile" subtitle="The details that help people find a good reason to learn with you." action={<Button variant="outline" onClick={() => { setDraft(profile); setEditing(true) }}><Plus size={15} />Edit profile</Button>} /><div className="grid gap-5 lg:grid-cols-[340px_1fr]"><Card className="overflow-hidden"><div className="h-28 bg-[#286f4c] soft-grid" /><div className="px-5 pb-5"><Avatar initials={profile.initials} color={profile.color} size="xl" className="-mt-10 border-[4px] border-white" /><div className="mt-3 flex items-center gap-2"><h2 className="text-xl font-extrabold text-[#2e4034]">{profile.name}</h2><Badge tone="green"><CheckCircle2 size={12} />Active</Badge></div><p className="mt-1 text-sm text-[#78847a]">{profile.branch} · Semester {profile.semester}</p><p className="mt-1 text-xs text-[#919b92]">{profile.college}</p><div className="mt-5 space-y-3 border-t border-[#eef0eb] pt-4 text-xs"><p className="flex items-center gap-2 text-[#65736a]"><Clock3 size={14} className="text-[#8d9d8f]" />Usually studies {profile.availability.toLowerCase()}s</p><p className="flex items-center gap-2 text-[#65736a]"><GraduationCap size={14} className="text-[#8d9d8f]" />Diploma · MSBTE K Scheme</p><p className="flex items-center gap-2 text-[#65736a]"><MapPin size={14} className="text-[#8d9d8f]" />Pune, Maharashtra</p></div><div className="mt-5 rounded-xl bg-[#f5f8f3] p-3.5"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8c988d]">Current focus</p><p className="mt-1.5 text-sm font-bold text-[#425348]">{profile.focus}</p></div></div></Card><div className="space-y-4"><Card className="p-5"><SectionHeading title="About" /><p className="text-sm leading-7 text-[#68766c]">I’m a third-semester CSE diploma student who loves turning class concepts into small projects. Right now I’m sharpening my DSA fundamentals and looking for study buddies who enjoy learning by building.</p></Card><div className="grid gap-4 sm:grid-cols-2">{sections.map(({ label, values, icon: Icon }) => <Card key={label} className="p-5"><div className="flex items-center gap-2 text-xs font-bold text-[#47564b]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ec] text-[#47825b]"><Icon size={15} /></span>{label}</div><div className="mt-3 flex flex-wrap gap-1.5">{values.map((value) => <Badge key={value} tone={label === 'Career goal' ? 'orange' : 'gray'}>{value}</Badge>)}</div></Card>)}</div><Card className="flex flex-wrap items-center justify-between gap-4 bg-[#f8faf6] p-5"><div><p className="text-sm font-bold text-[#405045]">Study availability</p><p className="mt-1 text-xs text-[#859087]">People see your preferred time, not your schedule.</p></div><Badge tone="lime"><Clock3 size={12} />{profile.availability}</Badge><div className="ml-auto flex gap-2"><Badge tone="green"><ShieldCheck size={12} />Profile visibility · Campus</Badge><button title="Report profile" onClick={() => setToast({ type: 'info', message: 'Report recorded for review in this local demo.' })} className="rounded-lg p-2 text-[#89948a] hover:bg-white"><Flag size={15} /></button></div></Card></div></div>{editing && <Modal title="Edit your profile" subtitle="Help classmates know what you’re learning." onClose={() => setEditing(false)}><form onSubmit={save} className="space-y-3">{[['name', 'Name'], ['college', 'College'], ['branch', 'Branch'], ['semester', 'Semester'], ['goal', 'Career goal'], ['focus', 'Current focus'], ['availability', 'Preferred study time']].map(([key, label]) => <label key={key} className="block text-xs font-semibold text-[#5b695e]">{label}<input value={draft[key]} onChange={(event) => setDraft((value) => ({ ...value, [key]: key === 'semester' ? Number(event.target.value) : event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-[#e0e7df] px-3 text-sm font-normal outline-none focus:border-[#84ae8a]" /></label>)}<div className="flex justify-end gap-2 pt-3"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit">Save profile</Button></div></form></Modal>}</div>
  return <div className="fade-up">
    <PageHeading eyebrow="Better together" title="Study Pods" subtitle="Small, focused study sessions with students who are working toward the same thing." action={<Button onClick={() => setCreating(true)}><Plus size={15} />Create a pod</Button>} />
    <div className="mb-5 flex flex-wrap gap-3">
      <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#e3e9e2] bg-white px-3 text-[#909b91]"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics and subjects" className="min-w-0 flex-1 bg-transparent text-sm text-[#39483d] outline-none" /></label>
      <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-10 rounded-xl border border-[#e3e9e2] bg-white px-3 text-sm text-[#536056]"><option>All levels</option><option>Intermediate</option><option>Beginner friendly</option></select>
    </div>
    {featuredPod && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#eee3ce] bg-[#fffaf0] p-3 text-xs leading-5 text-[#806c4b]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ffefcf] text-[#ad7d32]"><Clock3 size={14} /></span>Study pod: <strong className="font-bold">{featuredPod.name}</strong><Link to={`/pods/${featuredPod.id}`} className="ml-auto font-bold text-[#9e7135]">Open <ArrowRight size={13} className="inline" /></Link></div>}
    {podLoading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e8ede7] bg-white px-6 py-14 text-sm font-semibold text-[#397950]"><LoaderCircle size={18} className="animate-spin" />Loading study pods...</div> : podError ? <EmptyState icon={Users} title="Study pods are unavailable" description={podError} /> : visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((pod) => <PodCard key={pod.id} pod={pod} />)}</div> : <EmptyState icon={Users} title={query ? 'No study pods match that search' : 'No study pods yet'} description={query ? 'Try another topic or clear your search.' : 'Check back soon for a focused study session.'} />}
    {creating && <Modal title="Create a study pod" subtitle="Pick a focused goal and invite classmates to learn alongside you." onClose={() => setCreating(false)}><form onSubmit={createPod} className="space-y-4"><label className="block text-xs font-semibold text-[#59675d]">Pod topic<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. React hooks practice" className="mt-1.5 h-10 w-full rounded-xl border border-[#e0e7df] px-3 text-sm font-normal outline-none focus:border-[#84ae8a]" /></label><label className="block text-xs font-semibold text-[#59675d]">Session goal<textarea required value={goal} onChange={(event) => setGoal(event.target.value)} rows="3" placeholder="What should the group accomplish?" className="mt-1.5 w-full resize-y rounded-xl border border-[#e0e7df] p-3 text-sm font-normal outline-none focus:border-[#84ae8a]" /></label><SelectField label="Focus session length" value={duration} options={['25', '40', '50']} onChange={setDuration} /><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit">Create and enter <ArrowRight size={14} /></Button></div></form></Modal>}
  </div>
}