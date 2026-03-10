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
    let table = req.query.table;
    let body = {};
    
    // Parse body if present
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!table && body.table) {
        table = body.table;
      }
    }
    
    if (!table) {
      return res.status(400).json({ error: 'Missing table parameter' });
    }

    // GET - Fetch all records or specific record
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, data });
      }
      
      const { data, error } = await supabase.from(table).select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, data });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const { record } = body;
      if (!record) return res.status(400).json({ error: 'Missing record in body' });
      
      const { data, error } = await supabase
        .from(table)
        .insert([record])
        .select();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ success: true, data: data[0] });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, updates } = body;
      if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates in body' });
      
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, data: data[0] });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'Missing id in body' });
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
