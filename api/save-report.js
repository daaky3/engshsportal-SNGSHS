const https = require('https');

// Save report to Redis
async function saveReportToRedis(reportCode, reportData) {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve(false);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    const key = `report_${reportCode}`;
    url.pathname = `/set/${key}`;

    const postData = JSON.stringify(reportData);

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
          console.log('[Report Save] Redis response:', response);
          const success = response.result === 'OK';
          console.log('[Report Save] Success:', success, 'Key:', key);
          resolve(success);
        } catch (err) {
          console.error('[Report Save] Parse error:', err, 'Data:', data);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('[Report Save] Request error:', err);
      resolve(false);
    }).end(postData);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportCode, reportData } = req.body;

    if (!reportCode || !reportData) {
      return res.status(400).json({ error: 'Missing reportCode or reportData' });
    }

    const saved = await saveReportToRedis(reportCode, reportData);

    if (saved) {
      console.log('[Report] Report saved:', reportCode);
      return res.status(200).json({
        success: true,
        message: 'Report saved successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to save report' });
    }
  } catch (err) {
    console.error('[Report] Error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
