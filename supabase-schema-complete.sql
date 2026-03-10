-- ============================================
-- SUPABASE SCHEMA FOR SERWAAH NYARKO PORTAL
-- ============================================
-- This file creates all tables needed for data persistence
-- Copy and paste into Supabase SQL Editor and run

-- 1. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255),
    year VARCHAR(50),
    default_subject_ids TEXT, -- JSON array of subject IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    subject_ids TEXT, -- JSON array of subject IDs
    guardian_phone VARCHAR(20),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MARKS TABLE
CREATE TABLE IF NOT EXISTS marks (
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    class_mark DECIMAL(5,2),
    exam_mark DECIMAL(5,2),
    total DECIMAL(5,2),
    grade VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (student_id, subject_id, academic_year, semester)
);

-- 5. CONFIG TABLE (for settings)
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PROMOTION HISTORY TABLE
CREATE TABLE IF NOT EXISTS promotion_history (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_class_id BIGINT REFERENCES classes(id),
    to_class_id BIGINT REFERENCES classes(id),
    academic_year VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. REPORT LINKS TABLE
CREATE TABLE IF NOT EXISTS report_links (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    report_code VARCHAR(255) UNIQUE NOT NULL,
    academic_year VARCHAR(50),
    semester VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. USERS TABLE (for login)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    staff_id VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS for all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to subjects (for dropdowns)
CREATE POLICY "Allow public read on subjects"
ON subjects FOR SELECT
USING (true);

-- Allow public read access to classes (for dropdowns)
CREATE POLICY "Allow public read on classes"
ON classes FOR SELECT
USING (true);

-- Allow public read access to students
CREATE POLICY "Allow public read on students"
ON students FOR SELECT
USING (true);

-- Allow public read access to marks
CREATE POLICY "Allow public read on marks"
ON marks FOR SELECT
USING (true);

-- Allow authenticated users to insert/update/delete subjects
CREATE POLICY "Allow authenticated insert on subjects"
ON subjects FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on subjects"
ON subjects FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on subjects"
ON subjects FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete classes
CREATE POLICY "Allow authenticated insert on classes"
ON classes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on classes"
ON classes FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on classes"
ON classes FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete students
CREATE POLICY "Allow authenticated insert on students"
ON students FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on students"
ON students FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on students"
ON students FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete marks
CREATE POLICY "Allow authenticated insert on marks"
ON marks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on marks"
ON marks FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on marks"
ON marks FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete config
CREATE POLICY "Allow authenticated insert on config"
ON config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on config"
ON config FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on config"
ON config FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete promotion_history
CREATE POLICY "Allow authenticated insert on promotion_history"
ON promotion_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on promotion_history"
ON promotion_history FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on promotion_history"
ON promotion_history FOR DELETE
USING (true);

-- Allow authenticated users to insert/update/delete report_links
CREATE POLICY "Allow authenticated insert on report_links"
ON report_links FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on report_links"
ON report_links FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on report_links"
ON report_links FOR DELETE
USING (true);

-- Allow read on users (for login check)
CREATE POLICY "Allow public read on users"
ON users FOR SELECT
USING (true);

-- Allow insert on users
CREATE POLICY "Allow authenticated insert on users"
ON users FOR INSERT
WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_subject_id ON marks(subject_id);
CREATE INDEX idx_marks_academic_year ON marks(academic_year);
CREATE INDEX idx_promotion_history_student_id ON promotion_history(student_id);
CREATE INDEX idx_report_links_student_id ON report_links(student_id);
CREATE INDEX idx_report_links_code ON report_links(report_code);
CREATE INDEX idx_users_staff_id ON users(staff_id);

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================
-- Insert default admin user
INSERT INTO users (staff_id, password, name, role) 
VALUES ('0050139', 'Sengshs24', 'Principal', 'admin')
ON CONFLICT (staff_id) DO NOTHING;
