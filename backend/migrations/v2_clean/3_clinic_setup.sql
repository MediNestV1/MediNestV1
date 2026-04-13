-- ============================================================
-- MediNest V2: Clinic & Provider Setup
-- Date: 2026-04-13
-- ============================================================

-- 1. Clinics Table (The root of our multi-tenant hierarchy)
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL, -- Links to auth.users
    name TEXT NOT NULL,
    name_hindi TEXT,
    tagline TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    status clinic_status DEFAULT 'active',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Doctors Table (Profile persistent across multiple clinics)
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- If they have a login
    name TEXT NOT NULL,
    specialty TEXT,
    qualification TEXT,
    experience_years INTEGER,
    registration_number TEXT,
    license_expiry_date DATE,
    profile_photo_url TEXT,
    bio TEXT,
    contact_email TEXT,
    contact TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Clinic-Doctor Mapping (The bridge table for multi-location doctors)
CREATE TABLE public.clinic_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    timings TEXT,
    fees DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(clinic_id, doctor_id)
);

-- 4. Automatic Timestamp Triggers
CREATE TRIGGER tr_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
