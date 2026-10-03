import { useState } from 'react'
import { ArrowUp, MoreHorizontal, ShieldCheck } from 'lucide-react'
import { Avatar, Button } from '../../components/ui.jsx'

export default function PodChat({ messages, onSend, loading = false, sending = false, error = '' }) {
  const [draft, setDraft] = useState('')
  async function submit(event) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending || loading) return
    const sent = await onSend(message)
    if (sent) setDraft('')
  }

  return <div className="flex h-full min-h-[430px] flex-col">
    <div className="flex items-center justify-between border-b border-[#edf0eb] px-4 py-3"><span><span className="block text-sm font-bold text-[#405045]">Pod chat</span><span className="mt-0.5 block text-[10px] text-[#929c93]">Keep it kind and on topic</span></span><button className="rounded-lg p-1.5 text-[#8d978e] hover:bg-[#f3f5f2]" title="Chat settings"><MoreHorizontal size={18} /></button></div>
    <div className="thin-scroll flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {loading && <p className="text-center text-xs text-[#879188]">Loading messages...</p>}
      {!loading && !messages.length && <p className="my-auto text-center text-xs text-[#879188]">No messages yet. Start the conversation.</p>}
      {messages.map((message) => <div key={message.id} className={`flex items-end gap-2 ${message.self ? 'flex-row-reverse' : ''}`}><Avatar initials={message.initials} color={message.color} size="sm" /><div className={`max-w-[82%] ${message.self ? 'text-right' : ''}`}><p className={`mb-1 text-[10px] font-bold text-[#818c83] ${message.self ? 'mr-1' : 'ml-1'}`}>{message.name}</p><div className={`rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.self ? 'rounded-br-sm bg-[#eaf3e8] text-[#405846]' : 'rounded-bl-sm bg-[#f3f5f1] text-[#56645a]'}`}>{message.text}</div><p className="mt-1 px-1 text-[9px] text-[#a4aca4]">{message.time}</p></div></div>)}
    </div>
    <div className="border-t border-[#edf0eb] p-3"><div className="mb-2 flex items-center gap-1 text-[9px] text-[#93a095]"><ShieldCheck size={11} />Your pod is a focused, student-only space.</div>{error && <p role="alert" className="mb-2 text-xs text-[#a94840]">{error}</p>}<form onSubmit={submit} className="flex items-center gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={loading || sending} placeholder="Message your pod..." className="h-10 min-w-0 flex-1 rounded-xl border border-[#e7ece5] bg-[#fafbf9] px-3 text-xs outline-none focus:border-[#8eb696]" /><Button aria-label="Send message" size="sm" className="h-10 w-10 px-0" disabled={loading || sending || !draft.trim()}>{sending ? '…' : <ArrowUp size={16} />}</Button></form></div>
  </div>
}