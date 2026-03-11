import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yifeqanwapyqcgsnehoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZmVxYW53YXB5cWNnc25laG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY5MDQsImV4cCI6MjA4ODczMjkwNH0.GgjuQD1JX4EA57VGjeIyljEGDSzxxDnVFWv3dQhB154';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'skoolvyn-auth',
  },
});
