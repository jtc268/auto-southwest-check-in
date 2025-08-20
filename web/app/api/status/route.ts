import { NextResponse } from 'next/server'
import { checkInManager } from '@/lib/checkin-manager'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const activeCheckIns = db.getActiveCheckIns()
    
    // For now, we'll simulate the status. Later we'll implement actual NAS connectivity
    const status = {
      nas: {
        connected: true, // Will implement actual NAS check
        lastPing: new Date().toISOString(),
        activeCheckIns: activeCheckIns.filter(c => c.source === 'nas').length
      },
      cloud: {
        connected: true,
        lastPing: new Date().toISOString(),
        activeCheckIns: activeCheckIns.filter(c => c.source === 'cloud').length
      }
    }
    
    return NextResponse.json({ status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
