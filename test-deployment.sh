#!/bin/bash

echo "🧪 Testing Southwest Check-in Bot Deployment..."

# Test local deployment
echo -e "\n📍 Testing Local Deployment..."
LOCAL_STATUS=$(curl -s http://localhost:3000/api/status)
if [[ $LOCAL_STATUS == *"connected"* ]]; then
    echo "✅ Local API is working"
else
    echo "❌ Local API failed"
fi

# Test check-in creation locally
echo -e "\n📝 Testing Local Check-in Creation..."
LOCAL_CHECKIN=$(curl -s -X POST http://localhost:3000/api/checkins \
  -H "Content-Type: application/json" \
  -H "Cookie: southwest-auth=valid" \
  -d '{"confirmationNumber":"TEST123","firstName":"Test","lastName":"User"}')
echo "Response: $LOCAL_CHECKIN"

# Test NAS deployment (when deployed)
echo -e "\n🖥️  Testing NAS Deployment..."
NAS_STATUS=$(curl -s http://66.65.96.63:3000/api/status 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ NAS API is reachable"
    echo "Response: $NAS_STATUS"
else
    echo "❌ NAS API is not reachable (not deployed yet)"
fi

# Test Python script directly
echo -e "\n🐍 Testing Python Script..."
cd /Users/husky/auto-southwest-check-in
python3 southwest.py --help
if [[ $? -eq 0 ]]; then
    echo "✅ Python script is working"
else
    echo "❌ Python script failed"
fi

echo -e "\n✨ Testing complete!"
