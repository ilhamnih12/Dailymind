import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

if (typeof window !== 'undefined' && (supabaseUrl === 'https://placeholder.supabase.co')) {
    console.warn("Supabase credentials are not set in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
