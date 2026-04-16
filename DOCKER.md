# 🐳 Docker Setup — Video Reception Analyzer (VRA)

This document explains **everything you need** to build and run the entire VRA stack with Docker.

---

## Architecture

```
Browser
  └── Frontend  (Next.js)       → http://localhost:3000
        └── Backend (Node.js/Express + R) → http://localhost:3001
              └── Python MSSF Service (FastAPI) → http://localhost:8000
```

All three services run inside a private Docker network (`vra-net`) and share volumes for models, temp files, exports, logs, and data.

---

## Prerequisites

| Requirement | Minimum Version | Check command |
|-------------|-----------------|---------------|
| Docker Desktop | 24.x | `docker --version` |
| Docker Compose | v2.x (bundled with Docker Desktop) | `docker compose version` |

> **macOS / Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).  
> **Linux**: Install [Docker Engine + Compose plugin](https://docs.docker.com/engine/install/).

---

## Step-by-Step Setup

### 1 — Clone the repository

```bash
git clone https://github.com/Yash-Poddar-12/Video_Reception_Analyzer.git
cd Video_Reception_Analyzer
```

### 2 — Create your `.env` file

Copy the template and fill in your secrets:

```bash
cp .env.docker .env
```

Then open `.env` in your editor and replace the placeholder values:

| Variable | Where to get it |
|----------|----------------|
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → YouTube Data API v3 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com/) → Your App → API Keys |
| `CLERK_SECRET_KEY` | Same as above |

> **All other values** can be left as-is for a local Docker setup.

### 3 — Build all Docker images

```bash
docker compose build
```

> ⚠️ **First build takes 10–20 minutes** because it:
> - Installs R + all R packages in the backend image
> - Downloads PyTorch + HuggingFace Transformers in the Python image
> - Builds the Next.js production bundle in the frontend image
>
> Subsequent builds are fast thanks to Docker layer caching.

### 4 — Start all services

```bash
docker compose up -d
```

Docker will start the services in the correct order:
1. **Python** (MSSF inference) starts first
2. **Backend** (Node.js + R) waits for Python to be healthy
3. **Frontend** (Next.js) waits for Backend to be healthy

### 5 — Open the application

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 🔧 Backend API | http://localhost:3001 |
| 🐍 Python API | http://localhost:8000 |
| 📖 Python API Docs | http://localhost:8000/docs |

---

## Common Commands

### View running containers

```bash
docker compose ps
```

### Stream live logs (all services)

```bash
docker compose logs -f
```

### Stream logs from a single service

```bash
docker compose logs -f python     # Python MSSF service
docker compose logs -f backend    # Node.js + R backend
docker compose logs -f frontend   # Next.js frontend
```

### Stop all services

```bash
docker compose stop
```

### Stop AND remove containers (keeps volumes/images)

```bash
docker compose down
```

### Stop, remove containers AND volumes

```bash
docker compose down -v
```

### Restart a single service (e.g. after code change)

```bash
docker compose restart backend
```

### Rebuild a single service image

```bash
docker compose build backend
docker compose up -d backend
```

### Rebuild everything from scratch (no cache)

```bash
docker compose build --no-cache
docker compose up -d
```

---

## Health Checks

Each service exposes a health endpoint that Docker polls automatically:

| Service | Endpoint | Expected |
|---------|----------|---------|
| Python | `GET http://localhost:8000/health` | `{"status":"ok"}` or `{"status":"loading"}` |
| Backend | `GET http://localhost:3001/api/health` | `{"status":"ok"}` |
| Frontend | `GET http://localhost:3000` | HTTP 200 |

You can also manually check:

```bash
curl http://localhost:8000/health
curl http://localhost:3001/api/health
```

---

## Model Checkpoint (MSSF)

The trained model is **mounted as a volume** (not baked into the image), so it persists across container rebuilds.

### If you already have a trained checkpoint

Place it at:

```
models/
└── mssf_checkpoint/
    ├── model_meta.json
    ├── config.json
    ├── tokenizer_config.json
    ├── classifier_head.pt
    └── ...
```

The Python service will detect and load it automatically on startup.

### If you don't have a checkpoint yet

The service will fall back to the **base Twitter-RoBERTa** model (downloaded from HuggingFace on first run). You can train a fine-tuned checkpoint later:

```bash
# Run training inside the python container
docker compose exec python python python/train.py
```

---

## Volumes

All runtime data is persisted in local directories that are bind-mounted into the containers:

| Local path | Mounted at | Purpose |
|------------|-----------|---------|
| `./models` | `/app/models` | MSSF model checkpoint |
| `./tmp` | `/app/tmp` | Intermediate CSVs between pipeline steps |
| `./exports` | `/app/exports` | Dashboard export CSVs |
| `./logs` | `/app/logs` | Access logs |
| `./data` | `/app/data` | Raw + processed data |

These directories are created automatically if they don't exist.

---

## Troubleshooting

### Port already in use

```
Error: port is already allocated
```

Stop whatever is using the port locally, or change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3002:3001"   # map host 3002 → container 3001
```

### Frontend shows "Backend unreachable"

The browser calls the backend on `http://localhost:3001`. Make sure the backend container is running:

```bash
docker compose ps
docker compose logs backend
```

### Python service is slow to start

The first startup downloads the HuggingFace model (~500MB). Give it 2–5 minutes. Check progress:

```bash
docker compose logs -f python
```

### R packages fail to install during build

Try rebuilding with no cache and check for network issues:

```bash
docker compose build --no-cache backend
```

### Permission errors on volumes

On Linux, you may need to ensure the directories are writable:

```bash
chmod -R 777 tmp logs exports
```

---

## File Structure Added by Docker

```
vra/
├── docker-compose.yml        ← orchestrates all 3 services
├── .dockerignore             ← excludes node_modules, venv, etc.
├── .env.docker               ← environment template (copy → .env)
├── backend/
│   └── Dockerfile            ← Node.js + R runtime image
├── frontend/
│   └── Dockerfile            ← Next.js multi-stage image
└── python/
    └── Dockerfile            ← Python FastAPI image
```
