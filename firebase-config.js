// Firebase Configuration
// This file contains the Firebase config for your web app
// Keep your keys_private, never commit them to version control

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCbd6nFbdypbzQo2ZuYUo1UCBhShXkB_dk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sengshsportal.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sengshsportal",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sengshsportal.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "215579304323",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:215579304323:web:53834338c8d6e7f25456b6",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NDFMDLF2XY"
};

// Initialize Firebase (Client-side)
if (typeof window !== 'undefined') {
  // Import Firebase modules dynamically for browser environment
  import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js')
    .then(({ initializeApp }) => {
      import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js')
        .then(({ getAuth }) => {
          import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js')
            .then(({ getFirestore }) => {
              const app = initializeApp(firebaseConfig);
              window.firebaseAuth = getAuth(app);
              window.firebaseDb = getFirestore(app);
              console.log('Firebase initialized successfully');
            })
            .catch(err => console.error('Failed to load Firestore:', err));
        })
        .catch(err => console.error('Failed to load Auth:', err));
    })
    .catch(err => console.error('Failed to load Firebase App:', err));
}

// Export config for Node.js/API usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
