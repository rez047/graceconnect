import { createClient } from '@supabase/supabase-js';

// ⬇️ REPLACE with your values (Supabase → Settings → API)
const SUPABASE_URL = 'https://amnskvvpwobxfdgnuvdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbnNrdnZwd29ieGZkZ251dmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjI0NDEsImV4cCI6MjEwMzgzODQ0MX0.K1rgEYRI_KDREgEWJZvt8XpVXp_ap19oaABmuBvO6YQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);