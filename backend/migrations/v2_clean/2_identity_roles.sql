-- ============================================================
-- MediNest V2: Identity & Roles
-- Date: 2026-04-13
-- ============================================================

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'doctor', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.clinic_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Audit Function (Reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
