export interface CheckIn {
  id: string
  confirmationNumber: string
  firstName: string
  lastName: string
  status: 'pending' | 'scheduled' | 'checking-in' | 'completed' | 'failed' | 'cancelled'
  scheduledTime?: string
  checkInTime?: string
  boardingPosition?: string
  error?: string
  createdAt: string
  updatedAt: string
  source: 'nas' | 'cloud'
  // Real-time observability fields
  startedAt?: string
  completedAt?: string
  output?: { timestamp: string; message: string }[]
}

export interface CheckInRequest {
  confirmationNumber: string
  firstName: string
  lastName: string
}

export interface SystemStatus {
  nas: {
    connected: boolean
    lastPing?: string
    activeCheckIns: number
  }
  cloud: {
    connected: boolean
    lastPing?: string
    activeCheckIns: number
  }
}
