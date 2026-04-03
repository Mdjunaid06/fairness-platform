# — Universal AI Fairness & Bias Detection Platform
### Google Solution Challenge 2026 — Complete Setup, Integration & Continuation Guide

---

## 📌 READ THIS FIRST 

| Member | Work Done | Status |
|--------|-----------|--------|
| Member 1 | Complete AI Engine (Python/FastAPI) | 100% Done, Running |
| Member 2 | Backend (Node.js + Express) | ⏳ Not Started |
| Member 3 | Frontend (React) | ⏳ Not Started |
| Member 4 | Google Cloud Integration + Deployment | ⏳ Not Started |

---

## 🗂️ EXACT FOLDER STRUCTURE (Current State)

```
fairness-platform/
│
├── .gitignore                          ✅ Done
├── .env.example                        ✅ Done
├── docker-compose.yml                  ✅ Done
├── README.md                           ✅ Done
│
├── ai_engine/                          ✅ 100% COMPLETE — DO NOT TOUCH
│   ├── venv/                           (Python virtual environment — never commit)
│   ├── bias_detection/
│   │   ├── __init__.py
│   │   ├── metrics.py                  ✅ Fairness metrics (DPD, DIR, EOD, EO)
│   │   ├── dataset_analyzer.py         ✅ CSV bias detection
│   │   ├── model_auditor.py            ✅ ML model fairness audit
│   │   └── llm_tester.py              ✅ LLM bias test suites
│   ├── mitigation/
│   │   ├── __init__.py
│   │   ├── resampler.py               ✅ SMOTE rebalancing
│   │   └── feature_remover.py         ✅ Proxy feature removal
│   ├── explainability/
│   │   ├── __init__.py
│   │   └── bias_reporter.py           ✅ Human-readable reports
│   ├── models/
│   │   └── __init__.py
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_metrics.py            ✅ Passing tests
│   ├── app.py                          ✅ FastAPI entry point
│   ├── requirements.txt               ✅ Fixed for Python 3.12.5
│   ├── Dockerfile                      ✅ Ready
│   └── .env                            ✅ Template ready (2 keys pending — see below)
│
├── backend/                            ⏳ Member 2 builds this
│   ├── config/
│   │   ├── firebase.js
│   │   ├── gcs.js
│   │   └── bigquery.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dataset.js
│   │   ├── model.js
│   │   ├── llm.js
│   │   └── reports.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── datasetController.js
│   │   ├── modelController.js
│   │   ├── llmController.js
│   │   └── reportController.js
│   ├── utils/
│   │   ├── gcsUpload.js
│   │   ├── aiEngineClient.js
│   │   └── bigQueryUtils.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
└── frontend/                           ⏳ Member 3 builds this
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── DatasetAnalysis.jsx
    │   │   ├── LLMBias.jsx
    │   │   └── Reports.jsx
    │   ├── services/
    │   │   ├── firebase.js
    │   │   └── api.js
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── App.jsx
    │   └── index.js
    ├── package.json
    └── .env.local
```

---

## ✅ SECTION 1 — AI ENGINE (ALREADY DONE)

### What is it?
The AI Engine is a **Python FastAPI server** that runs on port `8000`. It is the brain of the entire platform. The backend calls this service to do all the heavy lifting — detecting bias, running fairness metrics, testing LLMs, and mitigating bias.

### How to Run It (already has this running)

```bash
# Step 1 — Go to ai_engine folder
cd fairness-platform/ai_engine

# Step 2 — Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Step 3 — Start the server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

You will see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Test it is working

```bash
# Windows PowerShell:
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","service":"ai-engine"}
```

### API Endpoints the Backend Will Call

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/analyze/dataset` | Analyze CSV for bias |
| POST | `/analyze/model` | Audit ML model fairness |
| POST | `/analyze/llm` | Test LLM for bias |
| POST | `/mitigate` | Apply bias mitigation |

### What Each File Does

| File | Purpose |
|------|---------|
| `app.py` | FastAPI server, defines all routes, accepts JSON requests |
| `bias_detection/metrics.py` | Core math: Demographic Parity, Disparate Impact, Equal Opportunity, Equalized Odds |
| `bias_detection/dataset_analyzer.py` | Loads CSV from Google Cloud Storage, detects class imbalance, proxy features, demographic skew |
| `bias_detection/model_auditor.py` | Trains a RandomForest on the data, then measures fairness of predictions |
| `bias_detection/llm_tester.py` | Sends prompts with demographic variants to OpenAI/Gemini, measures sentiment disparity |
| `mitigation/resampler.py` | Applies SMOTE oversampling + undersampling to balance dataset |
| `mitigation/feature_remover.py` | Removes sensitive columns and proxy features (high-correlation features) |
| `explainability/bias_reporter.py` | Formats results into human-readable report |
| `tests/test_metrics.py` | Unit tests for fairness metrics |

### The .env File — 2 Keys Left Unfilled

Location: `ai_engine/.env`

```env
GCP_PROJECT_ID=your-project-id          ← Fill this with your GCP project ID
GCS_BUCKET_NAME=fairness-platform-uploads  ← Fill after creating GCS bucket
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json  ← Fill after downloading service account key
OPENAI_API_KEY=your-openai-key          ← Already can be filled from platform.openai.com
```

**When do you need these?**
- `GCP_PROJECT_ID` — needed when testing dataset analysis (reads CSV from GCS)
- `GCS_BUCKET_NAME` — needed when uploading files
- `GOOGLE_APPLICATION_CREDENTIALS` — needed for all Google Cloud operations
- For now, the `/health` endpoint and basic LLM testing with OpenAI work WITHOUT these

**How to get them (Member 4's job):**
1. Create GCP project → get `GCP_PROJECT_ID`
2. Create GCS bucket → get `GCS_BUCKET_NAME`
3. Create service account → download JSON key → put path in `GOOGLE_APPLICATION_CREDENTIALS`

---

## 🟢 SECTION 2 — BACKEND (Member 2)

### What is it?
Node.js + Express API server running on port `3001`. It sits between the React frontend and the Python AI Engine. It handles authentication, file uploads, and routes requests to the right place.

### Prerequisites

```bash
# Install Node.js 20+ from https://nodejs.org
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

### Step 1 — Setup

```bash
cd fairness-platform
mkdir backend
cd backend
npm init -y
```

### Step 2 — Install All Dependencies

```bash
npm install express cors dotenv multer axios
npm install firebase-admin @google-cloud/storage @google-cloud/bigquery
npm install morgan helmet
npm install --save-dev nodemon
```

### Step 3 — Update package.json scripts

Open `backend/package.json` and make sure scripts section looks like this:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 4 — Create Folder Structure

```bash
# Run these from inside backend/ folder
mkdir config
mkdir routes
mkdir middleware
mkdir controllers
mkdir utils
```

### Step 5 — Create ALL Files

---

#### FILE: `backend/.env`

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000

FIREBASE_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=fairness-platform-uploads
GCS_KEY_FILE=./service-account-key.json

BIGQUERY_DATASET=bias_analytics
BIGQUERY_TABLE=analysis_results
GCP_PROJECT_ID=your-project-id
```

---

#### FILE: `backend/server.js`

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const datasetRoutes = require("./routes/dataset");
const modelRoutes = require("./routes/model");
const llmRoutes = require("./routes/llm");
const reportRoutes = require("./routes/reports");
const { errorHandler } = require("./middleware/errorHandler");
const { authMiddleware } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dataset", authMiddleware, datasetRoutes);
app.use("/api/model", authMiddleware, modelRoutes);
app.use("/api/llm", authMiddleware, llmRoutes);
app.use("/api/reports", authMiddleware, reportRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

module.exports = app;
```

---

#### FILE: `backend/config/firebase.js`

```javascript
const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(process.env.GCS_KEY_FILE || "./service-account-key.json")
    ),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

module.exports = admin;
```

---

#### FILE: `backend/config/gcs.js`

```javascript
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE,
});

module.exports = storage;
```

---

#### FILE: `backend/config/bigquery.js`

```javascript
const { BigQuery } = require("@google-cloud/bigquery");

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
});

module.exports = bigquery;
```

---

#### FILE: `backend/middleware/authMiddleware.js`

```javascript
const admin = require("../config/firebase");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = { authMiddleware };
```

---

#### FILE: `backend/middleware/errorHandler.js`

```javascript
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = { errorHandler };
```

---

#### FILE: `backend/utils/aiEngineClient.js`

```javascript
const axios = require("axios");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:8000";

const callAIEngine = async (endpoint, data) => {
  try {
    const response = await axios.post(
      `${AI_ENGINE_URL}${endpoint}`,
      data,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw new Error(`AI Engine error: ${msg}`);
  }
};

module.exports = { callAIEngine };
```

---

#### FILE: `backend/utils/gcsUpload.js`

```javascript
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({ keyFilename: process.env.GCS_KEY_FILE });
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

const uploadToGCS = async (buffer, destination, contentType) => {
  const bucket = storage.bucket(BUCKET_NAME);
  const blob = bucket.file(destination);
  await blob.save(buffer, {
    contentType,
    metadata: { cacheControl: "no-cache" },
  });
  return `gs://${BUCKET_NAME}/${destination}`;
};

module.exports = { uploadToGCS };
```

---

#### FILE: `backend/utils/bigQueryUtils.js`

```javascript
const bigquery = require("../config/bigquery");

const DATASET = process.env.BIGQUERY_DATASET;
const TABLE = process.env.BIGQUERY_TABLE;

const logAnalysisResult = async (reportData) => {
  const rows = [{
    report_id: reportData.reportId,
    user_id: reportData.userId,
    analysis_type: reportData.type,
    fairness_score: reportData.score || 0,
    timestamp: new Date().toISOString(),
    dataset_rows: reportData.rows || 0,
    bias_issues: reportData.issueCount || 0,
  }];
  await bigquery.dataset(DATASET).table(TABLE).insert(rows);
};

module.exports = { logAnalysisResult };
```

---

#### FILE: `backend/routes/auth.js`

```javascript
const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");

router.post("/verify", async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    res.json({ uid: decoded.uid, email: decoded.email });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
```

---

#### FILE: `backend/routes/dataset.js`

```javascript
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadDataset,
  analyzeDataset,
  mitigateDataset
} = require("../controllers/datasetController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), uploadDataset);
router.post("/analyze", analyzeDataset);
router.post("/mitigate", mitigateDataset);

module.exports = router;
```

---

#### FILE: `backend/routes/model.js`

```javascript
const express = require("express");
const router = express.Router();
const { auditModel } = require("../controllers/modelController");

router.post("/audit", auditModel);

module.exports = router;
```

---

#### FILE: `backend/routes/llm.js`

```javascript
const express = require("express");
const router = express.Router();
const { testLLMBias } = require("../controllers/llmController");

router.post("/test", testLLMBias);

module.exports = router;
```

---

#### FILE: `backend/routes/reports.js`

```javascript
const express = require("express");
const router = express.Router();
const { getReports, getReport } = require("../controllers/reportController");

router.get("/", getReports);
router.get("/:id", getReport);

module.exports = router;
```

---

#### FILE: `backend/controllers/datasetController.js`

```javascript
const { uploadToGCS } = require("../utils/gcsUpload");
const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userId = req.user.uid;
    const fileName = `${userId}/${Date.now()}_${req.file.originalname}`;
    const gcsUri = await uploadToGCS(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );
    const docRef = await db.collection("uploads").add({
      userId,
      fileName: req.file.originalname,
      gcsUri,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "uploaded",
    });
    res.json({ uploadId: docRef.id, gcsUri, message: "Uploaded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, uploadId } = req.body;
    if (!gcsUri || !targetColumn || !sensitiveFeatures) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const analysisResult = await callAIEngine("/analyze/dataset", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
    });
    const reportRef = await db.collection("reports").add({
      userId: req.user.uid,
      uploadId: uploadId || null,
      type: "dataset",
      gcsUri,
      result: analysisResult,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ reportId: reportRef.id, analysis: analysisResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mitigateDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, strategy } = req.body;
    const result = await callAIEngine("/mitigate", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
      strategy: strategy || "resample",
    });
    await db.collection("mitigations").add({
      userId: req.user.uid,
      originalGcsUri: gcsUri,
      strategy,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ mitigation: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

#### FILE: `backend/controllers/modelController.js`

```javascript
const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.auditModel = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures } = req.body;
    if (!gcsUri || !targetColumn || !sensitiveFeatures) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await callAIEngine("/analyze/model", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
    });
    await db.collection("reports").add({
      userId: req.user.uid,
      type: "model",
      gcsUri,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

#### FILE: `backend/controllers/llmController.js`

```javascript
const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.testLLMBias = async (req, res) => {
  try {
    const { provider, modelName, testSuite, customPrompts } = req.body;
    if (!provider || !modelName) {
      return res.status(400).json({ error: "provider and modelName required" });
    }
    const result = await callAIEngine("/analyze/llm", {
      provider,
      model_name: modelName,
      test_suite: testSuite || "default",
      custom_prompts: customPrompts || [],
    });
    await db.collection("reports").add({
      userId: req.user.uid,
      type: "llm",
      provider,
      modelName,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

#### FILE: `backend/controllers/reportController.js`

```javascript
const admin = require("../config/firebase");

const db = admin.firestore();

exports.getReports = async (req, res) => {
  try {
    const snapshot = await db
      .collection("reports")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const doc = await db.collection("reports").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

#### FILE: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

---

### Step 6 — Run the Backend

```bash
cd backend
npm run dev
```

Expected output:
```
✅ Backend running at http://localhost:3001
```

Test it:
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","service":"backend","timestamp":"..."}
```

---

## ⚛️ SECTION 3 — FRONTEND (Member 3)

### What is it?
React application running on port `3000`. Users interact with this — they upload CSVs, see fairness scores, test LLMs, and view reports. It calls the backend API which calls the AI engine.

### Prerequisites

```bash
# Install Node.js 20+ from https://nodejs.org
node --version   # Should show v20.x.x
```

### Step 1 — Create React App

```bash
cd fairness-platform
npx create-react-app frontend
cd frontend
```

### Step 2 — Install Dependencies

```bash
npm install axios recharts react-router-dom
npm install firebase
npm install react-dropzone react-hot-toast
npm install lucide-react
```

### Step 3 — Create .env.local

Create file `frontend/.env.local` with this content:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_BACKEND_URL=http://localhost:3001
```

You get these values from Firebase Console → Project Settings → Your apps → Web app config.

### Step 4 — Create Folder Structure

```bash
mkdir src\components
mkdir src\pages
mkdir src\services
mkdir src\hooks
mkdir src\utils
```

### Step 5 — Create ALL Files

---

#### FILE: `frontend/src/services/firebase.js`

```javascript
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
```

---

#### FILE: `frontend/src/services/api.js`

```javascript
import axios from "axios";
import { auth } from "./firebase";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const apiClient = axios.create({ baseURL: BASE_URL });

// Attach Firebase token to every request automatically
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/api/dataset/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const analyzeDataset = (payload) =>
  apiClient.post("/api/dataset/analyze", payload);

export const mitigateDataset = (payload) =>
  apiClient.post("/api/dataset/mitigate", payload);

export const auditModel = (payload) =>
  apiClient.post("/api/model/audit", payload);

export const testLLMBias = (payload) =>
  apiClient.post("/api/llm/test", payload);

export const getReports = () => apiClient.get("/api/reports");

export const getReport = (id) => apiClient.get(`/api/reports/${id}`);
```

---

#### FILE: `frontend/src/hooks/useAuth.js`

```javascript
import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
};
```

---

#### FILE: `frontend/src/pages/Login.jsx`

```jsx
import React from "react";
import { signInWithGoogle } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "24px",
      background: "#f9fafb"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
          ⚖️ AI Fairness Platform
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px", maxWidth: "400px" }}>
          Detect, explain, and mitigate bias in datasets,
          ML models, and LLM outputs.
        </p>
      </div>
      <button
        onClick={handleLogin}
        style={{
          padding: "12px 32px",
          background: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "500"
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
```

---

#### FILE: `frontend/src/pages/Dashboard.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getReports } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, avgScore: 0, biased: 0 });
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getReports()
      .then((res) => {
        const data = res.data.reports || [];
        setReports(data);
        if (data.length > 0) {
          const scores = data.map((r) => r.result?.overall_score?.score || 0);
          setStats({
            total: data.length,
            avgScore: Math.round(
              scores.reduce((a, b) => a + b, 0) / scores.length
            ),
            biased: data.filter(
              (r) => (r.result?.overall_score?.score || 100) < 60
            ).length,
          });
        }
      })
      .catch(console.error);
  }, []);

  const kpis = [
    { label: "Total Analyses", value: stats.total },
    { label: "Avg Fairness Score", value: `${stats.avgScore}/100` },
    { label: "Biased Reports", value: stats.biased },
  ];

  const actions = [
    { to: "/dataset", icon: "📊", label: "Analyze Dataset" },
    { to: "/model", icon: "🤖", label: "Audit ML Model" },
    { to: "/llm", icon: "🧠", label: "Test LLM Bias" },
    { to: "/reports", icon: "📄", label: "View Reports" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Welcome, {user?.displayName?.split(" ")[0] || "Researcher"}</h1>
      <p style={{ color: "#6b7280" }}>
        Monitor AI fairness across your datasets, models, and LLM outputs.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        margin: "24px 0"
      }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: "#f3f4f6",
            padding: "20px",
            borderRadius: "12px"
          }}>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
              {kpi.label}
            </p>
            <p style={{
              fontSize: "28px",
              fontWeight: "600",
              margin: "8px 0 0"
            }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        marginTop: "24px"
      }}>
        {actions.map((action, i) => (
          <Link key={i} to={action.to} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            textDecoration: "none",
            color: "inherit",
            background: "white"
          }}>
            <span style={{ fontSize: "24px" }}>{action.icon}</span>
            <span style={{ fontWeight: "500" }}>{action.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "32px" }}>
        <h2>Recent Analyses</h2>
        {reports.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            No analyses yet. Upload a dataset to get started.
          </p>
        ) : (
          reports.slice(0, 5).map((r, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "8px",
              background: "white"
            }}>
              <span style={{ fontWeight: "500" }}>
                {r.type?.toUpperCase()} Analysis
              </span>
              <span style={{
                color: (r.result?.overall_score?.score || 0) >= 80
                  ? "#22c55e" : "#ef4444",
                fontWeight: "600"
              }}>
                {r.result?.overall_score?.score ?? "N/A"}/100
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

#### FILE: `frontend/src/pages/DatasetAnalysis.jsx`

```jsx
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { uploadDataset, analyzeDataset, mitigateDataset } from "../services/api";

export default function DatasetAnalysis() {
  const [file, setFile] = useState(null);
  const [gcsUri, setGcsUri] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveFeatures, setSensitiveFeatures] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);
  const [mitResult, setMitResult] = useState(null);

  const onDrop = useCallback((files) => setFile(files[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file || !targetColumn || !sensitiveFeatures) {
      return alert("Please upload a CSV and fill all fields");
    }
    setLoading(true);
    setResults(null);
    try {
      setStatus("Uploading to Cloud Storage...");
      const uploadRes = await uploadDataset(file);
      const uri = uploadRes.data.gcsUri;
      setGcsUri(uri);

      setStatus("Running bias analysis...");
      const res = await analyzeDataset({
        gcsUri: uri,
        targetColumn,
        sensitiveFeatures: sensitiveFeatures.split(",").map((s) => s.trim()),
      });
      setResults(res.data.analysis);
      setStatus("Analysis complete!");
    } catch (err) {
      setStatus("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMitigate = async (strategy) => {
    setLoading(true);
    try {
      const res = await mitigateDataset({
        gcsUri,
        targetColumn,
        sensitiveFeatures: sensitiveFeatures.split(",").map((s) => s.trim()),
        strategy,
      });
      setMitResult(res.data.mitigation);
    } catch (err) {
      alert("Mitigation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results
    ? Object.entries(results.class_imbalance?.value_counts || {}).map(
        ([label, count]) => ({ label: String(label), count })
      )
    : [];

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Dataset Bias Analysis</h1>
      <p style={{ color: "#6b7280" }}>
        Upload a CSV file to detect bias across sensitive features.
      </p>

      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#f0fdf4" : "white",
          marginBottom: "16px",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ margin: 0, color: "#6b7280" }}>
          {file
            ? `✅ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
            : isDragActive
            ? "Drop the CSV here"
            : "Drag & drop a CSV file, or click to select"}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <input
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          placeholder="Target column (e.g. loan_approved)"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
        <input
          value={sensitiveFeatures}
          onChange={(e) => setSensitiveFeatures(e.target.value)}
          placeholder="Sensitive features (e.g. gender,race)"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#9ca3af" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "500"
        }}
      >
        {loading ? "Processing..." : "🔍 Analyze Bias"}
      </button>

      {status && (
        <p style={{ color: "#6b7280", marginTop: "8px" }}>{status}</p>
      )}

      {results && (
        <div style={{ marginTop: "32px" }}>
          <div style={{
            padding: "24px",
            border: `2px solid ${results.overall_score?.color}`,
            borderRadius: "12px",
            marginBottom: "24px",
            textAlign: "center",
            background: "white"
          }}>
            <h2 style={{ margin: 0 }}>
              Fairness Score:{" "}
              <span style={{ color: results.overall_score?.color }}>
                {results.overall_score?.score}/100
              </span>
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>
              {results.overall_score?.label}
            </p>
          </div>

          <h3>Class Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={{ marginTop: "24px" }}>Detected Issues</h3>
          {results.bias_summary?.length === 0 ? (
            <p style={{ color: "#22c55e" }}>✅ No significant bias detected</p>
          ) : (
            results.bias_summary?.map((issue, i) => (
              <div key={i} style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "12px",
                background: "white"
              }}>
                <strong>{issue.type}</strong>
                <span style={{
                  marginLeft: "8px",
                  padding: "2px 8px",
                  background: issue.severity === "High" || issue.severity === "Severe"
                    ? "#fee2e2" : "#fef3c7",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: issue.severity === "High" || issue.severity === "Severe"
                    ? "#991b1b" : "#92400e"
                }}>
                  {issue.severity}
                </span>
                <p style={{ margin: "8px 0 4px", color: "#374151" }}>
                  {issue.message}
                </p>
                <p style={{ margin: 0, color: "#059669", fontSize: "14px" }}>
                  💡 {issue.action}
                </p>
              </div>
            ))
          )}

          <h3 style={{ marginTop: "24px" }}>Apply Mitigation</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => handleMitigate("resample")}
              disabled={loading}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                background: "white"
              }}
            >
              📈 Resample (SMOTE)
            </button>
            <button
              onClick={() => handleMitigate("remove_feature")}
              disabled={loading}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                background: "white"
              }}
            >
              ✂️ Remove Proxy Features
            </button>
          </div>
        </div>
      )}

      {mitResult && (
        <div style={{
          marginTop: "24px",
          padding: "16px",
          background: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #bbf7d0"
        }}>
          <h3 style={{ margin: "0 0 8px" }}>
            ✅ Mitigation Applied: {mitResult.strategy}
          </h3>
          <p style={{ margin: "4px 0" }}>
            Rows before: {mitResult.rows_before} → after: {mitResult.rows_after}
          </p>
          <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
            Saved to: {mitResult.output_gcs_uri}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

#### FILE: `frontend/src/pages/LLMBias.jsx`

```jsx
import React, { useState } from "react";
import { testLLMBias } from "../services/api";

export default function LLMBias() {
  const [provider, setProvider] = useState("openai");
  const [modelName, setModelName] = useState("gpt-4");
  const [testSuite, setTestSuite] = useState("hiring");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await testLLMBias({ provider, modelName, testSuite });
      setResults(res.data.analysis);
    } catch (err) {
      alert("Test failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "white"
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>LLM Bias Testing</h1>
      <p style={{ color: "#6b7280" }}>
        Run automated bias tests against any LLM provider using
        demographic variant prompts.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
        margin: "24px 0"
      }}>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} style={selectStyle}>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini (Vertex AI)</option>
        </select>
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Model (e.g. gpt-4)"
          style={selectStyle}
        />
        <select value={testSuite} onChange={(e) => setTestSuite(e.target.value)} style={selectStyle}>
          <option value="default">All Suites</option>
          <option value="hiring">Hiring Bias</option>
          <option value="medical">Medical Bias</option>
          <option value="financial">Financial Bias</option>
        </select>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#9ca3af" : "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "500"
        }}
      >
        {loading ? "Running Tests..." : "🧠 Run Bias Tests"}
      </button>

      {results && (
        <div style={{ marginTop: "32px" }}>
          <div style={{
            padding: "24px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            marginBottom: "24px",
            background: "white"
          }}>
            <h2 style={{ margin: "0 0 8px" }}>
              Fairness Score:{" "}
              <span style={{
                color: results.summary?.fairness_score >= 80
                  ? "#22c55e"
                  : results.summary?.fairness_score >= 60
                  ? "#f59e0b"
                  : "#ef4444"
              }}>
                {results.summary?.fairness_score}/100
              </span>
            </h2>
            <p style={{ margin: "4px 0", color: "#6b7280" }}>
              Tests run: {results.summary?.total_tests} |
              Biased: {results.summary?.biased_tests} |
              Label: <strong>{results.summary?.label}</strong>
            </p>
          </div>

          <h3>Test Results</h3>
          {results.test_results?.map((test, i) => (
            <div key={i} style={{
              padding: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "12px",
              background: "white"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{test.test_id}</strong>
                <span style={{
                  color: test.is_biased ? "#ef4444" : "#22c55e",
                  fontWeight: "500"
                }}>
                  {test.is_biased ? "⚠️ Bias Detected" : "✅ Fair"}
                </span>
              </div>
              <p style={{ margin: "4px 0", color: "#6b7280", fontSize: "13px" }}>
                Dimension: {test.bias_dimension} |
                Severity: {test.severity} |
                Disparity: {test.sentiment_disparity}
              </p>
            </div>
          ))}

          {results.recommendations?.length > 0 && (
            <div style={{
              padding: "16px",
              background: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe"
            }}>
              <h3 style={{ margin: "0 0 8px" }}>💡 Recommendations</h3>
              {results.recommendations.map((rec, i) => (
                <p key={i} style={{ margin: "4px 0", fontSize: "14px" }}>
                  • {rec}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

#### FILE: `frontend/src/pages/Reports.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { getReports } from "../services/api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReports()
      .then((res) => {
        setReports(res.data.reports || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const typeColors = {
    dataset: "#3b82f6",
    model: "#8b5cf6",
    llm: "#f59e0b",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Analysis Reports</h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          No reports yet. Run an analysis first.
        </p>
      ) : (
        reports.map((r, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            marginBottom: "8px",
            background: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                padding: "4px 10px",
                background: typeColors[r.type] || "#6b7280",
                color: "white",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {r.type?.toUpperCase()}
              </span>
              <span style={{ color: "#374151", fontWeight: "500" }}>
                Analysis Report
              </span>
            </div>
            <span style={{
              color: (r.result?.overall_score?.score || 0) >= 80
                ? "#22c55e" : "#ef4444",
              fontWeight: "700",
              fontSize: "18px"
            }}>
              {r.result?.overall_score?.score ?? "N/A"}/100
            </span>
          </div>
        ))
      )}
    </div>
  );
}
```

---

#### FILE: `frontend/src/App.jsx`

```jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DatasetAnalysis from "./pages/DatasetAnalysis";
import LLMBias from "./pages/LLMBias";
import Reports from "./pages/Reports";
import { logout } from "./services/firebase";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

const navLinks = [
  { to: "/", label: "📊 Dashboard" },
  { to: "/dataset", label: "📁 Dataset Analysis" },
  { to: "/llm", label: "🧠 LLM Testing" },
  { to: "/reports", label: "📄 Reports" },
];

function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav style={{
        width: "220px",
        borderRight: "1px solid #e5e7eb",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        background: "white",
        position: "fixed",
        height: "100vh"
      }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", margin: "0 0 16px" }}>
          ⚖️ FairAI Platform
        </h2>
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} style={{
            padding: "8px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#374151",
            fontSize: "14px"
          }}>
            {link.label}
          </Link>
        ))}
        <button
          onClick={logout}
          style={{
            marginTop: "auto",
            padding: "8px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            cursor: "pointer",
            background: "none",
            color: "#6b7280",
            fontSize: "14px"
          }}
        >
          Sign out
        </button>
      </nav>
      <main style={{ flex: 1, marginLeft: "220px", background: "#f9fafb", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
        } />
        <Route path="/dataset" element={
          <PrivateRoute><Layout><DatasetAnalysis /></Layout></PrivateRoute>
        } />
        <Route path="/llm" element={
          <PrivateRoute><Layout><LLMBias /></Layout></PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute><Layout><Reports /></Layout></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Step 6 — Run the Frontend

```bash
cd frontend
npm start
```

Opens at: `http://localhost:3000`

---

## 🔗 SECTION 4 — HOW TO RUN EVERYTHING TOGETHER (3 Terminals)

```
Terminal 1 — AI Engine (Python)
Terminal 2 — Backend (Node.js)
Terminal 3 — Frontend (React)
```

### Terminal 1

```bash
cd fairness-platform/ai_engine
venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2

```bash
cd fairness-platform/backend
npm run dev
```

### Terminal 3

```bash
cd fairness-platform/frontend
npm start
```

### Full Request Flow

```
User clicks "Analyze Bias" in browser
         ↓
React (port 3000) calls POST /api/dataset/analyze
         ↓
Node.js backend (port 3001) verifies Firebase token
         ↓
Backend calls POST http://localhost:8000/analyze/dataset
         ↓
Python AI Engine loads CSV from GCS, runs analysis
         ↓
Returns JSON result back to backend
         ↓
Backend saves result to Firestore
         ↓
Returns result to React frontend
         ↓
Dashboard shows Fairness Score + charts
```

---

## ☁️ SECTION 5 — GOOGLE TECHNOLOGIES (Member 4)

### When Each Tool is Needed

| Google Tool | Used When | Required For |
|-------------|-----------|-------------|
| Firebase Auth | User clicks "Sign in with Google" | Login page works |
| Firestore | After every analysis | Saving reports |
| Cloud Storage | CSV upload button clicked | Dataset analysis |
| BigQuery | Analysis logged in backend | Analytics dashboard |
| Vertex AI | Deploying trained fair models | Production deployment |
| Cloud Run | Final deployment | Going live |

### Setup Order (do in this exact order)

**1. Create GCP Project**
- Go to console.cloud.google.com
- Click "New Project" → name it `fairness-platform`
- Copy the Project ID (e.g. `fairness-platform-461203`)

**2. Enable APIs**
```bash
gcloud services enable storage.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable run.googleapis.com
```

**3. Create Cloud Storage Bucket**
```bash
gsutil mb -l us-central1 gs://fairness-platform-uploads
```

**4. Create Service Account + Download Key**
```bash
gcloud iam service-accounts create fairness-sa \
  --display-name="Fairness Platform SA"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:fairness-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:fairness-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:fairness-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"

gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=fairness-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Place `service-account-key.json` in BOTH:
- `fairness-platform/ai_engine/service-account-key.json`
- `fairness-platform/backend/service-account-key.json`

**5. Create Firebase Project**
- Go to console.firebase.google.com
- Click "Add project" → Select your existing GCP project
- Enable Google Sign-In: Authentication → Sign-in method → Google → Enable
- Create Firestore: Firestore Database → Create database → Start in test mode
- Add web app: Project Settings → Your apps → Add app → Web → Copy config

**6. Create BigQuery Table**
```bash
bq mk --dataset YOUR_PROJECT_ID:bias_analytics
bq mk --table YOUR_PROJECT_ID:bias_analytics.analysis_results \
  report_id:STRING,user_id:STRING,analysis_type:STRING,\
  fairness_score:FLOAT64,timestamp:TIMESTAMP,\
  dataset_rows:INTEGER,bias_issues:INTEGER
```

**7. Fill All .env Files**

`ai_engine/.env`:
```env
GCP_PROJECT_ID=fairness-platform-461203
GCS_BUCKET_NAME=fairness-platform-uploads
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
OPENAI_API_KEY=sk-your-key-here
```

`backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=fairness-platform-461203
GCS_BUCKET_NAME=fairness-platform-uploads
GCS_KEY_FILE=./service-account-key.json
BIGQUERY_DATASET=bias_analytics
BIGQUERY_TABLE=analysis_results
GCP_PROJECT_ID=fairness-platform-461203
```

`frontend/.env.local`:
```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=fairness-platform-461203.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fairness-platform-461203
REACT_APP_FIREBASE_STORAGE_BUCKET=fairness-platform-461203.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_BACKEND_URL=http://localhost:3001
```

---

## 📋 SECTION 6 — TESTING THE FULL INTEGRATION

### Test 1 — Health Checks (no GCP needed)

```bash
# AI Engine
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"ai-engine"}

# Backend
curl http://localhost:3001/api/health
# Expected: {"status":"ok","service":"backend","timestamp":"..."}

# Frontend
# Open browser at http://localhost:3000
# Should show login page
```

### Test 2 — Auth Flow (needs Firebase)

1. Open `http://localhost:3000`
2. Click "Sign in with Google"
3. Select your Google account
4. Should redirect to Dashboard

### Test 3 — Full Dataset Analysis (needs GCP + GCS)

1. Login to the app
2. Go to "Dataset Analysis"
3. Upload any CSV (you can use the sample below)
4. Enter target column and sensitive features
5. Click "Analyze Bias"
6. Should show Fairness Score and charts

### Sample Test CSV

Save this as `test_loan_data.csv` and upload it:

```csv
age,gender,race,income,credit_score,loan_approved
25,male,white,55000,720,1
32,female,black,48000,680,0
28,male,hispanic,52000,700,1
45,female,white,75000,750,1
35,male,black,60000,710,0
29,female,asian,58000,730,1
41,male,white,80000,760,1
26,female,hispanic,42000,650,0
38,male,black,65000,725,1
33,female,white,70000,740,1
```

Target column: `loan_approved`
Sensitive features: `gender,race`

---

## 🚨 SECTION 7 — IMPORTANT RULES FOR TEAMMATES

### Never Commit These Files

```
.env
.env.local
service-account-key.json
venv/
node_modules/
__pycache__/
```

### Git Workflow

```bash
# Always pull before starting work
git pull origin main

# Work on your own branch
git checkout -b feature/backend-routes    # Member 2
git checkout -b feature/frontend-pages    # Member 3
git checkout -b feature/gcp-integration   # Member 4

# Commit often with clear messages
git add .
git commit -m "feat(backend): add dataset upload route"

# Push your branch
git push origin feature/backend-routes

# Create Pull Request on GitHub → ask Member 1 to review
```

### Port Reference

| Service | Port | Command to start |
|---------|------|-----------------|
| AI Engine | 8000 | `uvicorn app:app --reload` |
| Backend | 3001 | `npm run dev` |
| Frontend | 3000 | `npm start` |

### If AI Engine Crashes

```bash
cd ai_engine
venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### If Backend Can't Connect to AI Engine

Check that `AI_ENGINE_URL=http://localhost:8000` is in `backend/.env` and the AI engine is running in Terminal 1.

### If Frontend Shows "Unauthorized"

Firebase token expired. Sign out and sign back in.

---

## ✅ SECTION 8 — COMPLETION CHECKLIST

```
AI ENGINE (Member 1) ✅
  ✅ app.py running on port 8000
  ✅ /health returns 200 OK
  ✅ bias_detection/ — 4 files complete
  ✅ mitigation/ — 2 files complete
  ✅ explainability/ — 1 file complete
  ✅ tests/ passing
  ⏳ .env — 2 GCP keys pending (Member 4 will fill)

BACKEND (Member 2) ⏳
  ⏳ server.js running on port 3001
  ⏳ All 5 routes created
  ⏳ Firebase auth middleware working
  ⏳ AI Engine client calling correctly
  ⏳ .env filled (Member 4 provides keys)

FRONTEND (Member 3) ⏳
  ⏳ React app running on port 3000
  ⏳ Firebase login working
  ⏳ Dataset upload + analysis working
  ⏳ LLM bias tester working
  ⏳ Reports page showing data
  ⏳ .env.local filled (Member 4 provides Firebase config)

GOOGLE CLOUD (Member 4) ⏳
  ⏳ GCP project created
  ⏳ Cloud Storage bucket created
  ⏳ Service account key downloaded
  ⏳ Firebase project created
  ⏳ Firestore database created
  ⏳ Firebase Auth enabled (Google Sign-In)
  ⏳ BigQuery dataset + table created
  ⏳ All .env files filled and shared with team
```

---

*Last updated: April 2026 | Google Solution Challenge 2026*
*AI Engine: Python 3.12.5 + FastAPI | Backend: Node.js 20 + Express | Frontend: React 18*
