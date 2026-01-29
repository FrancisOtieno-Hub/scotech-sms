-- ========================================
-- SCOTECH SMS - SEED DATA
-- Sample data for testing and development
-- ========================================

-- ========================================
-- 1. EXAMPLE SCHOOL
-- ========================================
-- Run this to create a test school
INSERT INTO schools (id, name, motto, address, phone, email, active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001', -- Fixed UUID for testing
    'Demo School',
    'Excellence in Education',
    'P.O. Box 123, Demo City',
    '0700123456',
    'info@demoschool.ac.ke',
    true
  )
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name;

-- ========================================
-- 2. SEED CLASSES FOR A SCHOOL
-- ========================================
-- This function creates standard Kenyan curriculum classes
-- Usage: SELECT seed_classes('YOUR-SCHOOL-ID');

CREATE OR REPLACE FUNCTION seed_classes(p_school_id UUID)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO classes (school_id, name, level, capacity)
  VALUES
    (p_school_id, 'Pre-Unit', 0, 30),
    (p_school_id, 'Grade 1', 1, 35),
    (p_school_id, 'Grade 2', 2, 35),
    (p_school_id, 'Grade 3', 3, 40),
    (p_school_id, 'Grade 4', 4, 40),
    (p_school_id, 'Grade 5', 5, 40),
    (p_school_id, 'Grade 6', 6, 40),
    (p_school_id, 'Grade 7', 7, 40),
    (p_school_id, 'Grade 8', 8, 40),
    (p_school_id, 'Grade 9', 9, 40)
  ON CONFLICT (school_id, name) DO NOTHING;
  
  RETURN 'Classes seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. SEED EXPENSE CATEGORIES
-- ========================================
-- Creates common expense categories
-- Usage: SELECT seed_expense_categories('YOUR-SCHOOL-ID');

CREATE OR REPLACE FUNCTION seed_expense_categories(p_school_id UUID)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO expense_categories (school_id, name, description)
  VALUES
    (p_school_id, 'Salaries & Wages', 'Staff payments and allowances'),
    (p_school_id, 'Utilities', 'Water, electricity, internet bills'),
    (p_school_id, 'Learning Materials', 'Books, stationery, teaching aids'),
    (p_school_id, 'Maintenance & Repairs', 'Building and equipment upkeep'),
    (p_school_id, 'Transport', 'Fuel, vehicle maintenance, trips'),
    (p_school_id, 'Food & Catering', 'Student meals and events'),
    (p_school_id, 'Administrative', 'Office supplies, licenses, subscriptions'),
    (p_school_id, 'Events & Activities', 'Sports, trips, celebrations'),
    (p_school_id, 'Security', 'Watchmen, alarm systems'),
    (p_school_id, 'Medical', 'First aid, health services'),
    (p_school_id, 'Other', 'Miscellaneous expenses')
  ON CONFLICT (school_id, name) DO NOTHING;
  
  RETURN 'Expense categories seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. SEED DEPARTMENTS
-- ========================================
-- Creates standard school departments
-- Usage: SELECT seed_departments('YOUR-SCHOOL-ID');

CREATE OR REPLACE FUNCTION seed_departments(p_school_id UUID)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO departments (school_id, name, description)
  VALUES
    (p_school_id, 'Administration', 'School administration and management'),
    (p_school_id, 'Languages', 'English, Kiswahili, French'),
    (p_school_id, 'Mathematics', 'Mathematics and related subjects'),
    (p_school_id, 'Sciences', 'Physics, Chemistry, Biology'),
    (p_school_id, 'Social Studies', 'History, Geography, CRE, IRE'),
    (p_school_id, 'Technical', 'Computer Studies, Home Science'),
    (p_school_id, 'Creative Arts', 'Music, Art, Drama'),
    (p_school_id, 'Physical Education', 'Sports and PE'),
    (p_school_id, 'Support Staff', 'Non-teaching staff')
  ON CONFLICT (school_id, name) DO NOTHING;
  
  RETURN 'Departments seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. SEED SUBJECTS
-- ========================================
-- Creates standard subjects
-- Usage: SELECT seed_subjects('YOUR-SCHOOL-ID');

CREATE OR REPLACE FUNCTION seed_subjects(p_school_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_dept_id UUID;
BEGIN
  -- Languages
  SELECT id INTO v_dept_id FROM departments 
  WHERE school_id = p_school_id AND name = 'Languages' LIMIT 1;
  
  INSERT INTO subjects (school_id, name, code, department_id)
  VALUES
    (p_school_id, 'English', 'ENG', v_dept_id),
    (p_school_id, 'Kiswahili', 'KIS', v_dept_id)
  ON CONFLICT (school_id, code) DO NOTHING;
  
  -- Mathematics
  SELECT id INTO v_dept_id FROM departments 
  WHERE school_id = p_school_id AND name = 'Mathematics' LIMIT 1;
  
  INSERT INTO subjects (school_id, name, code, department_id)
  VALUES
    (p_school_id, 'Mathematics', 'MAT', v_dept_id)
  ON CONFLICT (school_id, code) DO NOTHING;
  
  -- Sciences
  SELECT id INTO v_dept_id FROM departments 
  WHERE school_id = p_school_id AND name = 'Sciences' LIMIT 1;
  
  INSERT INTO subjects (school_id, name, code, department_id)
  VALUES
    (p_school_id, 'Science', 'SCI', v_dept_id),
    (p_school_id, 'Integrated Science', 'INT-SCI', v_dept_id)
  ON CONFLICT (school_id, code) DO NOTHING;
  
  -- Social Studies
  SELECT id INTO v_dept_id FROM departments 
  WHERE school_id = p_school_id AND name = 'Social Studies' LIMIT 1;
  
  INSERT INTO subjects (school_id, name, code, department_id)
  VALUES
    (p_school_id, 'Social Studies', 'SST', v_dept_id),
    (p_school_id, 'CRE', 'CRE', v_dept_id),
    (p_school_id, 'IRE', 'IRE', v_dept_id)
  ON CONFLICT (school_id, code) DO NOTHING;
  
  -- Creative Arts
  SELECT id INTO v_dept_id FROM departments 
  WHERE school_id = p_school_id AND name = 'Creative Arts' LIMIT 1;
  
  INSERT INTO subjects (school_id, name, code, department_id)
  VALUES
    (p_school_id, 'Creative Arts', 'CA', v_dept_id),
    (p_school_id, 'Music', 'MUS', v_dept_id)
  ON CONFLICT (school_id, code) DO NOTHING;
  
  RETURN 'Subjects seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. COMPLETE SCHOOL SETUP
-- ========================================
-- Runs all seed functions for a new school
-- Usage: SELECT complete_school_setup('YOUR-SCHOOL-ID');

CREATE OR REPLACE FUNCTION complete_school_setup(p_school_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  -- Seed classes
  SELECT seed_classes(p_school_id) INTO v_result;
  
  -- Seed expense categories
  SELECT seed_expense_categories(p_school_id) INTO v_result;
  
  -- Seed departments
  SELECT seed_departments(p_school_id) INTO v_result;
  
  -- Seed subjects
  SELECT seed_subjects(p_school_id) INTO v_result;
  
  RETURN 'School setup completed successfully! Classes, expense categories, departments, and subjects have been created.';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. SAMPLE DATA FOR TESTING
-- ========================================
-- Uncomment and run this section to create sample students, staff, etc.

/*
-- Create sample term
INSERT INTO terms (school_id, year, term, active, start_date, end_date)
VALUES 
  ('YOUR-SCHOOL-ID', 2026, 1, true, '2026-01-13', '2026-04-04')
ON CONFLICT (school_id, year, term) DO UPDATE SET active = true;

-- Create sample fees
WITH term_data AS (
  SELECT id FROM terms WHERE school_id = 'YOUR-SCHOOL-ID' AND active = true LIMIT 1
),
class_data AS (
  SELECT id, name FROM classes WHERE school_id = 'YOUR-SCHOOL-ID'
)
INSERT INTO fees (school_id, class_id, term_id, amount)
SELECT 
  'YOUR-SCHOOL-ID',
  c.id,
  t.id,
  CASE 
    WHEN c.name = 'Pre-Unit' THEN 5000
    WHEN c.name IN ('Grade 1', 'Grade 2', 'Grade 3') THEN 8000
    WHEN c.name IN ('Grade 4', 'Grade 5', 'Grade 6') THEN 10000
    ELSE 12000
  END
FROM class_data c, term_data t
ON CONFLICT (school_id, class_id, term_id) DO NOTHING;

-- Create sample students
WITH class_data AS (
  SELECT id FROM classes WHERE school_id = 'YOUR-SCHOOL-ID' AND name = 'Grade 5' LIMIT 1
)
INSERT INTO learners (school_id, admission_no, first_name, last_name, gender, date_of_birth, class_id, parent_phone, parent_name, active)
SELECT 
  'YOUR-SCHOOL-ID',
  'STD26' || LPAD(generate_series::text, 4, '0'),
  (ARRAY['John', 'Mary', 'Peter', 'Jane', 'David', 'Sarah', 'James', 'Lucy', 'Mark', 'Grace'])[floor(random() * 10 + 1)],
  (ARRAY['Kamau', 'Wanjiku', 'Ochieng', 'Akinyi', 'Mwangi', 'Njeri', 'Kipchoge', 'Chebet', 'Otieno', 'Wambui'])[floor(random() * 10 + 1)],
  (ARRAY['Male', 'Female'])[floor(random() * 2 + 1)],
  DATE '2015-01-01' + (random() * 365)::integer,
  c.id,
  '+254' || (700000000 + floor(random() * 99999999))::bigint,
  'Parent ' || generate_series,
  true
FROM generate_series(1, 20), class_data c
ON CONFLICT (school_id, admission_no) DO NOTHING;

-- Create sample staff
WITH dept_data AS (
  SELECT id FROM departments WHERE school_id = 'YOUR-SCHOOL-ID' AND name = 'Languages' LIMIT 1
)
INSERT INTO staff (school_id, staff_no, first_name, last_name, gender, phone, email, position, department_id, employment_type, date_employed, active)
SELECT 
  'YOUR-SCHOOL-ID',
  'STF26' || LPAD(generate_series::text, 4, '0'),
  (ARRAY['Joseph', 'Margaret', 'Samuel', 'Ruth', 'Daniel'])[floor(random() * 5 + 1)],
  (ARRAY['Muthoni', 'Kariuki', 'Wekesa', 'Nafula', 'Mutua'])[floor(random() * 5 + 1)],
  (ARRAY['Male', 'Female'])[floor(random() * 2 + 1)],
  '+254' || (700000000 + floor(random() * 99999999))::bigint,
  'teacher' || generate_series || '@school.ac.ke',
  'Teacher',
  d.id,
  'permanent',
  DATE '2020-01-01' + (random() * 1825)::integer,
  true
FROM generate_series(1, 10), dept_data d
ON CONFLICT (school_id, staff_no) DO NOTHING;
*/

-- ========================================
-- 8. USAGE EXAMPLES
-- ========================================

/*
-- Example 1: Setup a new school completely
SELECT complete_school_setup('YOUR-SCHOOL-ID');

-- Example 2: Add classes only
SELECT seed_classes('YOUR-SCHOOL-ID');

-- Example 3: Add expense categories only
SELECT seed_expense_categories('YOUR-SCHOOL-ID');

-- Example 4: Add departments only
SELECT seed_departments('YOUR-SCHOOL-ID');

-- Example 5: Add subjects only
SELECT seed_subjects('YOUR-SCHOOL-ID');

-- Example 6: Check what was created
SELECT * FROM classes WHERE school_id = 'YOUR-SCHOOL-ID';
SELECT * FROM expense_categories WHERE school_id = 'YOUR-SCHOOL-ID';
SELECT * FROM departments WHERE school_id = 'YOUR-SCHOOL-ID';
SELECT * FROM subjects WHERE school_id = 'YOUR-SCHOOL-ID';
*/

-- ========================================
-- NOTES
-- ========================================
-- 1. Replace 'YOUR-SCHOOL-ID' with actual UUID from schools table
-- 2. These functions are safe to run multiple times (ON CONFLICT DO NOTHING)
-- 3. For production, run complete_school_setup() for new schools
-- 4. Sample data section is commented out - uncomment for testing
