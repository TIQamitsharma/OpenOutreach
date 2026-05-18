import { useEffect, useState } from 'react'
import { Activity, Play, Pause, AlertCircle, CheckCircle2, Clock, Zap, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { DaemonStatus, Task } from '../../lib/database.types'

const STATUS_CONFIG = {
  stopped: { color: 'bg-gray-400', label: 'Stopped', text: 'text-gray-600' },
  starting: { color: 'bg-yellow-400 animate-pulse', label: 'Starting', text: 'text-yellow-600' },
  running: { color: 'bg-green-500 animate-pulse', label: 'Running', text: 'text-green-600' },
  paused: { color: 'bg-yellow-400', label: 'Paused', text: 'text-yellow-600' },
  error: { color: 'bg-red-500', label: 'Error', text: 'text-red-600' },
}

export default function AutomationPage() {
  const { user } = useAuth()
  const [daemon, setDaemon] = useState<DaemonStatus | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [daemonRes, tasksRes] = await Promise.all([
      supabase.from('daemon_status').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('tasks').select('*').eq('user_id', user!.id).order('scheduled_at', { ascending: false }).limit(50),
    ])
    setDaemon(daemonRes.data)
    setTasks(tasksRes.data || [])
    setLoading(false)
  }

  async function requestStart() {
    if (!user) return
    setActionLoading(true)
    const { data: existing } = await supabase.from('daemon_status').select('id').eq('user_id', user.id).maybeSingle()
    if (existing) {
      await supabase.from('daemon_status').update({ status: 'starting', updated_at: new Date().toISOString() }).eq('user_id', user.id)
    } else {
      await supabase.from('daemon_status').insert({ user_id: user.id, status: 'starting' })
    }
    await loadData()
    setActionLoading(false)
  }

  async function requestStop() {
    if (!user || !daemon) return
    setActionLoading(true)
    await supabase.from('daemon_status').update({ status: 'stopped', updated_at: new Date().toISOString() }).eq('user_id', user.id)
    await loadData()
    setActionLoading(false)
  }

  const statusCfg = STATUS_CONFIG[daemon?.status || 'stopped']

  const taskCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
          <p className="text-gray-500 text-sm mt-0.5">Monitor and control your LinkedIn automation worker</p>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${statusCfg.color}`} />
            <span className={`font-semibold text-lg ${statusCfg.text}`}>{statusCfg.label}</span>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-primary text-sm py-2"
              disabled={actionLoading || daemon?.status === 'running' || daemon?.status === 'starting'}
              onClick={requestStart}
            >
              <Play className="w-4 h-4" />
              Start Automation
            </button>
            <button
              className="btn-secondary text-sm py-2"
              disabled={actionLoading || daemon?.status === 'stopped'}
              onClick={requestStop}
            >
              <Pause className="w-4 h-4" />
              Stop
            </button>
          </div>
        </div>

        {daemon ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Total Connects</div>
              <div className="text-2xl font-bold text-gray-900">{daemon.total_connects}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Total Follow-ups</div>
              <div className="text-2xl font-bold text-gray-900">{daemon.total_follow_ups}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Queue Depth</div>
              <div className="text-2xl font-bold text-gray-900">{daemon.queue_depth}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Last Task</div>
              <div className="text-sm font-medium text-gray-900 capitalize">{daemon.last_task_type || '—'}</div>
              {daemon.last_task_at && <div className="text-xs text-gray-400 mt-0.5">{new Date(daemon.last_task_at).toLocaleTimeString()}</div>}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Automation not configured</strong> — Click "Start Automation" to request a worker process. The automation daemon runs on the server and handles LinkedIn interactions autonomously.
            </div>
          </div>
        )}

        {daemon?.last_error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Last Error</span>
            </div>
            <p className="text-sm text-red-600 font-mono">{daemon.last_error}</p>
          </div>
        )}

        {daemon?.last_heartbeat && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            Last heartbeat: {new Date(daemon.last_heartbeat).toLocaleString()}
          </div>
        )}
      </div>

      {/* Task queue */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          Task Queue
        </h3>

        <div className="flex gap-3 mb-4 flex-wrap">
          {Object.entries(taskCounts).map(([status, count]) => (
            <div key={status} className={`badge gap-1.5 px-3 py-1.5 text-xs ${
              status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              status === 'running' ? 'bg-blue-100 text-blue-700' :
              status === 'completed' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              <span className="capitalize">{status}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
          {tasks.length === 0 && <span className="text-sm text-gray-400">No tasks</span>}
        </div>

        {!loading && tasks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Scheduled</th>
                  <th className="text-left py-2 px-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 20).map(task => (
                  <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {task.task_type === 'connect' ? <Zap className="w-3.5 h-3.5 text-brand-500" /> :
                         task.task_type === 'follow_up' ? <MessageSquareIcon className="w-3.5 h-3.5 text-green-500" /> :
                         <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />}
                        <span className="capitalize font-medium">{task.task_type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`badge text-xs ${
                        task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{task.status}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-500">{new Date(task.scheduled_at).toLocaleString()}</td>
                    <td className="py-2 px-3 text-red-600 text-xs max-w-[200px] truncate">{task.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageSquareIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}
