const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, senderId } = req.body;

    if (!apiKey || !senderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing apiKey or senderId'
      });
    }

    console.log(`[SMS Test] Testing Arkesel API credentials`);

    // Build Arkesel URL with query parameters
    const arkeselUrl = new URL('https://sms.arkesel.com/sms/api');
    arkeselUrl.searchParams.append('action', 'send-sms');
    arkeselUrl.searchParams.append('api_key', apiKey.trim());
    arkeselUrl.searchParams.append('to', '0201234567'); // Valid Ghana number format for testing
    arkeselUrl.searchParams.append('from', senderId.trim());
    arkeselUrl.searchParams.append('sms', 'Test message from Serwaah Portal');

    console.log(`[SMS Test] Request URL: ${arkeselUrl.toString().replace(apiKey, '***')}`);

    https.get(arkeselUrl, (testRes) => {
      let data = '';
      const statusCode = testRes.statusCode;

      testRes.on('data', chunk => {
        data += chunk;
      });

      testRes.on('end', () => {
        console.log(`[SMS Test] Response: ${data}`);

        // Check if response is HTML (error)
        if (data.startsWith('<!DOCTYPE') || data.startsWith('<html') || data.includes('<html')) {
          console.error('[SMS Test] API returned HTML - authentication failed');
          return res.status(200).json({
            success: false,
            status: 'FAILED',
            message: 'Arkesel API authentication failed',
            details: 'Your API key appears to be invalid or inactive',
            statusCode: statusCode,
            checkList: [
              '✓ Verify API Key is correct',
              '✓ Login to Arkesel.com dashboard',
              '✓ Check API Key is ACTIVE (not inactive)',
              '✓ Verify Sender ID is APPROVED',
              '✓ Check account has SMS balance'
            ]
          });
        }

        // Try to parse response as JSON first (Arkesel sometimes returns JSON errors)
        let jsonResponse = null;
        try {
          jsonResponse = JSON.parse(data);
          console.log(`[SMS Test] Parsed JSON response:`, jsonResponse);
        } catch (e) {
          // Not JSON, continue with plain text parsing
        }

        const trimmedData = data.trim();
        
        // Check for success messages first
        if (trimmedData.toLowerCase().includes('successfully sent') || trimmedData.toLowerCase().includes('success')) {
          console.log('[SMS Test] SMS sent successfully! API credentials are valid!');
          return res.status(200).json({
            success: true,
            status: 'SUCCESS',
            message: 'Arkesel API credentials are VALID! ✅',
            details: 'Your test SMS was sent successfully!',
            apiResponse: trimmedData
          });
        }
        
        // Check for error codes in JSON response
        if (jsonResponse && jsonResponse.code) {
          console.log(`[SMS Test] Arkesel error code: ${jsonResponse.code}`);
          
          // If we get a response (even an error), the API key is valid!
          // The error is about the test number, not the credentials
          if (jsonResponse.code === '103' || jsonResponse.message.includes('invalid Phone Number')) {
            // API is working, just phone number format issue (expected with test number)
            console.log('[SMS Test] API credentials are valid! (Phone number is just invalid for testing)');
            return res.status(200).json({
              success: true,
              status: 'SUCCESS',
              message: 'Arkesel API credentials are VALID! ✅',
              details: 'API responded with phone validation error, which means your credentials are working.',
              apiResponse: jsonResponse
            });
          }
          
          // Other error codes
          let suggestion = 'Check your API key in Arkesel dashboard';
          if (jsonResponse.code === '101' || jsonResponse.message.includes('invalid API key')) {
            suggestion = 'Your API key is invalid - verify it\'s correct in Arkesel dashboard';
          } else if (jsonResponse.code === '102' || jsonResponse.message.includes('Sender ID')) {
            suggestion = 'Sender ID not approved - verify it\'s approved in Arkesel dashboard';
          }
          
          return res.status(200).json({
            success: false,
            status: 'API_ERROR',
            message: 'Arkesel API returned an error',
            error: jsonResponse.message,
            code: jsonResponse.code,
            suggestion: suggestion,
            apiResponse: jsonResponse
          });
        }
        
        // Check plain text responses (success indicator: "1701")
        if (trimmedData === '1701' || trimmedData.includes('1701')) {
          console.log('[SMS Test] API credentials are valid');
          return res.status(200).json({
            success: true,
            status: 'SUCCESS',
            message: 'Arkesel API credentials are valid!',
            response: trimmedData
          });
        } else {
          // Unknown response
          console.log(`[SMS Test] Unexpected response: ${trimmedData}`);
          return res.status(200).json({
            success: false,
            status: 'UNEXPECTED_RESPONSE',
            message: 'API returned unexpected response',
            response: trimmedData,
            suggestion: 'Contact Arkesel support if problem persists'
          });
        }
      });
    }).on('error', (err) => {
      console.error('[SMS Test] Network error:', err.message);
      return res.status(200).json({
        success: false,
        status: 'NETWORK_ERROR',
        message: 'Cannot reach Arkesel API',
        error: err.message,
        suggestions: [
          'Check your internet connection',
          'Verify Arkesel service is online',
          'Check firewall allows HTTPS connections'
        ]
      });
    }).on('timeout', function() {
      this.destroy();
      return res.status(200).json({
        success: false,
        status: 'TIMEOUT',
        message: 'Arkesel API did not respond in time',
        suggestions: [
          'Try again in a moment',
          'Contact Arkesel support if issue persists'
        ]
      });
    }).setTimeout(10000);

  } catch (err) {
    console.error('[SMS Test] Server error:', err);
    return res.status(500).json({
      success: false,
      status: 'SERVER_ERROR',
      message: 'Server error: ' + err.message
    });
  }
};
