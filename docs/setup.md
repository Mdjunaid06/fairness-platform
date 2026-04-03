# Local Development Setup

## Prerequisites

| Tool       | Version  | Download                        |
|------------|----------|---------------------------------|
| Python     | 3.12.5   | https://python.org              |
| Node.js    | 20+      | https://nodejs.org              |
| Git        | Latest   | https://git-scm.com             |

## Quick Start (3 Terminals)

### Terminal 1 — AI Engine
```bash
cd ai_engine
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 — Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 3 — Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### ai_engine/.env
```env
GCP_PROJECT_ID=fairness-platform-98858
GCS_BUCKET_NAME=fairness-platform-uploads
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
OPENAI_API_KEY=your-key-here
```

### backend/.env
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
AI_ENGINE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=fairness-platform-98858
GCS_BUCKET_NAME=fairness-platform-uploads
GCS_KEY_FILE=./service-account-key.json
BIGQUERY_DATASET=bias_analytics
BIGQUERY_TABLE=analysis_results
GCP_PROJECT_ID=fairness-platform-98858
```

### frontend/.env.local
```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=fairness-platform-98858.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fairness-platform-98858
VITE_FIREBASE_STORAGE_BUCKET=fairness-platform-98858.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_BACKEND_URL=http://localhost:3001
```

## Verify Everything Works
```bash
# AI Engine
curl http://localhost:8000/health

# Backend  
curl http://localhost:3001/api/health

# Frontend
# Open http://localhost:5173
```