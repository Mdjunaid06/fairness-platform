const admin = require("../config/firebase");

const db = admin.firestore();

exports.getReports = async (req, res) => {
  try {
    const snapshot = await db
      .collection("reports")
      .where("userId", "==", req.user.uid)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ reports });
  } catch (err) {
    console.error("Firestore error:", err.message);
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