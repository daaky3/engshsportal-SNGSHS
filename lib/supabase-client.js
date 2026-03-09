// Supabase Client Library for Frontend

// Initialize Supabase
const SUPABASE_URL = 'https://imrqnnwmlrvezdspyemu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnFubndtbHJ2ZXpkc3B5ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ2NDIsImV4cCI6MjA4ODY0MDY0Mn0.pS6vVPX_GotN9hguAEoNj9CH9TKpzfhLLzFW7oXNpfY';

// Create Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for use in the app
window.supabaseClient = supabaseClient;

console.log('✅ Supabase client initialized');

// Helper functions
const supabaseHelpers = {
  // Sign up new user
  async signUp(email, password, name) {
    try {
      console.log('📝 Signing up:', email);
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) throw new Error(error.message);

      // Create user profile
      const { error: profileError } = await supabaseClient
        .from('users')
        .insert([{
          id: data.user.id,
          email,
          name,
          role: 'staff'
        }]);

      if (profileError) throw new Error(profileError.message);

      console.log('✅ Signup successful:', email);
      return {
        success: true,
        user: {
          uid: data.user.id,
          email: data.user.email,
          name
        },
        token: data.session?.access_token
      };
    } catch (error) {
      console.error('❌ Signup error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Login user
  async login(email, password) {
    try {
      console.log('🔑 Logging in:', email);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw new Error(error.message);

      // Get user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      console.log('✅ Login successful:', email);
      return {
        success: true,
        user: {
          uid: data.user.id,
          email: data.user.email,
          name: profile.name
        },
        token: data.session?.access_token
      };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw new Error(error.message);

      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data } = await supabaseClient.auth.getUser();
      return data.user;
    } catch (error) {
      console.error('Error getting current user:', error.message);
      return null;
    }
  },

  // Add student
  async addStudent(classId, data) {
    try {
      const { data: student, error } = await supabaseClient
        .from('students')
        .insert([{
          ...data,
          class_id: classId
        }])
        .select();

      if (error) throw new Error(error.message);
      return { success: true, data: student[0] };
    } catch (error) {
      console.error('Error adding student:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get students by class
  async getStudentsByClass(classId) {
    try {
      const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('last_name', { ascending: true });

      if (error) throw new Error(error.message);
      return { success: true, data };
    } catch (error) {
      console.error('Error getting students:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Add result
  async addResult(resultData) {
    try {
      const { data, error } = await supabaseClient
        .from('results')
        .insert([resultData])
        .select();

      if (error) throw new Error(error.message);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error adding result:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get results by class
  async getResultsByClass(classId, term, year) {
    try {
      const { data, error } = await supabaseClient
        .from('results')
        .select('*')
        .eq('class_id', classId)
        .eq('term', term)
        .eq('academic_year', year);

      if (error) throw new Error(error.message);
      return { success: true, data };
    } catch (error) {
      console.error('Error getting results:', error.message);
      return { success: false, error: error.message };
    }
  }
};

window.supabaseHelpers = supabaseHelpers;
console.log('✅ Supabase helpers ready');
