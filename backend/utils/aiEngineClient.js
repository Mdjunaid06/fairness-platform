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