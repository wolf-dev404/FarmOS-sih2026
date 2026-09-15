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

-- Buyers update policy
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

-- ==========================================================
-- Phase 2a: Crops Reference & Produce Lots
-- ==========================================================

-- Crops reference table
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'quintal',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Produce lots table
CREATE TABLE IF NOT EXISTS public.lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'quintal',
    grade TEXT,
    price_expectation NUMERIC CHECK (price_expectation IS NULL OR price_expectation >= 0),
    available_from DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

-- Crops policies (publicly readable by everyone)
DROP POLICY IF EXISTS "Crops select policy" ON public.crops;
CREATE POLICY "Crops select policy" ON public.crops
    FOR SELECT USING (true);

-- Lots policies
-- Anyone can view active lots, and farmers can view all their own lots
DROP POLICY IF EXISTS "Lots read policy" ON public.lots;
CREATE POLICY "Lots read policy" ON public.lots
    FOR SELECT USING (status = 'active' OR (select auth.uid()) = farmer_id);

-- Farmers can insert lots with their own farmer_id
DROP POLICY IF EXISTS "Farmers insert lots policy" ON public.lots;
CREATE POLICY "Farmers insert lots policy" ON public.lots
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = farmer_id);

-- Farmers can update their own lots
DROP POLICY IF EXISTS "Farmers update lots policy" ON public.lots;
CREATE POLICY "Farmers update lots policy" ON public.lots
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = farmer_id)
    WITH CHECK ((select auth.uid()) = farmer_id);

-- Farmers can delete their own lots
DROP POLICY IF EXISTS "Farmers delete lots policy" ON public.lots;
CREATE POLICY "Farmers delete lots policy" ON public.lots
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = farmer_id);

-- Seed crops
INSERT INTO public.crops (name, category, unit) VALUES
    ('Tomato', 'Vegetable', 'quintal'),
    ('Onion', 'Vegetable', 'quintal'),
    ('Potato', 'Vegetable', 'quintal'),
    ('Wheat', 'Grain', 'quintal'),
    ('Rice', 'Grain', 'quintal'),
    ('Cotton', 'Cash Crop', 'quintal'),
    ('Sugarcane', 'Cash Crop', 'ton'),
    ('Maize', 'Grain', 'quintal'),
    ('Soybean', 'Oilseed', 'quintal'),
    ('Groundnut', 'Oilseed', 'quintal'),
    ('Turmeric', 'Spice', 'quintal'),
    ('Chili', 'Spice', 'quintal'),
    ('Banana', 'Fruit', 'quintal'),
    ('Mango', 'Fruit', 'crate'),
    ('Cauliflower', 'Vegetable', 'quintal')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    unit = EXCLUDED.unit;

-- ==========================================================
-- Phase 2b: Market Prices (APMC Mandi Rates)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    min_price NUMERIC,
    max_price NUMERIC,
    modal_price NUMERIC NOT NULL,
    price_date DATE NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_commodity_market_date UNIQUE (commodity, market, price_date)
);

CREATE INDEX IF NOT EXISTS idx_market_prices_commodity_date ON public.market_prices (commodity, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_district ON public.market_prices (state, district);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market prices select policy" ON public.market_prices;
CREATE POLICY "Market prices select policy" ON public.market_prices
    FOR SELECT USING (true);

