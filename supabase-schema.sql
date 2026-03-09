-- Supabase Schema for Serwaah Portal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication & profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff', -- 'admin', 'teacher', 'staff'
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  form VARCHAR(50), -- 'Form 1', 'Form 2', etc.
  section VARCHAR(10), -- 'A', 'B', 'C'
  form_tutor UUID REFERENCES users(id),
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  class_id UUID REFERENCES classes(id),
  phone VARCHAR(20),
  parent_phone VARCHAR(20),
  email VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Results/Grades table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject VARCHAR(100) NOT NULL,
  test_score DECIMAL(5,2),
  exam_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  grade VARCHAR(2),
  term VARCHAR(20), -- 'Term 1', 'Term 2', 'Term 3'
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports/Transcripts table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  report_type VARCHAR(50), -- 'transcript', 'attendance', 'conduct'
  term VARCHAR(20),
  academic_year VARCHAR(20),
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  report_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now)
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Classes readable by all" ON classes FOR SELECT USING (true);
CREATE POLICY "Classes writable by all" ON classes FOR INSERT WITH CHECK (true);

CREATE POLICY "Students readable by all" ON students FOR SELECT USING (true);
CREATE POLICY "Students writable by all" ON students FOR INSERT WITH CHECK (true);

CREATE POLICY "Results readable by all" ON results FOR SELECT USING (true);
CREATE POLICY "Results writable by all" ON results FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports readable by all" ON reports FOR SELECT USING (true);
CREATE POLICY "Reports writable by all" ON reports FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_reports_student_id ON reports(student_id);
