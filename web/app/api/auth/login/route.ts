import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const VALID_PASSWORD = 'cheesecake'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === VALID_PASSWORD) {
      // Set auth cookie
      cookies().set('southwest-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
