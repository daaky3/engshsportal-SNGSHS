// Custom Authentication API - No external Firebase needed
// Use /tmp for data storage (persists longer in Vercel)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use /tmp for persistent storage in serverless environment
const usersFile = path.join('/tmp', 'users.json');

// Load users from file if exists
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      console.log('[Auth] Loading users from /tmp/users.json');
      const data = fs.readFileSync(usersFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Auth] Error loading users:', error.message);
  }
  console.log('[Auth] No existing users file, starting fresh');
  return {};
}

// Save users to /tmp
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log('[Auth] Users saved to /tmp/users.json');
    return true;
  } catch (error) {
    console.error('[Auth] Error saving users:', error.message);
    return false;
  }
}

// Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Main handler
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Load fresh copy of users for each request
    let users = loadUsers();
    
    const body = await parseBody(req);
    const action = body.action || 'login';
    const { email, password, name } = body;

    console.log(`[Auth] Action: ${action}, Email: ${email}`);

    if (action === 'signup') {
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user exists
      if (users[email]) {
        console.log(`[Auth] User already exists: ${email}`);
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create user
      const uid = crypto.randomUUID();
      const hashedPassword = hashPassword(password);
      const token = generateToken();

      users[email] = {
        uid,
        name,
        email,
        password: hashedPassword,
        token,
        createdAt: new Date().toISOString()
      };

      // Save to /tmp
      saveUsers(users);
      console.log(`[Auth] Signup successful: ${email}`);

      return res.status(201).json({
        success: true,
        user: {
          uid,
          email,
          name
        },
        token,
        message: 'Account created successfully'
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      console.log(`[Auth] Login attempt. Users in store: ${Object.keys(users).length}`);
      console.log(`[Auth] Stored users: ${JSON.stringify(Object.keys(users))}`);

      // Find user
      const user = users[email];
      if (!user) {
        console.log(`[Auth] User not found: ${email}`);
        return res.status(401).json({ error: 'User not found' });
      }

      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        console.log(`[Auth] Invalid password for: ${email}`);
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Generate new token
      const token = generateToken();
      user.token = token;
      saveUsers(users);

      console.log(`[Auth] Login successful: ${email}`);
      return res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name
        },
        token,
        message: 'Login successful'
      });
    }

    if (action === 'logout') {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const userEmail = Object.keys(users).find(email => users[email].token === token);
        if (userEmail) {
          users[userEmail].token = null;
          saveUsers(users);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }

    if (action === 'profile') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const userEmail = Object.keys(users).find(email => users[email].token === token);
      if (!userEmail) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = users[userEmail];
      return res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('[Auth] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

