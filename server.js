const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// Determine the base directory for serving files
// In Vercel serverless, __dirname points to a temporary location
// We need to find where the static files actually are
let baseDir = __dirname;

// Check if we're in a Vercel serverless environment
if (process.env.VERCEL === '1') {
  // In Vercel, files are located at /var/task (the function root)
  baseDir = process.cwd();
  console.log('[Init] Running on Vercel - using cwd:', baseDir);
} else {
  console.log('[Init] Running locally - using __dirname:', baseDir);
}

// Verify that index.html exists
const indexPath = path.join(baseDir, 'index.html');
console.log('[Init] Looking for index.html at:', indexPath);
console.log('[Init] index.html exists:', fs.existsSync(indexPath));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ============================================
// SERVER-SIDE USER MANAGEMENT
// ============================================
// Store users in memory and persist to JSON file
const usersFile = path.join(baseDir, 'users.json');

let users = [];

// Load users from file on startup
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8');
      users = JSON.parse(data);
      console.log('[Users] Loaded', users.length, 'users from file');
    } else {
      users = [];
      console.log('[Users] No users file found - starting fresh');
    }
  } catch (err) {
    console.error('[Users] Error loading users:', err);
    users = [];
  }
}

// Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
    console.log('[Users] Saved', users.length, 'users to file');
  } catch (err) {
    console.error('[Users] Error saving users:', err);
  }
}

// Load users on startup
loadUsers();

// Function to send SMS via Arkesel (server-to-server)
function sendArkeselSMS(apiKey, phoneNumber, senderId, message) {
  return new Promise((resolve, reject) => {
    // Validate inputs - CRITICAL: Trim spaces from credentials
    if (!apiKey || apiKey.trim() === '') {
      return reject(new Error('API Key is empty'));
    }
    if (!phoneNumber || phoneNumber.trim() === '') {
      return reject(new Error('Phone number is empty'));
    }
    if (!senderId || senderId.trim() === '') {
      return reject(new Error('Sender ID is empty'));
    }

    // CRITICAL: Trim the API key and Sender ID to remove any whitespace
    const trimmedApiKey = apiKey.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    const trimmedSenderId = senderId.trim();

    const params = querystring.stringify({
      action: 'send-sms',
      api_key: trimmedApiKey,
      to: trimmedPhoneNumber,
      from: trimmedSenderId,
      sms: message
    });

    const options = {
      hostname: 'sms.arkesel.com',
      port: 443,
      path: `/sms/api?${params}`,
      method: 'GET',
      headers: {
        'User-Agent': 'SchoolPortal/1.0'
      }
    };

    // Log request details for debugging (without exposing full API key)
    console.log(`[SMS Relay] Preparing Arkesel Request:`);
    console.log(`[SMS Relay]   Phone: ${trimmedPhoneNumber} (length: ${trimmedPhoneNumber.length})`);
    console.log(`[SMS Relay]   Sender ID: ${trimmedSenderId} (length: ${trimmedSenderId.length})`);
    console.log(`[SMS Relay]   API Key: [REDACTED] (length: ${trimmedApiKey.length} chars)`);
    console.log(`[SMS Relay]   Message length: ${message.length} chars`);
    console.log(`[SMS Relay]   Full URL path: /sms/api?action=send-sms&api_key=[REDACTED]&to=${trimmedPhoneNumber}&from=${trimmedSenderId}&sms=...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[SMS Relay] Arkesel Response Status: ${res.statusCode}`);
        console.log(`[SMS Relay] Arkesel Response Body: ${data}`);
        
        // Arkesel returns status code 200 on success
        if (res.statusCode === 200) {
          resolve({ success: true, message: data, statusCode: res.statusCode });
        } else {
          // Return the actual API response - don't reject, let the caught error include the status and body
          reject(new Error(`Arkesel API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[SMS Relay] Request error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (>10s) - Arkesel server not responding'));
    });

    req.setTimeout(10000); // 10 second timeout
    req.end();
  });
}

const server = http.createServer((req, res) => {
  // Log all incoming requests with methods and URLs
  console.log('[Request]', req.method, req.url);
  
  // Debug endpoint - show available files
  if (req.url === '/debug/files') {
    try {
      const files = fs.readdirSync(baseDir);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        baseDir: baseDir,
        files: files.filter(f => !f.startsWith('.')).slice(0, 50)
      }, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // Health check and debug endpoint
  if (req.url === '/health' || req.url === '/.vercel/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      baseDir: baseDir,
      indexHtmlExists: fs.existsSync(path.join(baseDir, 'index.html')),
      cwd: process.cwd(),
      nodeVersion: process.version,
      vercel: process.env.VERCEL === '1'
    }));
    return;
  }
  
  // ============================================
  // LOGIN ENDPOINT - Server-side authentication
  // ============================================
  if (req.method === 'POST' && req.url === '/api/login') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { staffId, password } = data;
        
        // Find user with matching staffId and password
        const user = users.find(u => u.staffId === staffId && u.password === password);
        
        if (user) {
          console.log('[Auth] Login successful for:', staffId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              id: user.id,
              staffId: user.staffId,
              name: user.name,
              role: user.role
            }
          }));
        } else {
          console.log('[Auth] Login failed for:', staffId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          }));
        }
      } catch (err) {
        console.error('[Auth] Login error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  // ============================================
  // REGISTER/ADD USER ENDPOINT
  // ============================================
  if (req.method === 'POST' && req.url === '/api/register-user') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { staffId, password, name, role = 'teacher' } = data;
        
        // Check if user already exists
        if (users.find(u => u.staffId === staffId)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'User already exists'
          }));
          return;
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
        saveUsers();
        
        console.log('[Auth] User registered:', staffId, name, role);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: newUser
        }));
      } catch (err) {
        console.error('[Auth] Register error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  // ============================================
  // LIST USERS ENDPOINT
  // ============================================
  if (req.method === 'GET' && req.url === '/api/users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      users: users.map(u => ({
        staffId: u.staffId,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      }))
    }));
    return;
  }
  
  // Catch-all for unmatched API routes
  if (req.url.startsWith('/api/')) {
    console.warn('[API] Unmatched API route:', req.method, req.url);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found', path: req.url }));
    return;
  }
  
  // Special handling for manifest.json and service-worker.js
  if (req.url === '/manifest.json' || req.url === '/service-worker.js') {
    const fileName = req.url.split('/').pop();
    const filePath = path.join(baseDir, fileName);
    
    console.log('[Static] Serving:', req.url, 'from:', filePath);
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error('[Static] File not found:', filePath, err.message);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found', file: fileName }));
      } else {
        const contentType = req.url === '/manifest.json' ? 'application/json' : 'application/javascript';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf8');
      }
    });
    return;
  }
  
  // Handle request debugger - shows EXACTLY what would be sent to Arkesel
  if (req.method === 'POST' && req.url === '/api/debug-sms-request') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { apiKey, phoneNumber, senderId, message } = data;

        // Build exact request that would be sent
        const params = querystring.stringify({
          action: 'send-sms',
          api_key: apiKey.trim(),
          to: phoneNumber.trim(),
          from: senderId.trim(),
          sms: message
        });

        const fullUrl = `https://sms.arkesel.com/sms/api?${params}`;

        const debug = {
          message: 'This is EXACTLY what would be sent to Arkesel',
          request_method: 'GET',
          request_url: fullUrl,
          request_path: `/sms/api?${params}`,
          parameters: {
            action: 'send-sms',
            api_key_length: apiKey.trim().length,
            api_key_first_10_chars: apiKey.trim().substring(0, 10),
            to: phoneNumber.trim(),
            from: senderId.trim(),
            sms_length: message.length,
            sms_preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          },
          validation: {
            api_key_is_not_empty: apiKey.trim().length > 0,
            phone_is_not_empty: phoneNumber.trim().length > 0,
            sender_id_is_not_empty: senderId.trim().length > 0,
            message_is_not_empty: message.length > 0
          }
        };

        console.log('[SMS Debug Request]', JSON.stringify(debug, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(debug, null, 2));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    return;
  }

  // Handle SMS diagnostic endpoint
  if (req.method === 'POST' && req.url === '/api/test-arkesel') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { apiKey, senderId } = data;

        const diagnostics = {
          apiKey_provided: !!apiKey,
          apiKey_length: apiKey ? apiKey.length : 0,
          apiKey_trimmed_length: apiKey ? apiKey.trim().length : 0,
          apiKey_has_leading_space: apiKey ? /^\s/.test(apiKey) : false,
          apiKey_has_trailing_space: apiKey ? /\s$/.test(apiKey) : false,
          senderId_provided: !!senderId,
          senderId_value: senderId || '',
          senderId_trimmed: senderId ? senderId.trim() : '',
          timestamp: new Date().toISOString()
        };

        console.log('[Arkesel Diagnostics]', diagnostics);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(diagnostics));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid JSON in request body: ' + err.message
        }));
      }
    });

    return;
  }

  // Handle SMS relay endpoint
  if (req.method === 'POST' && req.url === '/api/send-sms') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { apiKey, phoneNumber, senderId, message } = data;

        console.log('[SMS Relay] Received SMS request from client');
        console.log(`[SMS Relay] PhoneNumber: ${phoneNumber}, SenderId: ${senderId}, Message length: ${message?.length}`);

        if (!apiKey || !phoneNumber || !senderId || !message) {
          console.error('[SMS Relay] Missing parameters');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Missing required parameters: apiKey, phoneNumber, senderId, message'
          }));
          return;
        }

        // Send SMS via Arkesel
        sendArkeselSMS(apiKey, phoneNumber, senderId, message)
          .then((result) => {
            console.log('[SMS Relay] Success - SMS sent');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: result.message }));
          })
          .catch((error) => {
            console.error(`[SMS Relay] Arkesel Error: ${error.message}`);
            // Return 200 with success: false for Arkesel errors
            // This allows the client to see the actual Arkesel error message
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: error.message
            }));
          });
      } catch (err) {
        console.error('[SMS Relay] JSON Parse Error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body: ' + err.message
        }));
      }
    });

    return;
  }

  // Determine the file path
  let requestPath = req.url === '/' ? '/index.html' : req.url;
  // Remove query strings
  requestPath = requestPath.split('?')[0];
  
  let filePath = path.join(baseDir, requestPath);

  // Prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath);
  const normalizedBase = path.normalize(baseDir);
  
  if (!normalizedPath.startsWith(normalizedBase)) {
    console.warn('[Security] Forbidden access attempt:', requestPath);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('[File] Not found:', requestPath, '- Checking if should serve index.html');
        // For SPA routing, serve index.html for non-existent files (except APIs and actual resource files)
        const shouldServeIndex = !requestPath.startsWith('/api/') && 
                                  requestPath !== '/manifest.json' &&
                                  requestPath !== '/service-worker.js' &&
                                  (requestPath === '/' || !requestPath.split('/').pop().includes('.'));
        
        if (shouldServeIndex) {
          fs.readFile(path.join(baseDir, 'index.html'), (indexErr, indexContent) => {
            if (indexErr) {
              console.error('[ERROR] Failed to read index.html:', indexErr);
              console.error('[ERROR] Tried to read from:', path.join(baseDir, 'index.html'));
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Application file not found', path: path.join(baseDir, 'index.html') }));
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf8');
            }
          });
        } else {
          console.warn('[File] 404 Not Found:', requestPath);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Resource not found', path: requestPath }));
        }
      } else {
        console.error('[ERROR] File read error:', requestPath, err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'text/plain';
      
      console.log('[File] Serving:', requestPath, `(${contentType})`);
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n✓ Server running at http://${HOST}:${PORT}/`);
  console.log('✓ PWA is ready for installation');
  console.log('✓ Open in your browser and add to home screen');
  console.log('\nPress Ctrl+C to stop the server\n');
});
