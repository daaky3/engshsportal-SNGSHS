const https = require('https');

// Get data from Redis
async function getDataFromRedis(userId) {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve(null);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    const key = `app_data_${userId}`;
    url.pathname = `/get/${key}`;

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
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null)).end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const data = await getDataFromRedis(userId);

    if (data) {
      console.log('[Data Sync] User data imported:', userId);
      return res.status(200).json({
        success: true,
        data: data
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No synced data found for this user'
      });
    }
  } catch (err) {
    console.error('[Data Sync] Import error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
