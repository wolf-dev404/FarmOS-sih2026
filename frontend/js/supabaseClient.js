/**
 * FarmOS - Supabase Client
 * Team: NEXUS | SIH 2026 (Problem Statement 26132)
 * 
 * Supports both Vite module environments (import.meta.env)
 * and direct browser/static server execution.
 */

// Safe retrieval of environment variables
const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_SUPABASE_URL) ||
  'https://uswcslpxvelkidxgkvgh.supabase.co';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzd2NzbHB4dmVsa2lkeGdrdmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDYwMzMsImV4cCI6MjEwNDcyMjAzM30.Jxmd6mqtZDuY3JYN-OI1Bqv2MbHgGstBmXYsZcOwGqM';

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  // Check if loaded via global script tag
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseInstance;
    return supabaseInstance;
  }

  throw new Error('Supabase client library not loaded. Ensure @supabase/supabase-js is included.');
}

// Automatically initialize if window.supabase is available
if (typeof window !== 'undefined') {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase globally:', err);
    }
  }
}

export const supabase = supabaseInstance;
export default getSupabase;
