import axios from "axios";
import { auth } from "./firebase";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? import.meta.env.REACT_APP_BACKEND_URL ?? "http://localhost:3001";

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

export const detectColumns = (payload) =>
  apiClient.post("/api/dataset/detect", payload);

export const listDemoDatasets = () =>
  apiClient.get("/api/dataset/demo/list");

export const analyzeDemoDataset = (datasetKey) =>
  apiClient.post("/api/dataset/demo/analyze", { datasetKey });
export const runLegalCheck = (payload) =>
  apiClient.post("/api/dataset/legal", payload);

export const generateNarrative = (payload) =>
  apiClient.post("/api/dataset/narrative", payload);
