-- ============================================================
-- MediNest V2: Daily Queue System
-- Date: 2026-04-13
-- ============================================================

-- 1. Doctor Queue
CREATE TABLE public.doctor_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT, -- Denormalized for rapid lookup
    token_number INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'done', 'skipped')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'elderly')),
    queue_date DATE DEFAULT CURRENT_DATE,
    serving_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Scoping Index: Ensure fast performance for today's active patients
CREATE INDEX idx_dq_active ON public.doctor_queue (clinic_id, queue_date, status);

-- 3. Loophole Fix: Unique token per clinic per day
-- This prevents token collisions during high-volume periods.
CREATE UNIQUE INDEX idx_dq_token_unique ON public.doctor_queue (clinic_id, queue_date, token_number);

-- 4. Realtime Activation
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_queue;
