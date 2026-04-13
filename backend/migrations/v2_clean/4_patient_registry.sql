-- ============================================================
-- MediNest V2: Patient Registry
-- Date: 2026-04-13
-- ============================================================

-- 1. Patients Table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT NOT NULL, -- 10-digit phone
    age INTEGER,
    gender TEXT,
    blood_group TEXT,
    address TEXT,
    weight DECIMAL,
    medical_history JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Performance Indexes
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_patients_contact ON public.patients(contact);
CREATE INDEX idx_patients_name ON public.patients(name);

-- 3. Loophole Fix: Unique patients PER CLINIC (Name + Contact combination)
-- This prevents duplicates within a single clinic while allowing the same person
-- to be registered independently in different clinics.
CREATE UNIQUE INDEX idx_patients_uniqueness ON public.patients (clinic_id, name, contact);

-- 4. Automatic Timestamp Trigger
CREATE TRIGGER tr_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
