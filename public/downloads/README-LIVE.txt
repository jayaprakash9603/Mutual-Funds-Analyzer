Analyzer LIVE Docker — quick steps
=================================

1. Install Docker Desktop and start it.
2. Unzip this pack into an empty folder.
3. Rename env.example to .env
4. Open PowerShell in that folder. Run:

   docker compose -f docker-compose.live.yml pull
   docker compose -f docker-compose.live.yml up -d

5. Open http://localhost:8088  (live UI — not demo)

Stop later:
   docker compose -f docker-compose.live.yml down

Images: jayaprakash9603/mfa-backend + mfa-frontend (tag in .env)
