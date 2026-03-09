const https = require('https');

// Get users from Redis
async function getUsersFromRedis() {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve([]);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    url.pathname = '/get/portal_users';

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.result) {
            resolve(JSON.parse(response.result));
          } else {
            resolve([]);
          }
        } catch (err) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([])).end();
  });
}

// Save users to Redis
async function saveUsersToRedis(users) {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve(false);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    url.pathname = '/set/portal_users';

    const postData = JSON.stringify(users);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.result === 'OK');
        } catch (err) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false)).end(postData);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { staffId, password, name, role = 'teacher' } = req.body;

    if (!staffId || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get existing users
    const users = await getUsersFromRedis();

    // Check if user already exists
    if (users.find(u => u.staffId === staffId)) {
      return res.status(200).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Add new user
    const newUser = {
      id: Date.now().toString(),
      staffId: staffId,
      password: password,
      name: name,
      role: role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Save to Redis
    const saved = await saveUsersToRedis(users);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save user'
      });
    }

    console.log('[Auth] User registered:', staffId, name, role);
    return res.status(200).json({
      success: true,
      user: newUser
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
