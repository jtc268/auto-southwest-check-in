#!/bin/bash

# Southwest Check-in NAS Deployment Script

echo "🐄 Deploying Southwest Cattle Call Eliminator to NAS..."

# Configuration
NAS_HOST="66.65.96.63"
NAS_USER="husky"
NAS_PATH="/volume1/docker/southwest-checkin"

# Build the Docker image locally
echo "Building Docker image..."
docker build -f Dockerfile.web -t southwest-checkin-web .

# Save the image
echo "Saving Docker image..."
docker save southwest-checkin-web:latest | gzip > southwest-checkin-web.tar.gz

# Copy files to NAS
echo "Copying files to NAS..."
ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_PATH"
scp southwest-checkin-web.tar.gz $NAS_USER@$NAS_HOST:$NAS_PATH/
scp docker-compose.yml $NAS_USER@$NAS_HOST:$NAS_PATH/

# Deploy on NAS
echo "Deploying on NAS..."
ssh $NAS_USER@$NAS_HOST << 'EOF'
cd /volume1/docker/southwest-checkin
echo "Loading Docker image..."
docker load < southwest-checkin-web.tar.gz
echo "Starting containers..."
docker-compose down
docker-compose up -d
echo "Cleaning up..."
rm southwest-checkin-web.tar.gz
echo "Deployment complete!"
docker-compose ps
EOF

# Clean up local files
rm southwest-checkin-web.tar.gz

echo "✅ Deployment to NAS complete!"
echo "Access the web UI at: http://$NAS_HOST:3000"
