import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { HomePage, DiscoverPage, MentorsPage, PodsPage, ResourceListPage, ResourceDetailPage, PulsePage, RoadmapPage, ProfilePage } from './pages/Pages.jsx'
import PodRoom from './features/pod/PodRoom.jsx'
import { roadmapSeed, recentSessionsSeed } from './data/roadmap.js'
import { pods as podSeed } from './data/pods.js'
import { currentStudent } from './data/students.js'

export default function App() {
  const [connections, setConnections] = useState({})
  const [mentorRequests, setMentorRequests] = useState({})
  const [roadmap, setRoadmap] = useState(roadmapSeed)
  const [podList, setPodList] = useState(podSeed)
    const [profile, setProfile] = useState(currentStudent)
  const [recentSessions, setRecentSessions] = useState(recentSessionsSeed)
  const [toast, setToast] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

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

  const appState = { connections, setConnections, mentorRequests, setMentorRequests, roadmap, setRoadmap, podList, setPodList, profile, setProfile, recentSessions, updateRoadmapFromSession, toast, setToast, darkMode, setDarkMode }

  return <HashRouter><div className={darkMode ? 'app-shell dark-theme' : 'app-shell'}><Routes>
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
  </Routes></div></HashRouter>
}
