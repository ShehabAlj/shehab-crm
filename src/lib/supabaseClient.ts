import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. Data operations will fail.");
}

// Client for usage in Client Components (respects RLS, requires Auth)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin Client for usage in Server Components/API Routes (bypasses RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (serviceRoleKey) {
    console.log("Initializing Supabase Admin with Service Role Key (Length: " + serviceRoleKey.length + ")");
} else {
    console.warn("Initializing Supabase Admin with Anon Key (Service Role Key missing)");
}

export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : supabase; // Fallback to anon (will fail RLS if not public)
