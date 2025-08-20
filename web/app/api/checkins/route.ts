import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// Use cloud manager for Vercel deployment, local manager for development
const checkInManager = process.env.VERCEL 
  ? require('@/lib/checkin-manager-cloud').checkInManager
  : require('@/lib/checkin-manager').checkInManager

export async function GET() {
  try {
    const checkIns = db.getAll()
    return NextResponse.json({ checkIns })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { confirmationNumber, firstName, lastName } = await request.json()
    
    // Validate input
    if (!confirmationNumber || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate confirmation number format (6 characters, alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(confirmationNumber.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid confirmation number format. Must be 6 alphanumeric characters.' },
        { status: 400 }
      )
    }
    
    // Check if already scheduled
    const existing = db.getActiveCheckIns().find(
      c => c.confirmationNumber === confirmationNumber.toUpperCase()
    )
    
    if (existing) {
      return NextResponse.json(
        { error: 'This confirmation number is already scheduled for check-in' },
        { status: 400 }
      )
    }
    
    // Try NAS first, then cloud
    const checkIn = await checkInManager.scheduleCheckIn(
      confirmationNumber.toUpperCase(),
      firstName,
      lastName,
      'nas' // Will implement NAS/cloud logic later
    )
    
    return NextResponse.json({ checkIn })
  } catch (error) {
    console.error('Error scheduling check-in:', error)
    return NextResponse.json(
      { error: 'Failed to schedule check-in' },
      { status: 500 }
    )
  }
}
