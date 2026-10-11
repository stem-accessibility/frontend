import { createClient } from "@supabase/supabase-js";

/**
 * Local development without a Supabase project: set VITE_AUTH_MODE=dev (and run the
 * backend with AUTH_MODE=dev). Everyone is signed in as a fixed local user, and no
 * network call is made to Supabase. Ignored by production builds.
 */
export const DEV_AUTH =
  import.meta.env.VITE_AUTH_MODE === "dev" && !import.meta.env.PROD;

const supabaseUrl = DEV_AUTH
  ? "http://localhost:0"
  : (import.meta.env.VITE_SUPABASE_URL as string);
const supabaseAnonKey = DEV_AUTH
  ? "dev"
  : (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
