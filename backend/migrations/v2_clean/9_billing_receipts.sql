-- ============================================================
-- MediNest V2: Billing & Receipts
-- Date: 2026-04-13
-- ============================================================

-- 1. Receipts Table
CREATE TABLE public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT,
    patient_phone TEXT,
    receipt_number TEXT NOT NULL UNIQUE,
    doctor_name TEXT,
    items JSONB DEFAULT '[]', -- List of {item, quantity, price, discount}
    total_amount DECIMAL NOT NULL DEFAULT 0,
    payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'Online', 'Card', 'Other')),
    printed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for financial reporting (Today's revenue)
CREATE INDEX idx_receipts_reporting ON public.receipts (clinic_id, printed_at);
