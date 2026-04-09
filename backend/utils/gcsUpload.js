const admin = require("../config/firebase");

const db = admin.firestore();

const uploadToFirestore = async (buffer, fileName, contentType) => {
  const base64Content = buffer.toString("base64");

  const docRef = await db.collection("file_storage").add({
    fileName,
    contentType,
    content: base64Content,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    sizeBytes: buffer.length,
  });

  const firestoreUri = `firestore://file_storage/${docRef.id}`;

  return {
    gcsUri: firestoreUri,
    fileId: docRef.id,
  };
};

const getFileFromFirestore = async (fileId) => {
  const doc = await db.collection("file_storage").doc(fileId).get();
  if (!doc.exists) {
    throw new Error("File not found");
  }
  const data = doc.data();
  return {
    buffer: Buffer.from(data.content, "base64"),
    metadata: {
      fileName: data.fileName,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes,
    },
  };
};

module.exports = { uploadToFirebaseStorage: uploadToFirestore, getFileFromFirestore };