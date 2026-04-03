const { BigQuery } = require("@google-cloud/bigquery");

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
});

module.exports = bigquery;