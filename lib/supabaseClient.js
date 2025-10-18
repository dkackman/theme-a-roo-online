import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Create a Supabase client for use in Client Components
// This uses cookies for auth state, which works better with SSR
export const supabase = createClientComponentClient();
