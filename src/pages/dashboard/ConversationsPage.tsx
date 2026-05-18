import { useEffect, useState } from 'react'
import { MessageSquare, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { ChatMessage, Deal, Lead } from '../../lib/database.types'

type Thread = {
  deal: Deal & { lead?: Lead }
  messages: ChatMessage[]
  lastMessage: ChatMessage
}

export default function ConversationsPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (!messages || messages.length === 0) { setThreads([]); setLoading(false); return }

    const dealIds = [...new Set(messages.map((m: ChatMessage) => m.deal_id))]
    const { data: deals } = await supabase.from('deals').select('*').in('id', dealIds).eq('user_id', user!.id)
    const leadIds = [...new Set((deals || []).map((d: Deal) => d.lead_id))]
    const { data: leads } = await supabase.from('leads').select('*').in('id', leadIds)

    const leadMap = Object.fromEntries((leads || []).map((l: Lead) => [l.id, l]))
    const dealMap = Object.fromEntries((deals || []).map((d: Deal) => [d.id, { ...d, lead: leadMap[d.lead_id] }]))

    const threadMap = new Map<string, Thread>()
    for (const msg of messages as ChatMessage[]) {
      if (!threadMap.has(msg.deal_id)) {
        threadMap.set(msg.deal_id, { deal: dealMap[msg.deal_id], messages: [], lastMessage: msg })
      }
      threadMap.get(msg.deal_id)!.messages.push(msg)
    }

    const sorted = [...threadMap.values()].sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    )
    setThreads(sorted)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-500 text-sm mt-0.5">LinkedIn message history synced by the automation</p>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : threads.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500 text-sm">Messages will appear here once leads start responding.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-4 h-[calc(100vh-180px)]">
          {/* Thread list */}
          <div className="md:col-span-2 card overflow-y-auto">
            {threads.map(thread => (
              <button
                key={thread.deal.id}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected?.deal.id === thread.deal.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}
                onClick={() => setSelected(thread)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {thread.deal.lead?.public_identifier || 'Unknown'}
                  </span>
                  {thread.deal.lead?.linkedin_url && (
                    <a href={thread.deal.lead.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3 text-gray-400 hover:text-brand-600" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{thread.lastMessage.content}</p>
                <div className="text-xs text-gray-400 mt-1">{new Date(thread.lastMessage.created_at).toLocaleDateString()}</div>
              </button>
            ))}
          </div>

          {/* Message view */}
          <div className="md:col-span-3 card flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{selected.deal.lead?.public_identifier || 'Unknown'}</span>
                    {selected.deal.lead?.linkedin_url && (
                      <a href={selected.deal.lead.linkedin_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-brand-600" />
                      </a>
                    )}
                    <span className={`badge ml-2 ${selected.deal.state === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {selected.deal.state}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {[...selected.messages].reverse().map(msg => (
                    <div key={msg.id} className={`flex ${msg.is_outgoing ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.is_outgoing
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`text-xs mt-1 ${msg.is_outgoing ? 'text-brand-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{msg.is_outgoing ? 'You' : 'Lead'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
