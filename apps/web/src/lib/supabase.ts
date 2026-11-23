import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** null when the .env.local file is missing. The app then works fully offline. */
export const supabase = url && key ? createClient(url, key) : null;
export const cloudEnabled = supabase !== null;