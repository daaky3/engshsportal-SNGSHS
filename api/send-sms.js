const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;
    
    // Read credentials from environment variables (securely stored in Vercel)
    const apiKey = process.env.ARKESEL_API_KEY;
    const senderId = process.env.ARKESEL_SENDER_ID;

    if (!apiKey || !senderId) {
      console.error('[SMS] Error: Arkesel credentials not configured in environment');
      return res.status(500).json({ 
        error: 'SMS service not configured. Contact administrator.',
        details: 'Missing ARKESEL_API_KEY or ARKESEL_SENDER_ID'
      });
    }

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Missing phone number or message' });
    }

    console.log(`[SMS] Sending SMS to ${phoneNumber}`);
    console.log(`[SMS] Sender ID: ${senderId}`);

    // Build Arkesel URL with query parameters
    const arkeselUrl = new URL('https://sms.arkesel.com/sms/api');
    arkeselUrl.searchParams.append('action', 'send-sms');
    arkeselUrl.searchParams.append('api_key', apiKey.trim());
    arkeselUrl.searchParams.append('to', phoneNumber.trim());
    arkeselUrl.searchParams.append('from', senderId.trim());
    arkeselUrl.searchParams.append('sms', message.trim());

    console.log(`[SMS] Request URL: ${arkeselUrl.toString().replace(apiKey, '***')}`);

    https.get(arkeselUrl, (smsRes) => {
      let data = '';
      const statusCode = smsRes.statusCode;

      console.log(`[SMS] Response status: ${statusCode}`);

      smsRes.on('data', chunk => {
        data += chunk;
      });

      smsRes.on('end', () => {
        console.log(`[SMS] Response data: ${data}`);

        // Check if response is HTML (error)
        if (data.startsWith('<!DOCTYPE') || data.startsWith('<html') || data.includes('<html')) {
          console.error('[SMS] Arkesel returned HTML error page');
          return res.status(200).json({
            success: false,
            error: 'Arkesel API returned HTML error. Check API key, phone number format, and sender ID.'
          });
        }

        const trimmedData = data.trim();
        console.log(`[SMS] Trimmed response: "${trimmedData}"`);
        
        // Check for success messages
        if (trimmedData.toLowerCase().includes('successfully sent') || trimmedData.toLowerCase().includes('success')) {
          console.log('[SMS] SMS sent successfully');
          return res.status(200).json({
            success: true,
            message: 'SMS sent successfully',
            response: trimmedData
          });
        }
        
        // Check for success code (1701)
        if (trimmedData === '1701' || trimmedData.includes('1701')) {
          console.log('[SMS] SMS sent successfully');
          return res.status(200).json({
            success: true,
            message: 'SMS sent successfully',
            response: trimmedData
          });
        } else {
          // Handle error codes
          console.error('[SMS] Arkesel returned error:', trimmedData);
          return res.status(200).json({
            success: false,
            error: `Arkesel error: ${trimmedData}`,
            statusCode: statusCode
          });
        }
      });
    }).on('error', (err) => {
      console.error('[SMS] Request error:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to reach Arkesel API: ' + err.message
      });
    }).on('timeout', function() {
      this.destroy();
      console.error('[SMS] Request timeout');
      return res.status(504).json({
        success: false,
        error: 'Arkesel API timeout'
      });
    }).setTimeout(10000);

  } catch (err) {
    console.error('[SMS] Server error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message
    });
  }
};


