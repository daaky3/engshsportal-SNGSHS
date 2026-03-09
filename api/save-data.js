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
    const { action, data, userId } = req.body;

    if (!action || !data) {
      return res.status(400).json({ error: 'Missing action or data' });
    }

    console.log(`[Save Data] Action: ${action}, Items: ${Array.isArray(data) ? data.length : 1}`);

    let result;

    switch (action) {
      case 'save_students':
        // Save or update students
        const { error: studentsError } = await supabase
          .from('students')
          .upsert(Array.isArray(data) ? data : [data], { 
            onConflict: 'admission_number' 
          });

        if (studentsError) {
          console.error('[Save Data] Students error:', studentsError);
          return res.status(400).json({ error: studentsError.message });
        }
        result = { success: true, message: `${Array.isArray(data) ? data.length : 1} student(s) saved` };
        break;

      case 'save_classes':
        // Save or update classes
        const { error: classesError } = await supabase
          .from('classes')
          .upsert(Array.isArray(data) ? data : [data], { 
            onConflict: 'id' 
          });

        if (classesError) {
          console.error('[Save Data] Classes error:', classesError);
          return res.status(400).json({ error: classesError.message });
        }
        result = { success: true, message: `${Array.isArray(data) ? data.length : 1} class(es) saved` };
        break;

      case 'save_results':
        // Save or update results
        const { error: resultsError } = await supabase
          .from('results')
          .upsert(Array.isArray(data) ? data : [data], { 
            onConflict: 'id' 
          });

        if (resultsError) {
          console.error('[Save Data] Results error:', resultsError);
          return res.status(400).json({ error: resultsError.message });
        }
        result = { success: true, message: `${Array.isArray(data) ? data.length : 1} result(s) saved` };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    console.log('[Save Data] Success:', result.message);
    return res.status(200).json(result);

  } catch (err) {
    console.error('[Save Data] Error:', err.message);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message 
    });
  }
};
