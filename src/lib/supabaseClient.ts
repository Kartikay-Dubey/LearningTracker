import { createClient } from '@supabase/supabase-js';

// Safe fallbacks prevent the module loader from entirely crashing the React render logic
// if the local .env is missing your specific keys.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://your-project.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
