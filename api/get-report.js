const https = require('https');

// Get report data from Redis
async function getReportFromRedis(reportCode) {
  return new Promise((resolve, reject) => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return resolve(null);
    }

    const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
    const key = `report_${reportCode}`;
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
          console.log('[Report Get] Redis response for key', key, ':', response);
          if (response.result) {
            const parsed = JSON.parse(response.result);
            console.log('[Report Get] Parsed report data:', parsed);
            resolve(parsed);
          } else {
            console.log('[Report Get] No result found for key:', key);
            resolve(null);
          }
        } catch (err) {
          console.error('[Report Get] Parse error:', err, 'Data:', data);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('[Report Get] Request error:', err);
      resolve(null);
    }).end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reportCode = req.query.code;
    console.log('[Report Get] Fetching report with code:', reportCode);

    if (!reportCode) {
      return res.status(400).json({ error: 'Missing report code' });
    }

    const report = await getReportFromRedis(reportCode);

    if (report) {
      console.log('[Report] Found report:', reportCode);
      return res.status(200).json({
        success: true,
        data: report
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Report not found. Check your link is correct or contact your school.'
      });
    }
  } catch (err) {
    console.error('[Report] Error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
