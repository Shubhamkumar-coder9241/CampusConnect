import { useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, SectionHeading } from '../components/ui.jsx'
import { ExistingProfilePage } from './Pages.jsx'

function OptionList({ title, options, selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  return <div>
    <SectionHeading title={title} subtitle="Select all that apply." />
    {options.length ? <div className="grid gap-2 sm:grid-cols-2">{options.map((option) => {
      const active = selected.includes(option.id)
      return <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${active ? 'border-[#84ae8a] bg-[#edf5eb] text-[#286e4a]' : 'border-[#e3e9e2] bg-white text-[#536056] hover:border-[#b9ccbb]'}`}>
        <input type="checkbox" checked={active} onChange={() => toggle(option.id)} className="sr-only" />
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${active ? 'border-[#3e925d] bg-[#3e925d] text-white' : 'border-[#d7dfd6] bg-white text-transparent'}`}><Check size={13} strokeWidth={3} /></span>
        <span>{option.name}</span>
      </label>
    })}</div> : <p className="rounded-xl bg-[#f8faf6] px-3 py-3 text-sm text-[#818d83]">No options are available yet.</p>}
  </div>
}

export default function ProfilePage() {
  const { profile, availableSkills, availableSubjects, saveProfile, setToast } = useOutletContext()
  const [selectedSkillIds, setSelectedSkillIds] = useState(profile.skillIds || [])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(profile.subjectIds || [])
  const [saving, setSaving] = useState(false)

  async function saveSelections(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await saveProfile(profile, selectedSkillIds, selectedSubjectIds)
      setToast({ type: 'success', message: 'Your profile skills and subjects were updated.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update your skills and subjects.' })
    } finally {
      setSaving(false)
    }
  }

  return <>
    <ExistingProfilePage />
    <section className="fade-up mt-5">
      <Card className="p-5 sm:p-6">
        <SectionHeading title="Your learning preferences" subtitle="Help CampusSetu find better matches for you." />
        <form onSubmit={saveSelections} className="space-y-6">
          <OptionList title="Skills" options={availableSkills} selected={selectedSkillIds} onChange={setSelectedSkillIds} />
          <OptionList title="Subjects" options={availableSubjects} selected={selectedSubjectIds} onChange={setSelectedSubjectIds} />
          <div className="flex justify-end border-t border-[#edf0eb] pt-4"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle size={15} className="animate-spin" />Saving...</> : 'Save preferences'}</Button></div>
        </form>
      </Card>
    </section>
  </>
}
