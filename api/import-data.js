const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    console.log('[Data Import] Fetching data for user:', userId);

    // Fetch user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.log('[Data Import] User not found:', userId);
      return res.status(200).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Fetch all related data (classes, students, results)
    const [
      { data: classes, error: classError },
      { data: students, error: studentError },
      { data: results, error: resultsError }
    ] = await Promise.all([
      supabase.from('classes').select('*').eq('id', userData.id),
      supabase.from('students').select('*'),
      supabase.from('results').select('*')
    ]);

    console.log('[Data Import] Retrieved:');
    console.log('  - Classes:', classes?.length || 0);
    console.log('  - Students:', students?.length || 0);
    console.log('  - Results:', results?.length || 0);

    // Format data in the structure the frontend expects
    const syncedData = {
      subjects: [], // Can be fetched separately if needed
      classes: classes || [],
      students: students || [],
      marks: results || [],
      config: [],
      promotion_history: [],
      report_links: []
    };

    return res.status(200).json({
      success: true,
      data: syncedData,
      message: 'Data synced from Supabase'
    });
  } catch (err) {
    console.error('[Data Import] Error:', err.message);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message 
    });
  }
};
