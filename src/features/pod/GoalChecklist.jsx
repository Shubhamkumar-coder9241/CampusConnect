import { Checkmark } from '../../components/ui.jsx'

export default function GoalChecklist({ goals, checked, onToggle }) {
  return <div className="space-y-1">{goals.map((goal, index) => <button key={goal} onClick={() => onToggle(index)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-[#f5f8f3]"><Checkmark checked={checked.includes(index)} /><span className={`flex-1 text-sm ${checked.includes(index) ? 'text-[#98a097] line-through' : 'text-[#536157]'}`}>{goal}</span><span className="text-[10px] text-[#a5ada4]">{index + 1}</span></button>)}</div>
}