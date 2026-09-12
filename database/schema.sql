-- ==========================================================
-- FarmOS Database Schema
-- Team: NEXUS | SIH 2026 (Problem Statement 26132)
-- Database: PostgreSQL (Supabase)
-- ==========================================================

-- Phase 1: Profiles & Role-based Entities

-- Farmers profile table
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    village TEXT,
    district TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Buyers profile table
CREATE TABLE IF NOT EXISTS public.buyers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    company_name TEXT,
    buyer_type TEXT CHECK (buyer_type IN ('individual', 'trader', 'FPO', 'processor')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Farmers RLS Policies
DROP POLICY IF EXISTS "Farmers select policy" ON public.farmers;
CREATE POLICY "Farmers select policy" ON public.farmers
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Farmers insert policy" ON public.farmers;
CREATE POLICY "Farmers insert policy" ON public.farmers
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Farmers update policy" ON public.farmers;
CREATE POLICY "Farmers update policy" ON public.farmers
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- Buyers RLS Policies
DROP POLICY IF EXISTS "Buyers select policy" ON public.buyers;
CREATE POLICY "Buyers select policy" ON public.buyers
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Buyers insert policy" ON public.buyers;
CREATE POLICY "Buyers insert policy" ON public.buyers
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Buyers update policy" ON public.buyers;
CREATE POLICY "Buyers update policy" ON public.buyers
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- Auto-provision profile from auth metadata trigger (defense-in-depth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'farmer');
    
    IF user_role = 'farmer' THEN
        INSERT INTO public.farmers (id, name, phone, village, district, state)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', ''),
            COALESCE(new.raw_user_meta_data->>'phone', ''),
            COALESCE(new.raw_user_meta_data->>'village', ''),
            COALESCE(new.raw_user_meta_data->>'district', ''),
            COALESCE(new.raw_user_meta_data->>'state', '')
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            village = EXCLUDED.village,
            district = EXCLUDED.district,
            state = EXCLUDED.state;
    ELSIF user_role = 'buyer' THEN
        INSERT INTO public.buyers (id, name, phone, company_name, buyer_type)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', ''),
            COALESCE(new.raw_user_meta_data->>'phone', ''),
            COALESCE(new.raw_user_meta_data->>'company_name', ''),
            COALESCE(new.raw_user_meta_data->>'buyer_type', 'individual')
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            company_name = EXCLUDED.company_name,
            buyer_type = EXCLUDED.buyer_type;
    END IF;
    
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
