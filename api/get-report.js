const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reportCode = req.query.code;
    console.log('[Report Get] Fetching report with code:', reportCode);

    if (!reportCode) {
      return res.status(400).json({ error: 'Missing report code' });
    }

      // Fetch report from Supabase using the report code stored in report_data JSONB
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('report_data->>reportCode', reportCode)
        .limit(1);

    if (error) {
      console.error('[Report Get] Supabase error:', error.message);
      return res.status(500).json({ 
        error: 'Database error: ' + error.message 
      });
    }

    if (reports && reports.length > 0) {
      const report = reports[0];
      console.log('[Report Get] Found report:', reportCode);
      
      // Return the full report data including HTML
      return res.status(200).json({
        success: true,
        data: report.report_data || report
      });
    } else {
      console.log('[Report Get] Report not found:', reportCode);
      return res.status(404).json({
        success: false,
        error: 'Report not found. Check your link is correct or contact your school.'
      });
    }
  } catch (err) {
    console.error('[Report Get] Error:', err.message);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message 
    });
  }
};
