// Firebase Admin SDK Configuration (Server-side only)
// Use this for backend API operations

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCbd6nFbdypbzQo2ZuYUo1UCBhShXkB_dk",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "sengshsportal.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "sengshsportal",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "sengshsportal.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "215579304323",
  appId: process.env.FIREBASE_APP_ID || "1:215579304323:web:53834338c8d6e7f25456b6"
};

module.exports = firebaseConfig;
