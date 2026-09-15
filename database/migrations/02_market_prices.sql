-- ==========================================================
-- Migration 02: Market Prices Table & Policies
-- FarmOS — Team NEXUS | SIH 2026 (PS 26132)
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
