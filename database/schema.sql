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
