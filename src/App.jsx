import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { HomePage, DiscoverPage, MentorsPage, PodsPage, ResourceListPage, ResourceDetailPage, PulsePage, RoadmapPage } from './pages/Pages.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { LoginPage, SignupPage } from './pages/AuthPages.jsx'
import PodRoom from './features/pod/PodRoom.jsx'
import { roadmapSeed, recentSessionsSeed } from './data/roadmap.js'
import { pods as podSeed } from './data/pods.js'
import { currentStudent } from './data/students.js'
import { supabase } from './lib/supabaseClient.js'

const profileColumns = 'id, name, college, branch, semester, career_goal, interests, preferred_study_time, bio, avatar_url, created_at, updated_at'

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
  const [podList, setPodList] = useState(podSeed)
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
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

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

  const appState = { session, authUser: session?.user, connections, setConnections, mentorRequests, setMentorRequests, roadmap, setRoadmap, podList, setPodList, profile, setProfile, availableSkills, availableSubjects, saveProfile, recentSessions, updateRoadmapFromSession, logout, toast, setToast, darkMode, setDarkMode }

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
