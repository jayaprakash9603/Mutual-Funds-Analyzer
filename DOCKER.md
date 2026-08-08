# Docker install & run — Analyzer (live data)

Use this when the **demo** site shows *“Switch to live Analyzer data”* and you want the real API stack in Docker.

Demo (`npm run dev:demo` / Cloudflare demo) always uses captured fixtures.  
**Live Docker** serves a `build:live` front end that calls the Spring Boot API (nginx proxies `/api` → backend).

---

## What you get

| Service   | Image (same tag)                         | Host URL                    |
|-----------|------------------------------------------|-----------------------------|
| Frontend  | `jayaprakash9603/mfa-frontend:1.0.3`     | http://localhost:8088       |
| Backend   | `jayaprakash9603/mfa-backend:1.0.3`      | http://localhost:8080       |
| MySQL     | `mysql:8.4`                              | localhost:3306              |

Both app images always share the same `MFA_VERSION` tag (and `latest`).

---

## Files you need

### A) Run from this repo (recommended)

Clone or download the project, then you only need these at the root:

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](./docker-compose.yml) | Builds/runs mysql + backend + frontend |
| [`docker-compose.hub.yml`](./docker-compose.hub.yml) | **Pull-only** stack (no local Maven/npm build) |
| [`.env.example`](./.env.example) | Copy to `.env` for ports / password / version |
| [`Dockerfile`](./Dockerfile) | Frontend image (nginx + `dist/`) |
| [`backend/Dockerfile`](./backend/Dockerfile) | Backend image (JRE + JAR) |
| [`deploy/nginx.conf`](./deploy/nginx.conf) | Proxies `/api` → backend |
| [`scripts/build-docker-images.ps1`](./scripts/build-docker-images.ps1) | Builds JAR + live UI, then images |

Optional TLS trust for corporate proxies: folder [`deploy/certs/`](./deploy/certs/) (see README there).

### B) Pull-only (no source build) — download the pack

From the demo app: **Download Docker pack** → `mfa-live-docker.zip`

Or from the repo / site:

| File | Purpose |
|------|---------|
| [`public/downloads/mfa-live-docker.zip`](./public/downloads/mfa-live-docker.zip) | Zip: compose + env + short README |
| [`docker-compose.live.yml`](./docker-compose.live.yml) | Same compose at repo root |
| [`.env.example`](./.env.example) | Rename/copy to `.env` (`MFA_VERSION=1.0.3`) |

No project clone required. Unzip into any empty folder, then follow Option 2 below.

---

## Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Compose v2 (Linux).
2. Start Docker Desktop and wait until it is **Running**.
3. Open a terminal in the project root  
   (`Mutual funds Analyzer` / `Mutual-Funds-Analyzer`).

---

## Option 1 — Build images locally (same tag), then run

Use this on a machine with **JDK 17 + Maven** and **Node 20+**.

```powershell
# 1) Env
copy .env.example .env
# Edit .env if you want: MFA_VERSION=1.0.3

# 2) Build host artifacts + Docker images (backend + frontend, same tag)
npm run docker:images
# or with an explicit version:
# powershell -File scripts/build-docker-images.ps1 -Version 1.0.3

# 3) Start the stack
docker compose up -d

# 4) Check health
docker compose ps
```

Open the **live** app: **http://localhost:8088**  
(API docs / health: http://localhost:8080 )

Stop:

```powershell
docker compose down
# wipe MySQL volume as well:
# docker compose down -v
```

Push both tags to Docker Hub (after `docker login`):

```powershell
npm run docker:push
# or: powershell -File scripts/build-docker-images.ps1 -Version 1.0.3 -Push
```

---

## Option 2 — Pull pre-built images (no Maven/npm)

Download **`docker-compose.live.yml`** and **`.env.example`** from the repo root.

```powershell
# In the folder where you saved the files
copy .env.example .env
# Ensure MFA_VERSION=1.0.3

docker compose -f docker-compose.live.yml pull
docker compose -f docker-compose.live.yml up -d
```

Open **http://localhost:8088** (live Analyzer — not demo fixtures)

Docker Hub images:

- https://hub.docker.com/r/jayaprakash9603/mfa-backend
- https://hub.docker.com/r/jayaprakash9603/mfa-frontend

---

## Option 3 — Backend only in Docker

If you only want the API (and will run the live Vite client yourself):

```powershell
copy .env.example .env
docker compose up -d mysql backend
```

Then in another terminal (live front end, not demo):

```powershell
npm ci
npm run dev:client
```

Open http://localhost:5173 — it will talk to http://localhost:8080 (or configure Backend URL in the navbar settings if needed).

---

## Demo vs Docker live (important)

| How you start | Data source | URL |
|---------------|-------------|-----|
| `npm run dev:demo` | Captured fixtures in `public/demo/` | http://localhost:5173 |
| `docker compose up` | Live Spring Boot + MySQL | http://localhost:8088 |
| `npm run dev` | Live API on :8080 | http://localhost:5173 |

The dialog *“Switch to live Analyzer data”* appears only on the **demo** build. Closing it does not turn demo into live — start Docker (or `npm run dev`) instead.

---

## Useful commands

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker images "jayaprakash9603/mfa-*"
docker compose ps
curl.exe http://localhost:8080/api/features
curl.exe http://localhost:8088/healthz
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 8088 / 8080 / 3306 in use | Change `FRONTEND_PUBLISH_PORT`, `BACKEND_PUBLISH_PORT`, or `MYSQL_PUBLISH_PORT` in `.env` |
| Frontend up but API fails | Wait until `mfa-backend` is **healthy** (`docker compose ps`) |
| `backend/docker/app.jar` missing | Run `npm run docker:images` (or Maven package + copy JAR) before `docker compose build` |
| `dist/` missing | Run `npm run build:live` before building the frontend image |
| Corporate HTTPS / mfapi PKIX errors | Add CA `.crt` files under `deploy/certs/` (mounted read-only into backend) |
| Still seeing demo fixtures | You are on `dev:demo`. Use http://localhost:8088 after `docker compose up` |

---

## Version tag convention

Always tag **both** images the same:

```text
jayaprakash9603/mfa-backend:1.0.3
jayaprakash9603/mfa-frontend:1.0.3
jayaprakash9603/mfa-backend:latest
jayaprakash9603/mfa-frontend:latest
```

Set once in `.env`:

```env
MFA_VERSION=1.0.3
```
