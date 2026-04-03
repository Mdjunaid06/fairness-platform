const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE,
});

module.exports = storage;