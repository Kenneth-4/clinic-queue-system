-- Clinic Queue System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create queue table
CREATE TABLE IF NOT EXISTS queue (
  id BIGSERIAL PRIMARY KEY,
  ticket_number INTEGER,
  patient_name TEXT,
  position INTEGER,
  status TEXT DEFAULT 'ongoing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample doctor data
INSERT INTO doctors (name, specialization, is_active) VALUES
('Dr. John Doe', 'General Medicine', true),
('Dr. Jane Smith', 'Cardiology', true),
('Dr. Mike Johnson', 'Pediatrics', true)
ON CONFLICT DO NOTHING;

-- Insert sample queue data
INSERT INTO queue (ticket_number, patient_name, position, status) VALUES
(1, 'Alice Johnson', 1, 'ongoing'),
(2, 'Bob Smith', 2, 'ongoing'),
(3, 'Carol Davis', 3, 'ongoing')
ON CONFLICT DO NOTHING;

-- Create admin user (you'll need to sign up with this email)
-- Email: admin@clinic.com
-- Password: admin123 (or whatever you prefer)

-- Enable Row Level Security (RLS) for better security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON doctors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON queue
  FOR ALL USING (auth.role() = 'authenticated');
