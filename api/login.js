const https = require('https');

// Get users from Redis
async function getUsersFromRedis() {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('[Redis] Environment variables not set, using fallback');
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
            const users = JSON.parse(response.result);
            resolve(users);
          } else {
            resolve([]);
          }
        } catch (err) {
          console.warn('[Redis] Parse error:', err.message);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
      resolve([]);
    }).end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { staffId, password } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    let users = await getUsersFromRedis();

    // Fallback to environment variable if Redis doesn't have data
    if (users.length === 0 && process.env.PORTAL_USERS) {
      try {
        users = JSON.parse(process.env.PORTAL_USERS);
      } catch (err) {
        console.warn('[Auth] Error parsing PORTAL_USERS:', err.message);
      }
    }

    // Find user with matching credentials
    const user = users.find(u => u.staffId === staffId && u.password === password);

    if (user) {
      console.log('[Auth] Login successful for:', staffId);
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          staffId: user.staffId,
          name: user.name,
          role: user.role
        }
      });
    } else {
      console.log('[Auth] Login failed for:', staffId);
      return res.status(200).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
