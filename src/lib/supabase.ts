import { createSupaClient } from 'jsos-js';

const anonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXBianZudGhydndzYWxwZ3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAzNjc3MjgsImV4cCI6MTk5NTk0MzcyOH0.MNHoeNYDvRvu-fz2q6V-mzMmRrCCNCVPpK97gZihlZs";
 
const supabaseEnvKey = typeof window === "undefined" ?  process.env.SUPABASE_SERVICE_ROLE_KEY : null;

const supabaseKey = supabaseEnvKey ? supabaseEnvKey : anonKey;

// Assumes supabase SchemaName "public"
const supabase = createSupaClient(
    "https://qimpbjvnthrvwsalpgsy.supabase.co",
    supabaseKey
);

export default supabase;
