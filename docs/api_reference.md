# API Reference

## AI Engine (Port 8000)

### GET /health
Health check endpoint.

**Response:**
```json
{"status": "ok", "service": "ai-engine"}
```

### POST /analyze/dataset
Analyze a CSV dataset for bias.

**Request:**
```json
{
  "gcs_uri": "gs://bucket/file.csv",
  "target_column": "loan_approved",
  "sensitive_features": ["gender", "race"]
}
```

**Response:**
```json
{
  "dataset_info": {...},
  "class_imbalance": {...},
  "proxy_features": {...},
  "bias_summary": [...],
  "overall_score": {
    "score": 72,
    "label": "Moderately Fair",
    "color": "#f59e0b"
  }
}
```

### POST /analyze/model
Audit ML model fairness metrics.

**Request:**
```json
{
  "gcs_uri": "gs://bucket/file.csv",
  "target_column": "label",
  "sensitive_features": ["gender"]
}
```

### POST /analyze/llm
Test LLM outputs for bias.

**Request:**
```json
{
  "provider": "openai",
  "model_name": "gpt-4",
  "test_suite": "hiring"
}
```

### POST /mitigate
Apply bias mitigation strategy.

**Request:**
```json
{
  "gcs_uri": "gs://bucket/file.csv",
  "target_column": "label",
  "sensitive_features": ["gender"],
  "strategy": "resample"
}
```

---

## Backend API (Port 3001)

All routes except `/api/health` require Firebase Auth token in header:

### GET /api/health
Health check.

### POST /api/dataset/upload
Upload CSV file to Cloud Storage.

### POST /api/dataset/analyze
Trigger bias analysis on uploaded file.

### POST /api/dataset/mitigate
Apply mitigation to dataset.

### POST /api/model/audit
Audit ML model fairness.

### POST /api/llm/test
Test LLM for bias.

### GET /api/reports
Get all reports for logged-in user.

### GET /api/reports/:id
Get single report by ID.