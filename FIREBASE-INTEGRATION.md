# Firebase Integration Guide

## Setup Complete ✓

Your Firebase integration is now set up with the following files:

### Frontend Files
- **firebase-config.js** - Firebase initialization for browser
- **firebase-auth-utils.js** - Authentication helper functions
- **index.html** - Updated to include Firebase scripts

### Backend Files
- **api/firebase-login.js** - Firebase token verification endpoint
- **firebase-admin-config.js** - Firebase config for server-side use

### Configuration Files
- **.env.local** - Local development environment variables
- **.env.production** - Production variables for Vercel

## Using Firebase Authentication in Your App

### 1. Update Your Login Form (in index.html)

Find your login form and add this JavaScript:

```javascript
async function handleLogin() {
  const emailInput = document.querySelector('#email-input'); // Update selector
  const passwordInput = document.querySelector('#password-input'); // Update selector
  
  const email = emailInput.value;
  const password = passwordInput.value;
  
  // Use Firebase Auth Helper
  const result = await window.firebaseAuthHelpers.login(email, password);
  
  if (result.success) {
    console.log('Login successful:', result.user);
    // Redirect to dashboard or main app
    window.location.href = '/dashboard';
  } else {
    alert('Login failed: ' + result.error);
  }
}
```

### 2. Protect Routes (Check if User is Logged In)

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const user = window.firebaseAuthHelpers.getCurrentUser();
  
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
  } else {
    console.log('User authenticated:', user.email);
    // Load user-specific data
  }
});
```

### 3. Add Logout Functionality

```javascript
async function handleLogout() {
  const result = await window.firebaseAuthHelpers.logout();
  
  if (result.success) {
    console.log('Logged out successfully');
    window.location.href = '/'; // Redirect to login
  } else {
    alert('Logout failed: ' + result.error);
  }
}
```

### 4. Get User Token (for API calls)

```javascript
async function apiCallWithAuth() {
  const token = await window.firebaseAuthHelpers.getToken();
  
  const response = await fetch('/api/firebase-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  console.log('API Response:', data);
}
```

---

## Firebase Console Setup

If you haven't already, complete these steps in Firebase Console:

### Enable Authentication
1. Go to Firebase Console → sengshsportal project
2. Click **Authentication** (left sidebar)
3. Click **Get Started**
4. Enable **Email/Password** provider
5. (Optional) Enable **Google Sign-In**

### Create Firestore Database
1. Go to **Firestore Database** (left sidebar)
2. Click **Create Database**
3. Choose region (nearest to your users)
4. Start in **Production Mode** or **Test Mode**
5. Click **Create**

### Set Firestore Security Rules (Initial Rules for Testing)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow anyone to read public data
    match /public/{document=**} {
      allow read: if true;
    }
    
    // Restrict other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Environment Variables for Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable from **.env.production**:
   - REACT_APP_FIREBASE_API_KEY
   - REACT_APP_FIREBASE_AUTH_DOMAIN
   - REACT_APP_FIREBASE_PROJECT_ID
   - REACT_APP_FIREBASE_STORAGE_BUCKET
   - REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   - REACT_APP_FIREBASE_APP_ID
   - REACT_APP_FIREBASE_MEASUREMENT_ID
   - (And FIREBASE_* versions for backend)

---

## Next Steps

1. **Update your login form** with Firebase authentication
2. **Add Firestore rules** in Firebase Console
3. **Test locally** by running `npm start`
4. **Deploy to Vercel** when ready

For more help, see [Firebase Documentation](https://firebase.google.com/docs)
