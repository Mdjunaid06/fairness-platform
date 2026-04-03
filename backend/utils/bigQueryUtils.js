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