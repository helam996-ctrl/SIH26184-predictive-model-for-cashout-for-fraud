/**
 * CyberSuraksha - Supabase Client Initialization
 * 
 * Provides type-safe Supabase PostgreSQL client for:
 * - Real-time fraud complaint sync
 * - Officer directory & session validation
 * - Section 102 BNSS legal hold persistence
 * - Dispatch logs & audit trail
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://zjmncuylypfkbzjwbail.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_d6XTBwMfVWz5kms_IA4ctA_0ngk6Mbm";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && !rawUrl.includes("placeholder")) ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (rawKey && !rawKey.includes("placeholder")) ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
