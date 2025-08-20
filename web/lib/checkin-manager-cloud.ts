import { CheckIn } from './types'
import { db } from './db'

// Cloud version that uses external API for check-in scheduling
class CloudCheckInManager {
  async scheduleCheckIn(
    confirmationNumber: string,
    firstName: string,
    lastName: string,
    source: 'nas' | 'cloud'
  ): Promise<CheckIn> {
    // Create check-in record
    const checkIn = db.create({
      confirmationNumber,
      firstName,
      lastName,
      status: 'pending',
      source,
    })
    
    // For cloud deployment, we'll use a different approach
    // Instead of spawning processes, we'll use scheduled functions
    if (source === 'cloud') {
      // Schedule check-in using Vercel cron or external service
      await this.scheduleCloudCheckIn(checkIn)
    } else {
      // For NAS, we'll make an API call to the NAS instance
      await this.scheduleNASCheckIn(checkIn)
    }
    
    return checkIn
  }
  
  private async scheduleCloudCheckIn(checkIn: CheckIn) {
    // Update status to scheduled
    db.update(checkIn.id, { status: 'scheduled' })
    
    // In a real implementation, this would:
    // 1. Calculate the check-in time (24 hours before flight)
    // 2. Schedule a job using Vercel Cron or an external service
    // 3. Store the job ID for tracking
    
    // For now, we'll simulate the scheduling
    setTimeout(() => {
      db.update(checkIn.id, { 
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    }, 1000)
  }
  
  private async scheduleNASCheckIn(checkIn: CheckIn) {
    try {
      // Make API call to NAS instance
      const nasUrl = process.env.NAS_API_URL || 'http://66.65.96.63:3001'
      const response = await fetch(`${nasUrl}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNumber: checkIn.confirmationNumber,
          firstName: checkIn.firstName,
          lastName: checkIn.lastName,
        })
      })
      
      if (response.ok) {
        db.update(checkIn.id, { status: 'scheduled' })
      } else {
        throw new Error('Failed to schedule on NAS')
      }
    } catch (error) {
      // If NAS fails, fall back to cloud
      console.error('NAS scheduling failed, falling back to cloud:', error)
      checkIn.source = 'cloud'
      db.update(checkIn.id, { source: 'cloud' })
      await this.scheduleCloudCheckIn(checkIn)
    }
  }
  
  stopCheckIn(id: string): boolean {
    const checkIn = db.get(id)
    if (checkIn) {
      db.update(id, { status: 'failed', error: 'Cancelled by user' })
      return true
    }
    return false
  }
  
  getActiveProcessCount(): number {
    return db.getActiveCheckIns().length
  }
}

export const checkInManager = new CloudCheckInManager()
