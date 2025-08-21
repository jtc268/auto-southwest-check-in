#!/usr/bin/env python3
"""
Simple Flask app for Southwest check-ins that can run on any Python cloud platform
"""
import os
import json
import subprocess
import threading
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage (use Redis/PostgreSQL in production)
check_ins = {}
check_in_lock = threading.Lock()

@app.route('/api/status', methods=['GET'])
def status():
    """Get system status"""
    return jsonify({
        'status': 'healthy',
        'activeCheckIns': len([c for c in check_ins.values() if c['status'] == 'scheduled']),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/checkins', methods=['GET'])
def list_checkins():
    """List all check-ins"""
    return jsonify(list(check_ins.values()))

@app.route('/api/checkins', methods=['POST'])
def create_checkin():
    """Create a new check-in"""
    data = request.json
    
    # Validate input
    required = ['confirmationNumber', 'firstName', 'lastName']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create check-in record
    checkin_id = str(int(datetime.now().timestamp() * 1000))
    check_in = {
        'id': checkin_id,
        'confirmationNumber': data['confirmationNumber'],
        'firstName': data['firstName'],
        'lastName': data['lastName'],
        'status': 'scheduled',
        'createdAt': datetime.now().isoformat(),
        'scheduledFor': (datetime.now() + timedelta(hours=24)).isoformat()
    }
    
    with check_in_lock:
        check_ins[checkin_id] = check_in
    
    # Schedule the actual check-in
    schedule_checkin(check_in)
    
    return jsonify({'checkIn': check_in})

@app.route('/api/checkins/<checkin_id>', methods=['DELETE'])
def cancel_checkin(checkin_id):
    """Cancel a check-in"""
    with check_in_lock:
        if checkin_id not in check_ins:
            return jsonify({'error': 'Check-in not found'}), 404
        
        check_ins[checkin_id]['status'] = 'cancelled'
        check_ins[checkin_id]['cancelledAt'] = datetime.now().isoformat()
    
    return jsonify({'message': 'Check-in cancelled'})

def schedule_checkin(check_in):
    """Schedule a check-in to run at the appropriate time"""
    def run_checkin():
        try:
            # Update status
            with check_in_lock:
                check_ins[check_in['id']]['status'] = 'checking-in'
            
            # Run the actual check-in script
            result = subprocess.run([
                'python3', 'southwest.py',
                check_in['confirmationNumber'],
                check_in['firstName'],
                check_in['lastName']
            ], capture_output=True, text=True, env={
                **os.environ,
                'AUTO_SOUTHWEST_CHECK_IN_CHECK_FARES': 'false'
            })
            
            # Update status based on result
            with check_in_lock:
                if result.returncode == 0:
                    check_ins[check_in['id']]['status'] = 'completed'
                    check_ins[check_in['id']]['completedAt'] = datetime.now().isoformat()
                    # Parse boarding position from output if available
                    if 'Boarding Position' in result.stdout:
                        check_ins[check_in['id']]['boardingPosition'] = 'A1'  # Parse actual position
                else:
                    check_ins[check_in['id']]['status'] = 'failed'
                    check_ins[check_in['id']]['error'] = result.stderr or 'Unknown error'
        
        except Exception as e:
            with check_in_lock:
                check_ins[check_in['id']]['status'] = 'failed'
                check_ins[check_in['id']]['error'] = str(e)
    
    # For demo, run immediately. In production, use a proper scheduler
    threading.Timer(5.0, run_checkin).start()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
