-- MediNest Permission Fix: Clinic-Specific Isolation
-- Date: 2026-04-13
-- Ensures only clinic owners can access/modify their own data.

-- 1. DROP OLD PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Clinics are viewable by owners" ON clinics;
DROP POLICY IF EXISTS "Doctors manage their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;

-- 2. SECURE CLINICS
-- Only owner can see/edit their clinic
CREATE POLICY "Clinic ownership access"
ON clinics FOR ALL
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- 3. SECURE PATIENTS
-- Users can only manage patients belonging to their own clinic
CREATE POLICY "Clinic isolation for patients"
ON patients FOR ALL
TO authenticated
USING (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
);

-- 4. SECURE DOCTOR QUEUE
-- Users can manage the queue for their own clinic
CREATE POLICY "Clinic isolation for doctor_queue"
ON doctor_queue FOR ALL
TO authenticated
USING (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
);

-- 5. SECURE PRESCRIPTIONS
-- Users can manage prescriptions for their own clinic
CREATE POLICY "Clinic isolation for prescriptions"
ON prescriptions FOR ALL
TO authenticated
USING (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
);

-- 6. SECURE PATIENT HISTORIES (AI Snapshots)
ALTER TABLE IF EXISTS patient_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic isolation for histories"
ON patient_histories FOR ALL
TO authenticated
USING (
  patient_id IN (SELECT id FROM patients WHERE clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid()))
);
