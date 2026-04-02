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