-- MediNest Security Hardening Migration
-- Date: 2026-04-13
-- Description: Enables RLS and sets up initial security policies for all clinical tables.

-- 1. ENABLE ROW LEVEL SECURITY
ALTER TABLE IF EXISTS clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctor_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medicines ENABLE ROW LEVEL SECURITY;

-- 2. DEFINE POLICIES

-- Policy: Clinics are only viewable/editable by their owner
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clinics are viewable by owners' AND tablename = 'clinics') THEN
        CREATE POLICY "Clinics are viewable by owners" 
        ON clinics FOR ALL 
        USING (auth.uid() = owner_user_id);
    END IF;
END $$;

-- Policy: Prescriptions secure access (Doctor level)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors manage their own prescriptions' AND tablename = 'prescriptions') THEN
        CREATE POLICY "Doctors manage their own prescriptions"
        ON prescriptions FOR ALL
        TO authenticated
        USING (auth.uid() = doctor_id);
    END IF;
END $$;

-- Policy: Patients (Initial permissive policy for authenticated professionals)
-- Note: This should be refined to clinic-level isolation in a future update
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view patients' AND tablename = 'patients') THEN
        CREATE POLICY "Authenticated users can view patients"
        ON patients FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- 3. PERMISSIONS CLEANUP
-- Revoke all public access to the public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
