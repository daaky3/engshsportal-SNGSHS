const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportCode, reportData, userId, students, results, classes } = req.body;

    if (!reportCode || !reportData) {
      return res.status(400).json({ error: 'Missing reportCode or reportData' });
    }

    console.log('[Report Save] Saving report:', reportCode);

    // Save report to Supabase reports table
    const { error: reportError } = await supabase
      .from('reports')
      .insert([{
        student_id: reportData.student_id || null,
        report_type: 'terminal',
        report_data: reportData
      }]);

    if (reportError) {
      console.error('[Report Save] Report error:', reportError.message);
    } else {
      console.log('[Report Save] Report saved to Supabase');
    }

    // If students data provided, save to Supabase
    if (students && Array.isArray(students) && students.length > 0) {
      const { error: studentsError } = await supabase
        .from('students')
        .upsert(students, { onConflict: 'admission_number' });

      if (studentsError) {
        console.error('[Report Save] Students save error:', studentsError.message);
      } else {
        console.log('[Report Save] Students saved:', students.length);
      }
    }

    // If results data provided, save to Supabase
    if (results && Array.isArray(results) && results.length > 0) {
      const { error: resultsError } = await supabase
        .from('results')
        .upsert(results, { onConflict: 'id' });

      if (resultsError) {
        console.error('[Report Save] Results save error:', resultsError.message);
      } else {
        console.log('[Report Save] Results saved:', results.length);
      }
    }

    // If classes data provided, save to Supabase
    if (classes && Array.isArray(classes) && classes.length > 0) {
      const { error: classesError } = await supabase
        .from('classes')
        .upsert(classes, { onConflict: 'id' });

      if (classesError) {
        console.error('[Report Save] Classes save error:', classesError.message);
      } else {
        console.log('[Report Save] Classes saved:', classes.length);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Report and data saved successfully'
    });
  } catch (err) {
    console.error('[Report Save] Error:', err.message);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message 
    });
  }
};
