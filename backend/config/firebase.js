const admin = require('firebase-admin');
const path = require('path');

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || `${firebaseProjectId}.appspot.com`;

let db = null;
let bucket = null;
let useFirebaseMock = true;

// ตรวจสอบความถูกต้องของการตั้งค่า Firebase ใน Environment Variables (เน้นใช้ Service Account สำหรับ Local Run)
if (serviceAccountPath && serviceAccountPath.trim() !== '') {
  try {
    if (admin.apps.length === 0) {
      // โหลดไฟล์ Service Account Key ในกรณีระบุ Path
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName
      });
    }
    
    db = admin.firestore();
    bucket = admin.storage().bucket(storageBucketName);
    useFirebaseMock = false;
    console.log('✅ Firebase Admin (Firestore & Storage) initialized successfully via Service Account.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin client:', error.message);
  }
} else {
  console.log('⚠️ Running in Firebase MOCK mode. Configure GOOGLE_APPLICATION_CREDENTIALS in .env to connect to live Firebase services.');
}

module.exports = {
  admin,
  db,
  bucket,
  useFirebaseMock
};
