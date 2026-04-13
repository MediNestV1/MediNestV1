-- ============================================================
-- MediNest V2: Clinical Documentation
-- Date: 2026-04-13
-- ============================================================

-- 1. Prescriptions Table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    complaints TEXT,
    diagnosis TEXT,
    medicines JSONB DEFAULT '[]', -- Array of {name, dosage, duration, timing}
    advice TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Investigations Table (Tests & Labs)
CREATE TABLE public.investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    results TEXT,
    lab_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Automatic Timestamp Trigger
CREATE TRIGGER tr_prescriptions_updated BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
