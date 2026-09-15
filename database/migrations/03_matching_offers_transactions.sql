-- ==========================================================
-- Migration 03: Buyer Requirements, Offers & Transactions
-- FarmOS — Team NEXUS | SIH 2026 (PS 26132)
-- ==========================================================

-- 1. Buyer Requirements Table
CREATE TABLE IF NOT EXISTS public.buyer_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    quantity_needed NUMERIC NOT NULL CHECK (quantity_needed > 0),
    unit TEXT NOT NULL DEFAULT 'quintal',
    quality_spec TEXT,
    max_price NUMERIC CHECK (max_price IS NULL OR max_price >= 0),
    needed_by DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_requirements_crop ON public.buyer_requirements (crop_id, status);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_buyer ON public.buyer_requirements (buyer_id);

ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer requirements read policy" ON public.buyer_requirements;
CREATE POLICY "Buyer requirements read policy" ON public.buyer_requirements
    FOR SELECT USING (status = 'active' OR (select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Buyers insert requirement policy" ON public.buyer_requirements;
CREATE POLICY "Buyers insert requirement policy" ON public.buyer_requirements
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Buyers update requirement policy" ON public.buyer_requirements;
CREATE POLICY "Buyers update requirement policy" ON public.buyer_requirements
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = buyer_id)
    WITH CHECK ((select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Buyers delete requirement policy" ON public.buyer_requirements;
CREATE POLICY "Buyers delete requirement policy" ON public.buyer_requirements
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = buyer_id);


-- 2. Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    offered_price NUMERIC NOT NULL CHECK (offered_price >= 0),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_lot ON public.offers (lot_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers (buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_farmer ON public.offers (farmer_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Offers read policy" ON public.offers;
CREATE POLICY "Offers read policy" ON public.offers
    FOR SELECT USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id);

DROP POLICY IF EXISTS "Buyers insert offers policy" ON public.offers;
CREATE POLICY "Buyers insert offers policy" ON public.offers
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Participants update offers policy" ON public.offers;
CREATE POLICY "Participants update offers policy" ON public.offers
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id)
    WITH CHECK ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id);


-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL UNIQUE REFERENCES public.offers(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    final_price NUMERIC NOT NULL CHECK (final_price >= 0),
    final_quantity NUMERIC NOT NULL CHECK (final_quantity > 0),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_parties ON public.transactions (buyer_id, farmer_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions read policy" ON public.transactions;
CREATE POLICY "Transactions read policy" ON public.transactions
    FOR SELECT USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id);

DROP POLICY IF EXISTS "Participants insert transactions policy" ON public.transactions;
CREATE POLICY "Participants insert transactions policy" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id);

DROP POLICY IF EXISTS "Participants update transactions policy" ON public.transactions;
CREATE POLICY "Participants update transactions policy" ON public.transactions
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id)
    WITH CHECK ((select auth.uid()) = buyer_id OR (select auth.uid()) = farmer_id);
