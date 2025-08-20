# Deploy to Railway (Python + Cron Support)

Railway provides:
- Full Python runtime
- Cron job scheduling
- Persistent storage
- Real-time logs
- Zero downtime deployments

## Deployment Steps

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Deploy:
```bash
railway up
```

## Architecture

- **Web UI**: Next.js app on Vercel (for the dashboard)
- **Backend**: Python app on Railway (for actual check-ins)
- **Database**: PostgreSQL on Railway (for persistent storage)
- **Scheduler**: Railway cron jobs (for reliable execution)

The web UI communicates with the Railway backend via API.
