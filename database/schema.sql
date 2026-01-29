-- ========================================
-- SCOTECH SMS - DATABASE SCHEMA
-- Multi-Tenant School Management System
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. SCHOOLS TABLE (Multi-Tenant)
-- ========================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  motto TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  subscription_plan TEXT DEFAULT 'basic', -- basic, premium, enterprise
  subscription_expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. USERS TABLE (Multi-School Support)
-- ========================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL, -- super_admin, school_admin, teacher, accountant, support
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, school_id)
);

-- ========================================
-- 3. CLASSES TABLE
-- ========================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL, -- 1-12 for ordering
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- ========================================
-- 4. TERMS TABLE
-- ========================================
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, year, term)
);

-- ========================================
-- 5. LEARNERS TABLE (Enhanced)
-- ========================================
CREATE TABLE learners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  admission_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  date_of_birth DATE,
  class_id UUID REFERENCES classes(id),
  photo_url TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  medical_info TEXT,
  active BOOLEAN DEFAULT true,
  graduated BOOLEAN DEFAULT false,
  graduation_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, admission_no)
);

-- ========================================
-- 6. FEES TABLE
-- ========================================
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, class_id, term_id)
);

-- ========================================
-- 7. CUSTOM FEES TABLE
-- ========================================
CREATE TABLE custom_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  custom_amount DECIMAL(10, 2) NOT NULL,
  fee_type TEXT NOT NULL, -- full_sponsorship, partial_sponsorship, custom_amount
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, learner_id, term_id)
);

-- ========================================
-- 8. PAYMENTS TABLE
-- ========================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reference_no TEXT,
  payment_method TEXT DEFAULT 'cash', -- cash, mpesa, bank, cheque
  received_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 9. DEPARTMENTS TABLE
-- ========================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- ========================================
-- 10. STAFF TABLE
-- ========================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  staff_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  id_number TEXT,
  kra_pin TEXT,
  department_id UUID REFERENCES departments(id),
  position TEXT NOT NULL, -- Teacher, Principal, Admin, etc.
  employment_type TEXT DEFAULT 'permanent', -- permanent, contract, part_time
  date_employed DATE,
  photo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, staff_no)
);

-- ========================================
-- 11. SUBJECTS TABLE
-- ========================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, code)
);

-- ========================================
-- 12. TIMETABLE TABLE
-- ========================================
CREATE TABLE timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Monday, 5=Friday
  period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 10),
  start_time TIME,
  end_time TIME,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, term_id, class_id, day_of_week, period_number)
);

-- ========================================
-- 13. DUTY ROSTER TABLE
-- ========================================
CREATE TABLE duty_roster (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  duty_type TEXT NOT NULL, -- morning_duty, lunch_duty, games_duty, etc.
  duty_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 14. EXPENSE CATEGORIES TABLE
-- ========================================
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- ========================================
-- 15. EXPENSES TABLE
-- ========================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id),
  expense_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT,
  receipt_no TEXT,
  payment_method TEXT,
  recorded_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 16. SMS LOGS TABLE
-- ========================================
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES user_profiles(id),
  recipient_type TEXT NOT NULL, -- parents, staff, class, individual
  recipient_filter JSONB, -- Store filter criteria
  message TEXT NOT NULL,
  total_recipients INTEGER,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, sending, completed, failed
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 17. SMS RECIPIENTS TABLE
-- ========================================
CREATE TABLE sms_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sms_log_id UUID REFERENCES sms_logs(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_learners_school ON learners(school_id);
CREATE INDEX idx_learners_class ON learners(class_id);
CREATE INDEX idx_learners_active ON learners(school_id, active);
CREATE INDEX idx_payments_learner ON payments(learner_id);
CREATE INDEX idx_payments_term ON payments(term_id);
CREATE INDEX idx_staff_school ON staff(school_id);
CREATE INDEX idx_staff_active ON staff(school_id, active);
CREATE INDEX idx_timetable_class ON timetable(class_id, day_of_week);
CREATE INDEX idx_expenses_school ON expenses(school_id);
CREATE INDEX idx_expenses_date ON expenses(school_id, expense_date);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only access their school's data)
CREATE POLICY "Users can view their school" ON schools
  FOR SELECT USING (
    id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school data" ON learners
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school classes" ON classes
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school terms" ON terms
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school fees" ON fees
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school payments" ON payments
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school staff" ON staff
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users access their school expenses" ON expenses
  FOR ALL USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
  );

-- ========================================
-- SEED DATA (Example)
-- ========================================

-- Insert default classes structure
CREATE OR REPLACE FUNCTION seed_classes(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO classes (school_id, name, level) VALUES
    (p_school_id, 'Pre-Unit', 0),
    (p_school_id, 'Grade 1', 1),
    (p_school_id, 'Grade 2', 2),
    (p_school_id, 'Grade 3', 3),
    (p_school_id, 'Grade 4', 4),
    (p_school_id, 'Grade 5', 5),
    (p_school_id, 'Grade 6', 6),
    (p_school_id, 'Grade 7', 7),
    (p_school_id, 'Grade 8', 8),
    (p_school_id, 'Grade 9', 9);
END;
$$ LANGUAGE plpgsql;

-- Insert default expense categories
CREATE OR REPLACE FUNCTION seed_expense_categories(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO expense_categories (school_id, name, description) VALUES
    (p_school_id, 'Salaries & Wages', 'Staff payments'),
    (p_school_id, 'Utilities', 'Water, electricity, internet'),
    (p_school_id, 'Learning Materials', 'Books, stationery, teaching aids'),
    (p_school_id, 'Maintenance', 'Repairs and upkeep'),
    (p_school_id, 'Transport', 'Fuel, vehicle maintenance'),
    (p_school_id, 'Food & Catering', 'Student meals, events'),
    (p_school_id, 'Administrative', 'Office supplies, licenses'),
    (p_school_id, 'Events & Activities', 'Sports, trips, celebrations'),
    (p_school_id, 'Other', 'Miscellaneous expenses');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learners_updated_at BEFORE UPDATE ON learners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for learner fee summary
CREATE OR REPLACE VIEW v_learner_fee_summary AS
SELECT 
  l.id AS learner_id,
  l.school_id,
  l.admission_no,
  l.first_name || ' ' || l.last_name AS full_name,
  c.name AS class_name,
  t.year,
  t.term,
  COALESCE(cf.custom_amount, f.amount, 0) AS total_fees,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  COALESCE(cf.custom_amount, f.amount, 0) - COALESCE(SUM(p.amount), 0) AS balance
FROM learners l
LEFT JOIN classes c ON l.class_id = c.id
CROSS JOIN LATERAL (SELECT * FROM terms WHERE school_id = l.school_id AND active = true LIMIT 1) t
LEFT JOIN fees f ON f.class_id = l.class_id AND f.term_id = t.id
LEFT JOIN custom_fees cf ON cf.learner_id = l.id AND cf.term_id = t.id
LEFT JOIN payments p ON p.learner_id = l.id AND p.term_id = t.id
WHERE l.active = true
GROUP BY l.id, l.school_id, l.admission_no, l.first_name, l.last_name, 
         c.name, t.year, t.term, cf.custom_amount, f.amount;

COMMENT ON VIEW v_learner_fee_summary IS 'Fee summary for all active learners with balances';
