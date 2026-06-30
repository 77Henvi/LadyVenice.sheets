// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://nrmnahfsqqwyuqzareor.supabase.co';
const supabaseKey = 'sb_publishable_UyL_StRZr363Cof4NBqxIg_mGigxG3f';

export const supabase = createClient(supabaseUrl, supabaseKey);