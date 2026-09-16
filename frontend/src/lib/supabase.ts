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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
