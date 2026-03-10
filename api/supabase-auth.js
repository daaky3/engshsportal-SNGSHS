// Supabase Authentication API
// This connects the frontend to Supabase Auth

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Main handler
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = await parseBody(req);
    const action = body.action || 'login';
    const { email, password, name } = body;

    console.log(`[Supabase Auth] Action: ${action}, Email: ${email}`);

    if (action === 'signup') {
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Normalize email: trim and lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      console.log(`[Supabase Auth] Normalized email: ${normalizedEmail} (original: ${email})`);

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        console.error('[Supabase Auth] Signup error:', error.message, error);
        console.error('[Supabase Auth] Error details:', JSON.stringify(error, null, 2));
        return res.status(400).json({ 
          error: error.message || 'Signup failed',
          details: error
        });
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: normalizedEmail,
          name,
          role: 'staff'
        }]);

      if (profileError) {
        console.error('[Supabase Auth] Profile creation error:', profileError.message);
        // Try upsert if insert fails (in case profile already exists)
        const { error: upsertError } = await supabase
          .from('users')
          .upsert([{
            id: data.user.id,
            email: normalizedEmail,
            name,
            role: 'staff'
          }]);
        
        if (upsertError) {
          console.error('[Supabase Auth] Upsert error:', upsertError.message);
          return res.status(400).json({ error: 'Failed to create user profile' });
        }
      }

      console.log('[Supabase Auth] Signup successful:', email);
      return res.status(201).json({
        success: true,
        user: {
          uid: data.user.id,
          email: data.user.email,
          name
        },
        message: 'Account created successfully'
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Normalize email: trim and lowercase
      const normalizedEmail = email.trim().toLowerCase();

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        console.error('[Supabase Auth] Login error:', error.message, error);
        console.error('[Supabase Auth] Error details:', JSON.stringify(error, null, 2));
        return res.status(401).json({ 
          error: error.message || 'Invalid credentials',
          details: error
        });
      }

      // Get user profile
      let { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id);

      if (profileError) {
        console.error('[Supabase Auth] Profile fetch error:', profileError.message);
      }

      let profile = profileData && profileData.length > 0 ? profileData[0] : null;
      
      // If profile doesn't exist, create it
      if (!profile) {
        console.log('[Supabase Auth] Profile not found, creating one for user:', data.user.id);
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'User',
            role: 'staff'
          }])
          .select()
          .single();

        if (createError) {
          console.error('[Supabase Auth] Profile creation error:', createError.message);
          console.log('[Supabase Auth] Creating profile with upsert instead...');
          
          // Try upsert if insert fails
          const { data: upsertProfile, error: upsertError } = await supabase
            .from('users')
            .upsert([{
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || 'User',
              role: 'staff'
            }])
            .select();

          if (upsertError) {
            console.error('[Supabase Auth] Upsert error:', upsertError.message);
            // Continue anyway with auth response
          } else {
            profile = upsertProfile && upsertProfile.length > 0 ? upsertProfile[0] : null;
          }
        } else {
          profile = newProfile;
        }
      }

      console.log('[Supabase Auth] Login successful:', email);
      return res.status(200).json({
        success: true,
        user: {
          uid: data.user.id,
          email: data.user.email,
          name: profile?.name || 'User'
        },
        token: data.session?.access_token,
        message: 'Login successful'
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('[Supabase Auth] Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
