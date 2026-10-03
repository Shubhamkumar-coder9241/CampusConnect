import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { HomePage, DiscoverPage, MentorsPage, PodsPage, ResourceListPage, ResourceDetailPage, PulsePage, RoadmapPage } from './pages/Pages.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { LoginPage, SignupPage } from './pages/AuthPages.jsx'
import PodRoom from './features/pod/PodRoom.jsx'
import { roadmapSeed, recentSessionsSeed } from './data/roadmap.js'
import { currentStudent } from './data/students.js'
import { supabase } from './lib/supabaseClient.js'

const profileColumns = 'id, name, college, branch, semester, career_goal, interests, preferred_study_time, bio, avatar_url, created_at, updated_at'

function logStudyPodSupabaseError(operation, error) {
  if (!import.meta.env.DEV) return
  console.error(`Supabase ${operation} failed:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    error,
  })
}

function initialsFor(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || currentStudent.initials
}

function profileFromRow(row, skillIds = [], subjectIds = []) {
  const name = row.name || currentStudent.name
  return {
    ...currentStudent,
    id: row.id,
    name,
    initials: initialsFor(name),
    college: row.college || currentStudent.college,
    branch: row.branch || currentStudent.branch,
    semester: row.semester || currentStudent.semester,
    goal: row.career_goal || currentStudent.goal,
    interests: Array.isArray(row.interests) ? row.interests : currentStudent.interests,
    availability: row.preferred_study_time || currentStudent.availability,
    focus: row.bio || currentStudent.focus,
    avatar_url: row.avatar_url || null,
    skillIds,
    subjectIds,
  }
}

function profileRowFromProfile(profile, userId) {
  return {
    id: userId,
    name: profile.name,
    college: profile.college,
    branch: profile.branch,
    semester: profile.semester,
    career_goal: profile.goal,
    interests: profile.interests,
    preferred_study_time: profile.availability,
    bio: profile.focus,
    avatar_url: profile.avatar_url || null,
    updated_at: new Date().toISOString(),
  }
}

function RouteLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f9f5] text-sm font-semibold text-[#397950]">Loading CampusSetu...</main>
}

function ProtectedRoute({ session, authLoading, profileLoading }) {
  if (authLoading || (session && profileLoading)) return <RouteLoading />
  return session ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute({ session, authLoading, children }) {
  if (authLoading) return <RouteLoading />
  return session ? <Navigate to="/" replace /> : children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [connections, setConnections] = useState({})
  const [mentorRequests, setMentorRequests] = useState({})
  const [roadmap, setRoadmap] = useState(roadmapSeed)
  const [podList, setPodList] = useState([])
  const [podLoading, setPodLoading] = useState(true)
  const [podError, setPodError] = useState('')
  const [profile, setProfile] = useState(currentStudent)
  const [availableSkills, setAvailableSkills] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [recentSessions, setRecentSessions] = useState(recentSessionsSeed)
  const [toast, setToast] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!mounted) return
      setSession(nextSession)
      setAuthLoading(false)
    }).catch(() => {
      if (mounted) setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setAuthLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      if (!session?.user) {
        setProfileLoading(false)
        setProfile(currentStudent)
        setAvailableSkills([])
        setAvailableSubjects([])
        return
      }
      setProfileLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (mounted) {
          setProfileLoading(false)
          setToast({ type: 'error', message: userError?.message || 'Your session could not be verified. Please sign in again.' })
        }
        return
      }
      const [{ data, error }, { data: skills, error: skillsError }, { data: subjects, error: subjectsError }, { data: userSkills, error: userSkillsError }, { data: userSubjects, error: userSubjectsError }] = await Promise.all([
        supabase.from('profiles').select(profileColumns).eq('id', user.id).maybeSingle(),
        supabase.from('skills').select('id, name').order('name'),
        supabase.from('subjects').select('id, name').order('name'),
        supabase.from('user_skills').select('skill_id').eq('user_id', user.id),
        supabase.from('user_subjects').select('subject_id').eq('user_id', user.id),
      ])
      if (error || skillsError || subjectsError || userSkillsError || userSubjectsError) {
        if (mounted) {
          setProfileLoading(false)
          setToast({ type: 'error', message: 'We could not load your profile options. Please try again.' })
        }
        return
      }
      let row = data
      if (!row) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || currentStudent.name
        const newRow = profileRowFromProfile({ ...currentStudent, name }, user.id)
        const { data: created, error: createError } = await supabase.from('profiles').insert(newRow).select(profileColumns).single()
        if (!createError) row = created
      }
      if (mounted) {
        const skillIds = (userSkills || []).map(({ skill_id }) => skill_id)
        const subjectIds = (userSubjects || []).map(({ subject_id }) => subject_id)
        const hydratedProfile = row ? profileFromRow(row, skillIds, subjectIds) : { ...currentStudent, id: user.id, skillIds, subjectIds }
        if (skillIds.length) hydratedProfile.skills = (skills || []).filter(({ id }) => skillIds.includes(id)).map(({ name }) => name)
        if (subjectIds.length) hydratedProfile.subjects = (subjects || []).filter(({ id }) => subjectIds.includes(id)).map(({ name }) => name)
        setAvailableSkills(skills || [])
        setAvailableSubjects(subjects || [])
        setProfile(hydratedProfile)
        setProfileLoading(false)
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [session])

  useEffect(() => {
    let mounted = true
    async function loadPods() {
      if (!session?.user) {
        setPodList([])
        setPodLoading(false)
        setPodError('')
        return
      }
      setPodLoading(true)
      setPodError('')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) throw new Error('Your session could not be verified.')
        const { data: podRows, error: podsError } = await supabase.from('study_pods')
          .select('id, name, topic, goal, description, max_members, created_by, created_at')
          .order('created_at', { ascending: false })
        if (podsError) throw podsError
        const ids = (podRows || []).map((pod) => pod.id)
        const { data: memberRows, error: membersError } = ids.length
          ? await supabase.from('study_pod_members').select('pod_id, user_id, role').in('pod_id', ids)
          : { data: [], error: null }
        if (membersError) throw membersError
        const profileIds = [...new Set([
          ...(podRows || []).map((pod) => pod.created_by),
          ...(memberRows || []).map((member) => member.user_id),
        ])]
        const { data: profileRows, error: profilesError } = profileIds.length
          ? await supabase.from('profiles').select('id, name, avatar_url').in('id', profileIds)
          : { data: [], error: null }
        if (profilesError && import.meta.env.DEV) console.warn('Unable to load pod member profile details:', profilesError)
        const profilesById = new Map((profileRows || []).map((profileRow) => [profileRow.id, profileRow]))
        const membersByPod = new Map()
        for (const member of memberRows || []) {
          membersByPod.set(member.pod_id, [...(membersByPod.get(member.pod_id) || []), member])
        }
        const colors = ['#9cc7b1', '#efc2a1', '#c7b4df', '#9ec4dc']
        const mappedPods = (podRows || []).map((pod) => {
          const members = (membersByPod.get(pod.id) || []).map((member, index) => {
            const memberProfile = profilesById.get(member.user_id)
            const name = memberProfile?.name || 'Member'
            return {
              id: member.user_id,
              name,
              initials: name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''),
              color: colors[index % colors.length],
              avatarUrl: memberProfile?.avatar_url || null,
              role: member.role,
            }
          })
          const creator = profilesById.get(pod.created_by)
          return {
            id: pod.id,
            name: pod.name,
            topic: pod.name,
            detail: [pod.topic, pod.description].filter(Boolean).join(' · '),
            goal: pod.goal || '',
            description: pod.description || '',
            host: creator?.name || 'Pod host',
            creatorId: pod.created_by,
            members: members.length,
            maxMembers: pod.max_members,
            duration: 50,
            status: 'Open',
            level: 'All levels',
            time: pod.created_at ? new Date(pod.created_at).toLocaleDateString() : '',
            memberProfiles: members,
            memberNames: members.map((member) => member.name),
            isMember: members.some((member) => member.id === user.id),
          }
        })
        if (mounted) {
          setPodList(mappedPods)
          setPodLoading(false)
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Unable to load study pods:', error)
        if (mounted) {
          setPodList([])
          setPodError('We could not load study pods right now. Please try again in a moment.')
          setPodLoading(false)
        }
      }
    }
    loadPods()
    return () => { mounted = false }
  }, [session])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function createStudyPod({ name, topic, goal, description, maxMembers, duration }) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      if (authError) logStudyPodSupabaseError('auth.getUser before study_pods insert', authError)
      throw new Error('Please sign in to create a study pod.')
    }
    const { data: pod, error: podError } = await supabase.from('study_pods').insert({
      name,
      topic,
      goal: goal || null,
      description: description || null,
      max_members: maxMembers,
      created_by: user.id,
    }).select('id, name, topic, goal, description, max_members, created_by, created_at').single()
    if (podError) {
      logStudyPodSupabaseError('study_pods insert', podError)
      throw podError
    }
    const { error: membershipError } = await supabase.from('study_pod_members').insert({
      pod_id: pod.id,
      user_id: user.id,
      role: 'owner',
    })
    if (membershipError) {
      logStudyPodSupabaseError('study_pod_members owner insert', membershipError)
      const { error: rollbackError } = await supabase.from('study_pods').delete().eq('id', pod.id).eq('created_by', user.id)
      if (rollbackError) logStudyPodSupabaseError('study_pods rollback after owner membership failure', rollbackError)
      throw new Error('The pod could not be fully created because owner membership failed.')
    }
    const creatorName = profile.name || user.user_metadata?.name || 'You'
    const member = { id: user.id, name: creatorName, initials: profile.initials, color: profile.color, role: 'owner' }
    const createdPod = {
      id: pod.id,
      name: pod.name,
      topic: pod.name,
      detail: [pod.topic, pod.description].filter(Boolean).join(' · '),
      goal: pod.goal || '',
      description: pod.description || '',
      host: creatorName,
      creatorId: pod.created_by,
      members: 1,
      maxMembers: pod.max_members,
      duration: duration || 50,
      status: 'Open',
      level: 'All levels',
      time: pod.created_at ? new Date(pod.created_at).toLocaleDateString() : '',
      memberProfiles: [member],
      memberNames: [creatorName],
      isMember: true,
    }
    setPodList((pods) => [createdPod, ...pods.filter((item) => item.id !== pod.id)])
    return createdPod
  }

  async function joinStudyPod(podId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Please sign in to join a study pod.')
    const pod = podList.find((item) => item.id === podId)
    if (!pod) throw new Error('This study pod is no longer available.')
    const { data: existing, error: existingError } = await supabase.from('study_pod_members')
      .select('user_id, role').eq('pod_id', podId).eq('user_id', user.id).maybeSingle()
    if (existingError) throw existingError
    if (existing) {
      setPodList((pods) => pods.map((item) => item.id === podId ? { ...item, isMember: true } : item))
      return { alreadyMember: true }
    }
    const { count, error: countError } = await supabase.from('study_pod_members')
      .select('user_id', { count: 'exact', head: true }).eq('pod_id', podId)
    if (countError) throw countError
    const memberCount = count ?? pod.members
    if (memberCount >= pod.maxMembers) throw new Error('This study pod is full.')
    const { error: insertError } = await supabase.from('study_pod_members').insert({
      pod_id: podId,
      user_id: user.id,
      role: 'member',
    })
    if (insertError?.code === '23505') {
      setPodList((pods) => pods.map((item) => item.id === podId ? { ...item, isMember: true } : item))
      return { alreadyMember: true }
    }
    if (insertError) throw insertError
    const name = profile.name || user.user_metadata?.name || 'You'
    const member = { id: user.id, name, initials: profile.initials, color: profile.color, role: 'member' }
    setPodList((pods) => pods.map((item) => item.id === podId ? {
      ...item,
      members: memberCount + 1,
      isMember: true,
      memberProfiles: [...(item.memberProfiles || []), member],
      memberNames: [...(item.memberNames || []), name],
    } : item))
    return { alreadyMember: false }
  }

  async function leaveStudyPod(podId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Please sign in to leave a study pod.')
    const { error } = await supabase.from('study_pod_members').delete().eq('pod_id', podId).eq('user_id', user.id)
    if (error) throw error
    setPodList((pods) => pods.map((pod) => pod.id === podId ? {
      ...pod,
      members: Math.max(0, pod.members - 1),
      isMember: false,
      memberProfiles: (pod.memberProfiles || []).filter((member) => member.id !== user.id),
      memberNames: (pod.memberNames || []).filter((memberName) => memberName !== profile.name),
    } : pod))
  }

  function updateRoadmapFromSession(session) {
    setRoadmap((items) => items.map((item) => item.id === 'react'
      ? { ...item, progress: Math.min(100, item.progress + 8), status: item.progress + 8 >= 100 ? 'Completed' : 'In progress' }
      : item))
    setRecentSessions((sessions) => [{ id: `session-${Date.now()}`, title: session.title, duration: session.duration, date: 'Just now', member: 'with your pod' }, ...sessions])
    setToast({ type: 'success', message: 'Roadmap updated. Your React progress moved forward.' })
  }

  async function saveProfile(nextProfile, skillIds = nextProfile.skillIds || [], subjectIds = nextProfile.subjectIds || []) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Your session expired. Please sign in again.')
    const { data, error } = await supabase.from('profiles').upsert(profileRowFromProfile(nextProfile, user.id)).select(profileColumns).single()
    if (error) throw error
    const { error: skillsDeleteError } = await supabase.from('user_skills').delete().eq('user_id', user.id)
    if (skillsDeleteError) throw skillsDeleteError
    const { error: subjectsDeleteError } = await supabase.from('user_subjects').delete().eq('user_id', user.id)
    if (subjectsDeleteError) throw subjectsDeleteError
    if (skillIds.length) {
      const { error: skillsInsertError } = await supabase.from('user_skills').insert(skillIds.map((skillId) => ({ user_id: user.id, skill_id: skillId })))
      if (skillsInsertError) throw skillsInsertError
    }
    if (subjectIds.length) {
      const { error: subjectsInsertError } = await supabase.from('user_subjects').insert(subjectIds.map((subjectId) => ({ user_id: user.id, subject_id: subjectId })))
      if (subjectsInsertError) throw subjectsInsertError
    }
    setProfile(profileFromRow(data, skillIds, subjectIds))
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) setToast({ type: 'error', message: 'Unable to log out. Please try again.' })
  }

  const appState = { session, authUser: session?.user, connections, setConnections, mentorRequests, setMentorRequests, roadmap, setRoadmap, podList, setPodList, podLoading, podError, createStudyPod, joinStudyPod, leaveStudyPod, profile, setProfile, availableSkills, availableSubjects, saveProfile, recentSessions, updateRoadmapFromSession, logout, toast, setToast, darkMode, setDarkMode }

  return <HashRouter><div className={darkMode ? 'app-shell dark-theme' : 'app-shell'}><Routes>
    <Route path="/login" element={<PublicRoute session={session} authLoading={authLoading}><LoginPage /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute session={session} authLoading={authLoading}><SignupPage /></PublicRoute>} />
    <Route element={<ProtectedRoute session={session} authLoading={authLoading} profileLoading={profileLoading} />}>
      <Route element={<Layout appState={appState} />}>
      <Route index element={<HomePage />} />
      <Route path="discover" element={<DiscoverPage />} />
      <Route path="mentors" element={<MentorsPage />} />
      <Route path="pods" element={<PodsPage />} />
      <Route path="pods/:podId" element={<PodRoom />} />
      <Route path="resources" element={<ResourceListPage />} />
      <Route path="resources/:resourceId" element={<ResourceDetailPage />} />
      <Route path="pulse" element={<PulsePage />} />
      <Route path="roadmap" element={<RoadmapPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<HomePage />} />
      </Route>
    </Route>
  </Routes></div></HashRouter>
}
