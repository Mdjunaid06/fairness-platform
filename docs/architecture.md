# System Architecture

## Overview
User (Browser)
│
▼
React Frontend (Vite + Firebase Hosting)
│ HTTPS REST
▼
Node.js Backend (Express + Cloud Run)
│              │              │
▼              ▼              ▼
Python AI      Firestore      Cloud Storage
Engine         (Reports)      (CSV Files)
(FastAPI +
Cloud Run)
│
▼
BigQuery + Vertex AI

## Request Flow

1. User uploads CSV → Cloud Storage
2. Backend calls AI Engine with GCS URI
3. AI Engine loads CSV → runs bias analysis
4. Results saved to Firestore
5. Frontend displays fairness score + charts

## Ports

| Service    | Local Port | Production        |
|------------|-----------|-------------------|
| Frontend   | 5173      | Firebase Hosting  |
| Backend    | 3001      | Cloud Run         |
| AI Engine  | 8000      | Cloud Run         |

## Google Technologies

| Tool              | Purpose                          |
|-------------------|----------------------------------|
| Firebase Auth     | Google Sign-In                   |
| Firestore         | Store analysis reports           |
| Cloud Storage     | Store uploaded CSV files         |
| BigQuery          | Aggregate bias analytics         |
| Vertex AI         | Deploy trained fair ML models    |
| Cloud Run         | Host backend + AI engine         |
| Firebase Hosting  | Host React frontend              |