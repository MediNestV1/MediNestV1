-- ============================================================
-- MediNest V2: Medication & Pharmacy
-- Date: 2026-04-13
-- ============================================================

-- 1. Global Medicines (Pre-populated list for autocomplete)
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT, -- e.g. Antibiotic, Painkiller
    default_dosage TEXT,
    common_side_effects TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clinic Inventory (Optional: If a clinic has its own pharmacy)
CREATE TABLE public.clinic_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    price DECIMAL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(clinic_id, medicine_name)
);

CREATE TRIGGER tr_inventory_updated BEFORE UPDATE ON public.clinic_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
