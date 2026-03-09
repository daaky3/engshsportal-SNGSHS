// Firebase Authentication Utilities
// Use these functions in your API endpoints and frontend

// Client-side authentication helper
const clientAuthHelpers = {
  // Sign up a new user
  async signUp(email, password) {
    try {
      if (!window.firebaseAuth) throw new Error('Firebase not initialized');
      const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js').then(m => m);
      const userCred = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      return { success: true, user: userCred.user, uid: userCred.user.uid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Login user
  async login(email, password) {
    try {
      if (!window.firebaseAuth) throw new Error('Firebase not initialized');
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js').then(m => m);
      const userCred = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
      return { success: true, user: userCred.user, uid: userCred.user.uid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      if (!window.firebaseAuth) throw new Error('Firebase not initialized');
      await window.firebaseAuth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return window.firebaseAuth?.currentUser || null;
  },

  // Get auth token
  async getToken() {
    try {
      const user = window.firebaseAuth?.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
};

// Export for use in HTML/JS files
if (typeof window !== 'undefined') {
  window.firebaseAuthHelpers = clientAuthHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clientAuthHelpers };
}
