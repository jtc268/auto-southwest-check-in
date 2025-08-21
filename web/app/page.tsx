'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { CheckIn, SystemStatus } from '@/lib/types'
import { format } from 'date-fns'

function LogViewer({ id }: { id: string }) {
  const [lines, setLines] = useState<string[]>([])
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/checkins/${id}?logs=1`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        setStatus(data.status)
        const msgs: string[] = (data.logs || []).map((l: any) => `${l.timestamp}  ${l.message}`)
        setLines(msgs)
      } catch {}
    }
    load()
    const t = setInterval(load, 1000)
    return () => { active = false; clearInterval(t) }
  }, [id])

  if (!lines.length) return null

  return (
    <div className="mt-2 border rounded bg-gray-50">
      <div className="px-2 py-1 text-xs text-gray-600 border-b">Logs (status: {status})</div>
      <pre className="p-2 text-xs whitespace-pre-wrap leading-5 max-h-64 overflow-auto">
        {lines.join('\n')}
      </pre>
    </div>
  )
}

export default function Dashboard() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Form state
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])
  
  const fetchData = async () => {
    try {
      const [checkInsRes, statusRes] = await Promise.all([
        axios.get('/api/checkins'),
        axios.get('/api/status')
      ])
      setCheckIns(checkInsRes.data.checkIns)
      setSystemStatus(statusRes.data.status)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    
    try {
      await axios.post('/api/checkins', {
        confirmationNumber,
        firstName,
        lastName
      })
      
      // Clear form
      setConfirmationNumber('')
      setFirstName('')
      setLastName('')
      
      // Refresh data
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule check-in')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleCancel = async (id: string) => {
    try {
      await axios.delete(`/api/checkins/${id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to cancel check-in:', err)
    }
  }
  
  const handleLogout = async () => {
    await axios.post('/api/auth/logout')
    router.push('/login')
  }
  
  const getStatusColor = (status: CheckIn['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'checking-in': return 'text-yellow-600'
      case 'scheduled': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }
  
  const getStatusEmoji = (status: CheckIn['status']) => {
    switch (status) {
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'checking-in': return '⏳'
      case 'scheduled': return '📅'
      default: return '🔄'
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-southwest-blue">
                🐄 Southwest Cattle Call Eliminator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Never join the stampede again - get checked in automatically!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* System Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-4 rounded-lg border ${systemStatus?.cloud.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Cloud (Vercel)</span>
                <span className={`text-sm ${systemStatus?.cloud.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.cloud.connected ? '● Connected' : '● Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Active: {systemStatus?.cloud.activeCheckIns || 0} check-ins
              </div>
            </div>
          </div>
        </div>
        
        {/* New Check-in Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Schedule New Check-in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation Number
                </label>
                <input
                  type="text"
                  value={confirmationNumber}
                  onChange={(e) => setConfirmationNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-southwest-blue focus:border-transparent"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-southwest-blue focus:border-transparent"
                  placeholder="John"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-southwest-blue focus:border-transparent"
                  placeholder="Doe"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-6 py-2 bg-southwest-blue hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Scheduling...' : 'Schedule Check-in'}
            </button>
          </form>
        </div>
        
        {/* Check-ins List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Check-in History</h2>
          </div>
          <div className="divide-y">
            {checkIns.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No check-ins scheduled yet. Add one above to skip the cattle call!
              </div>
            ) : (
              checkIns.map((checkIn) => (
                <div key={checkIn.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getStatusEmoji(checkIn.status)}</span>
                        <div>
                          <div className="font-medium">
                            {checkIn.firstName} {checkIn.lastName} - {checkIn.confirmationNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status: <span className={getStatusColor(checkIn.status)}>{checkIn.status}</span>
                            {checkIn.boardingPosition && (
                              <span className="ml-2 font-semibold text-green-600">
                                Position: {checkIn.boardingPosition}
                              </span>
                            )}
                          </div>
                          {checkIn.scheduledTime && (
                            <div className="text-sm text-gray-500">
                              Scheduled for: {checkIn.scheduledTime}
                            </div>
                          )}
                          {checkIn.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {checkIn.error}
                            </div>
                          )}
                          {['checking-in','completed','failed'].includes(checkIn.status) && (
                            <LogViewer id={checkIn.id} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {['pending', 'scheduled', 'checking-in'].includes(checkIn.status) && (
                        <button
                          onClick={() => handleCancel(checkIn.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
