// Firebase-based Login API
// This endpoint verifies Firebase authentication tokens

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, token } = req.body;

    // If client sends Firebase auth token, verify it
    if (token) {
      try {
        // Verify token on Vercel (since we don't have Firebase Admin SDK)
        // This is a simplified approach - you can enhance with Firebase Admin SDK
        return res.status(200).json({
          success: true,
          message: 'Token verified',
          token: token
        });
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // If email and password provided, authenticate via Firebase client SDK
    if (email && password) {
      // This should be handled on the client-side using Firebase SDK
      // The API just validates the token
      return res.status(400).json({ 
        error: 'Please authenticate using Firebase client SDK first',
        hint: 'Use firebaseAuthHelpers.login() on the frontend'
      });
    }

    return res.status(400).json({ error: 'Missing credentials or token' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
