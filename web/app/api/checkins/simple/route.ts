import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for check-ins
const checkIns = new Map<string, any>()

export async function GET() {
  return NextResponse.json({ 
    checkIns: Array.from(checkIns.values()) 
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { confirmationNumber, firstName, lastName } = body
    
    if (!confirmationNumber || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const id = Date.now().toString()
    const checkIn = {
      id,
      confirmationNumber,
      firstName,
      lastName,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      // Schedule for 24 hours before flight (this would be calculated from actual flight time)
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    checkIns.set(id, checkIn)
    
    // In production, this would trigger a cron job or scheduled function
    // For now, we'll just store it
    
    return NextResponse.json({ checkIn })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id || !checkIns.has(id)) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  }
  
  checkIns.delete(id)
  return NextResponse.json({ message: 'Check-in cancelled' })
}
