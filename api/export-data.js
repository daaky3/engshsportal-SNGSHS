const https = require('https');

// Save data to Redis
async function saveDataToRedis(userId, data) {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve(false);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    const key = `app_data_${userId}`;
    url.pathname = `/set/${key}`;

    const postData = JSON.stringify(data);

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
    const { userId, data } = req.body;

    if (!userId || !data) {
      return res.status(400).json({ error: 'Missing userId or data' });
    }

    const saved = await saveDataToRedis(userId, data);

    if (saved) {
      console.log('[Data Sync] User data exported:', userId);
      return res.status(200).json({
        success: true,
        message: 'Data exported successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to save data' });
    }
  } catch (err) {
    console.error('[Data Sync] Export error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
