-- Combined MediNest Migrations (2026-04-12)

-- 1. Add vitals and address to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_pressure TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;

-- 2. Ensure contact column (for older schemas)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='contact') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='mobile') THEN
            ALTER TABLE patients RENAME COLUMN mobile TO contact;
        ELSE
            ALTER TABLE patients ADD COLUMN IF NOT EXISTS contact TEXT;
        END IF;
    END IF;
END $$;

-- 3. Add doctor profile fields
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 4. Add doctor license expiry
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- 5. Add patient history
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '[]';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]';
