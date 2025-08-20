import { spawn, ChildProcess } from 'child_process'
import { CheckIn } from './types'
import { db } from './db'
import path from 'path'

class CheckInManager {
  private processes: Map<string, ChildProcess> = new Map()
  private scriptPath: string
  
  constructor() {
    // Path to the main southwest.py script
    // In production/Docker, the script is in the parent directory
    // In development, it's two directories up
    // Determine script path based on environment
    if (process.env.NODE_ENV === 'production') {
      // In production (Docker), the script is in the parent directory
      this.scriptPath = '/app/southwest.py'
    } else {
      // In development, use absolute path
      this.scriptPath = '/Users/husky/auto-southwest-check-in/southwest.py'
    }
  }
  
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
    
    // Start the check-in process
    this.startCheckInProcess(checkIn)
    
    return checkIn
  }
  
  private startCheckInProcess(checkIn: CheckIn) {
    try {
      // Spawn the Python process
      const pythonProcess = spawn('python3', [
        this.scriptPath,
        checkIn.confirmationNumber,
        checkIn.firstName,
        checkIn.lastName
      ], {
        cwd: path.dirname(this.scriptPath),
        env: {
          ...process.env,
          AUTO_SOUTHWEST_CHECK_IN_CHECK_FARES: 'false'
        }
      })
      
      this.processes.set(checkIn.id, pythonProcess)
      
      // Update status to scheduled
      db.update(checkIn.id, { status: 'scheduled' })
      
      // Handle process output
      pythonProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log(`[${checkIn.id}] ${output}`)
        
        // Parse output for status updates
        if (output.includes('Successfully scheduled')) {
          const timeMatch = output.match(/at (.+?) \(/);
          if (timeMatch) {
            db.update(checkIn.id, { 
              scheduledTime: timeMatch[1],
              status: 'scheduled'
            })
          }
        } else if (output.includes('Checking in...')) {
          db.update(checkIn.id, { status: 'checking-in' })
        } else if (output.includes('Successfully checked in')) {
          const positionMatch = output.match(/Position: ([A-C]\d+)/);
          db.update(checkIn.id, { 
            status: 'completed',
            checkInTime: new Date().toISOString(),
            boardingPosition: positionMatch ? positionMatch[1] : undefined
          })
        }
      })
      
      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error(`[${checkIn.id}] Error: ${data}`)
      })
      
      pythonProcess.on('error', (error) => {
        db.update(checkIn.id, { 
          status: 'failed',
          error: error.message
        })
        this.processes.delete(checkIn.id)
      })
      
      pythonProcess.on('exit', (code) => {
        if (code !== 0) {
          db.update(checkIn.id, { 
            status: 'failed',
            error: `Process exited with code ${code}`
          })
        }
        this.processes.delete(checkIn.id)
      })
      
    } catch (error) {
      db.update(checkIn.id, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  stopCheckIn(id: string): boolean {
    const process = this.processes.get(id)
    if (process) {
      process.kill()
      this.processes.delete(id)
      db.update(id, { status: 'failed', error: 'Cancelled by user' })
      return true
    }
    return false
  }
  
  getActiveProcessCount(): number {
    return this.processes.size
  }
}

export const checkInManager = new CheckInManager()
