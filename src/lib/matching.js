const overlapCount = (first = [], second = []) => first.filter((item) => second.includes(item)).length

export function calculateMatch(student, candidate) {
  const studentGoal = String(student.goal || '').toLowerCase()
  const candidateGoal = String(candidate.goal || candidate.expertise?.[0] || '').toLowerCase()
  const checks = [
    { label: 'shared subject', points: overlapCount(student.subjects, candidate.subjects) > 0, weight: 28 },
    { label: 'shared skills', points: overlapCount(student.skills, candidate.skills) > 0, weight: 20 },
    { label: 'similar goal', points: Boolean(studentGoal && candidateGoal && (studentGoal.includes(candidateGoal) || candidateGoal === studentGoal)), weight: 18 },
    { label: 'same semester', points: student.semester === candidate.semester, weight: 14 },
    { label: 'same availability', points: student.availability === candidate.availability, weight: 12 },
    { label: 'shared interests', points: overlapCount(student.interests, candidate.interests) > 0, weight: 8 },
  ]
  const matched = checks.filter((item) => item.points)
  const score = Math.min(98, Math.max(68, 68 + matched.reduce((total, item) => total + item.weight * 0.3, 0)))
  const reasons = matched.slice(0, 3).map((item) => item.label)
  return { score: Math.round(score), reasons: reasons.length ? reasons : ['similar learning goals'] }
}