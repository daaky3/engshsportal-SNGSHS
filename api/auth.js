// Custom Authentication API - No external Firebase needed
// Store user data locally for demo/testing

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simple in-memory user storage (replace with actual database in production)
let users = {};
const usersFile = path.join(__dirname, '../users.json');

// Load users from file if exists
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf-8');
      users = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
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

loadUsers();

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
    const body = await parseBody(req);
    const action = body.action || 'login';
    const { email, password, name } = body;

    if (action === 'signup') {
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user exists
      if (users[email]) {
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

      saveUsers();

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

      // Find user
      const user = users[email];
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Generate new token
      const token = generateToken();
      user.token = token;
      saveUsers();

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
          saveUsers();
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
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
};

