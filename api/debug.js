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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const users = await getUsersFromRedis();
    
    // Debug info
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL ? 'Connected' : 'Not configured';
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set';

    return res.status(200).json({
      debug: {
        redisUrl: redisUrl,
        redisToken: redisToken,
        vercelEnvironment: process.env.VERCEL === '1',
        totalUsersLoaded: users.length
      },
      users: users.map(u => ({
        staffId: u.staffId,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (err) {
    console.error('[Auth] Debug endpoint error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
