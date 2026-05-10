import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Read-only client — safe for server components and client components. */
export const supabase = createClient(url, anon);

/** Write client — server-side only (cron, API routes). Never expose to browser. */
export const supabaseAdmin = createClient(url, service);
