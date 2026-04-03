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