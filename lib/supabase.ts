import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcazbaggfdejukjgkpeu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYXpiYWdnZmRlanVramdrcGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTE4MjgsImV4cCI6MjA2OTI2NzgyOH0.nRiCK9o830N-ZXvVALxTd2pLkDRQIZ8aCnnlo48IA5M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
