import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE as string | undefined;

export const supabase = createClient(supabaseUrl, (anonKey || serviceRole || '')); // read on client/server

export const supabaseAdmin = serviceRole
  ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
  : createClient(supabaseUrl, anonKey || '', { auth: { persistSession: false } });




