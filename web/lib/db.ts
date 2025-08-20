// In-memory database for check-ins (in production, use a real database)
import { CheckIn } from './types'

class CheckInDatabase {
  private checkIns: Map<string, CheckIn> = new Map()
  
  getAll(): CheckIn[] {
    return Array.from(this.checkIns.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  
  get(id: string): CheckIn | undefined {
    return this.checkIns.get(id)
  }
  
  create(checkIn: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>): CheckIn {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    const newCheckIn: CheckIn = {
      ...checkIn,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.checkIns.set(id, newCheckIn)
    return newCheckIn
  }
  
  update(id: string, updates: Partial<CheckIn>): CheckIn | null {
    const checkIn = this.checkIns.get(id)
    if (!checkIn) return null
    
    const updated = {
      ...checkIn,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.checkIns.set(id, updated)
    return updated
  }
  
  getActiveCheckIns(): CheckIn[] {
    return this.getAll().filter(c => 
      ['pending', 'scheduled', 'checking-in'].includes(c.status)
    )
  }
}

export const db = new CheckInDatabase()
