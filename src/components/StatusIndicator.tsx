import { useState, useEffect } from 'react'

interface StatusIndicatorProps {
  supabaseUrl?: string
}

export default function StatusIndicator({ supabaseUrl }: StatusIndicatorProps) {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading')

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
      </div>
    </div>
  )
} 