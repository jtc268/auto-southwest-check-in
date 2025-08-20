// Integration test for Southwest Check-in Bot
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AUTH_COOKIE = 'southwest-auth=valid';

async function testIntegration() {
  console.log('🧪 Running integration tests...\n');
  
  try {
    // Test 1: API Status
    console.log('1️⃣ Testing API Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/status`);
    console.log('✅ Status:', statusResponse.data);
    
    // Test 2: List Check-ins
    console.log('\n2️⃣ Testing List Check-ins...');
    const listResponse = await axios.get(`${BASE_URL}/api/checkins`, {
      headers: { Cookie: AUTH_COOKIE }
    });
    console.log('✅ Check-ins:', listResponse.data.checkIns.length, 'found');
    
    // Test 3: Create Check-in
    console.log('\n3️⃣ Testing Create Check-in...');
    const createResponse = await axios.post(`${BASE_URL}/api/checkins`, {
      confirmationNumber: 'BJSXZC',
      firstName: 'Joseph',
      lastName: 'Cera'
    }, {
      headers: { 
        'Content-Type': 'application/json',
        Cookie: AUTH_COOKIE 
      }
    });
    console.log('✅ Created:', createResponse.data);
    const checkInId = createResponse.data.checkIn.id;
    
    // Test 4: Monitor Status Updates
    console.log('\n4️⃣ Monitoring status updates for 10 seconds...');
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const checkInsResponse = await axios.get(`${BASE_URL}/api/checkins`, {
        headers: { Cookie: AUTH_COOKIE }
      });
      const checkIn = checkInsResponse.data.checkIns.find(c => c.id === checkInId);
      console.log(`   Status: ${checkIn.status}, Scheduled: ${checkIn.scheduledTime || 'pending'}`);
    }
    
    // Test 5: Cancel Check-in
    console.log('\n5️⃣ Testing Cancel Check-in...');
    const cancelResponse = await axios.delete(`${BASE_URL}/api/checkins/${checkInId}`, {
      headers: { Cookie: AUTH_COOKIE }
    });
    console.log('✅ Cancelled:', cancelResponse.data);
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testIntegration();
