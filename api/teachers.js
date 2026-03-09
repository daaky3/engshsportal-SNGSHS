const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // List all teachers
      const { data, error } = await supabase.from('teachers').select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, teachers: data });
    }
    if (req.method === 'POST') {
      // Add single or bulk teachers
      const { teachers } = req.body;
      if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
        return res.status(400).json({ error: 'No teachers provided' });
      }
      const { error } = await supabase.from('teachers').insert(teachers);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ success: true });
    }
    if (req.method === 'PUT') {
      // Edit teacher
      const { id, updates } = req.body;
      if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates' });
      const { error } = await supabase.from('teachers').update(updates).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }
    if (req.method === 'DELETE') {
      // Delete teacher
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
