import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// Use cloud manager for Vercel deployment, local manager for development
const checkInManager = process.env.VERCEL 
  ? require('@/lib/checkin-manager-cloud').checkInManager
  : require('@/lib/checkin-manager').checkInManager

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checkIn = db.get(params.id)
    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }
    
    // Stop the process if    
    // Update status to cancelled
    db.update(params.id, { status: 'cancelled', error: 'Cancelled by user' })
    
    // Stop the process if running
    checkInManager.stopCheckIn(params.id)
    
    return NextResponse.json({ message: 'Check-in cancelled' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel check-in' }, { status: 500 })
  }
}
