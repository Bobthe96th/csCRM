import { useState, useEffect } from 'react'
import { formatCairoDateTime, getCairoOffsetHours } from '@/lib/timezone-utils'
import type { AppUser } from '@/lib/supabase'

interface StatusIndicatorProps {
  supabaseUrl?: string
}

export default function StatusIndicator({ supabaseUrl }: StatusIndicatorProps) {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [nowCairo, setNowCairo] = useState<string>('')
  const [offsetHours, setOffsetHours] = useState<number>(0)
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionStart, setSessionStart] = useState<string>('')
  const [sessionElapsed, setSessionElapsed] = useState<string>('')

  useEffect(() => {
    // Check API status
    fetch('/api/test')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('error'))

    // Check Supabase connection
    if (supabaseUrl) {
      setSupabaseStatus('connected')
    } else {
      setSupabaseStatus('error')
    }

    // Timezone: start clock tick and calculate offset
    const updateTime = () => {
      setNowCairo(formatCairoDateTime(new Date()))
      setOffsetHours(getCairoOffsetHours())
    }
    updateTime()
    const t = setInterval(updateTime, 60 * 1000)
    
    // Load users summary
    fetch('/api/users')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setUsers(json.data as AppUser[])
      })
      .catch(() => {})

    // Resume existing session if valid, otherwise create a new one
    const storedId = Number(localStorage.getItem('session_id') || 0)
    const startNew = async () => {
      const r = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: 'anonymous', user_agent: navigator.userAgent })
      })
      const json = await r.json()
      if (json?.success && json.data) {
        setSessionId(json.data.id)
        setSessionStart(json.data.started_at)
        localStorage.setItem('session_id', String(json.data.id))
      }
    }

    const resume = async () => {
      if (!storedId) return startNew()
      const r = await fetch(`/api/sessions?id=${storedId}`)
      if (r.ok) {
        const json = await r.json()
        setSessionId(json.data.id)
        setSessionStart(json.data.started_at)
        localStorage.setItem('session_id', String(json.data.id))
      } else {
        // expired or not found -> new session
        await startNew()
      }
    }
    resume().catch(() => startNew())

    // Heartbeat on activity
    const heartbeat = () => {
      const id = Number(localStorage.getItem('session_id') || 0)
      if (!id) return
      fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id, action: 'heartbeat' })
      }).catch(() => {})
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'focus']
    activityEvents.forEach(evt => window.addEventListener(evt, heartbeat, { passive: true }))

    return () => {
      clearInterval(t)
      activityEvents.forEach(evt => window.removeEventListener(evt, heartbeat))
    }
  }, [supabaseUrl])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'loading':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      case 'loading':
        return 'Loading'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">System Status</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(apiStatus)}`} />
          <span className="text-sm text-gray-600">API: {getStatusText(apiStatus)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(supabaseStatus)}`} />
          <span className="text-sm text-gray-600">Supabase: {getStatusText(supabaseStatus)}</span>
        </div>

        {/* Session Info */}
        <div className="mt-2 text-xs text-gray-600">
          Session: {sessionStart ? (
            <>
              started <span className="font-medium">{new Date(sessionStart).toLocaleTimeString()}</span>
              {sessionId ? (
                <>
                  <span className="mx-1">•</span>
                  id <span className="font-mono">{sessionId}</span>
                </>
              ) : null}
            </>
          ) : 'starting...'}
        </div>

        {/* Users Summary */}
        <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Users</div>
          {users ? (
            <div className="text-sm text-gray-800">
              <div>Total: <span className="font-medium">{users.length}</span></div>
              <div>Admins: <span className="font-medium">{users.filter(u => u.role === 'admin').length}</span></div>
              <div>Agents: <span className="font-medium">{users.filter(u => u.role === 'agent').length}</span></div>
              {users.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Recent: {users.slice(-3).map(u => u.display_name).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Loading users…</div>
          )}
        </div>

        {/* Friendly Timezone Summary */}
        <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Cairo Timezone</div>
          <div className="text-sm text-gray-800">
            Local time in Cairo: <span className="font-medium">{nowCairo || '...'}</span>
          </div>
          <div className="text-sm text-gray-800">
            Offset from UTC: <span className="font-medium">UTC+{offsetHours}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Times you schedule are saved in UTC and shown here in Cairo time.
          </div>
        </div>
      </div>
    </div>
  )
} 