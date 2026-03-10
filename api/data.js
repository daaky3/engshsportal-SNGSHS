const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get table name from query or body
    let table = req.query?.table || req.body?.table;
    
    if (!table) {
      return res.status(400).json({ error: 'Missing table parameter' });
    }

    console.log(`[DATA API] ${req.method} ${table}`, { 
      id: req.query?.id, 
      bodyKeys: req.body ? Object.keys(req.body) : [] 
    });

    // GET - Fetch all records or specific record
    if (req.method === 'GET') {
      const id = req.query?.id;
      
      if (id) {
        // Fetch single record
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error(`[DATA API] GET error for ${table} id=${id}:`, error);
          return res.status(500).json({ error: error.message, code: error.code });
        }
        
        return res.status(200).json({ success: true, data });
      }
      
      // Fetch all records
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`[DATA API] GET all error for ${table}:`, error);
        return res.status(500).json({ error: error.message, code: error.code });
      }
      
      return res.status(200).json({ success: true, data });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const record = req.body?.record;
      
      if (!record) {
        return res.status(400).json({ error: 'Missing record in body' });
      }
      
      console.log(`[DATA API] Inserting into ${table}:`, Object.keys(record));
      
      const { data, error } = await supabase
        .from(table)
        .insert([record])
        .select();
      
      if (error) {
        console.error(`[DATA API] POST error for ${table}:`, error);
        return res.status(500).json({ error: error.message, code: error.code, details: error.details });
      }
      
      return res.status(201).json({ success: true, data: data[0] });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, updates } = req.body || {};
      
      if (!id || !updates) {
        return res.status(400).json({ error: 'Missing id or updates in body' });
      }
      
      console.log(`[DATA API] Updating ${table} id=${id}:`, Object.keys(updates));
      
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`[DATA API] PUT error for ${table}:`, error);
        return res.status(500).json({ error: error.message, code: error.code, details: error.details });
      }
      
      return res.status(200).json({ success: true, data: data[0] });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const id = req.body?.id;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing id in body' });
      }
      
      console.log(`[DATA API] Deleting from ${table} id=${id}`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`[DATA API] DELETE error for ${table}:`, error);
        return res.status(500).json({ error: error.message, code: error.code });
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (err) {
    console.error('[DATA API] Uncaught error:', err);
    return res.status(500).json({ 
      error: err.message,
      type: err.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
