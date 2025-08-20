# Southwest Check-in Bot Deployment Guide

## Overview
The Southwest check-in bot has been successfully deployed with redundancy across NAS and cloud (Vercel).

## Deployment URLs
- **Local Development**: http://localhost:3001
- **Vercel Production**: https://southwest-checkin-mushroqeg-huskys-projects-b729d9dc.vercel.app
- **NAS Deployment**: http://66.65.96.63:3000 (via Docker)

## Credentials
- **Web UI Password**: cheesecake
- **Test Credentials**: Joseph Cera, confirmation BJSXZC

## Deployment Instructions

### 1. Local Development
```bash
cd web
npm install
npm run dev
```

### 2. NAS Deployment
```bash
# Run the deployment script
./deploy-nas.sh
```

### 3. Vercel Deployment
```bash
cd web
npx vercel --prod
```

## Testing
Run the integration tests:
```bash
cd web
node test-integration.js
```

Run the deployment test:
```bash
./test-deployment.sh
```

## Features
- ✅ Fare checking disabled by default
- ✅ Password-protected web UI
- ✅ Real-time monitoring of check-ins
- ✅ NAS/cloud redundancy
- ✅ Historical check-in records
- ✅ Process status tracking
- ✅ Automatic check-in scheduling

## Architecture
- **Web UI**: Next.js 14 with TypeScript
- **Backend**: Python check-in script
- **Database**: In-memory (for now)
- **Deployment**: Docker for NAS, Vercel for cloud
