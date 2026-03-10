-- Teachers table for Serwaah Portal
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surname VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  other_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  main_subject VARCHAR(100) NOT NULL,
  other_subjects TEXT, -- comma-separated or JSON array
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher-Class-Subject assignment table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  subject VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now)
CREATE POLICY "Teachers readable by all" ON teachers FOR SELECT USING (true);
CREATE POLICY "Teachers writable by all" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Assignments readable by all" ON teacher_assignments FOR SELECT USING (true);
CREATE POLICY "Assignments writable by all" ON teacher_assignments FOR INSERT WITH CHECK (true);
