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