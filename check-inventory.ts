import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: runs, error: runsErr } = await supabase.from('tcg_runs').select('*').eq('status', 'active');
  if (runsErr) console.error("Error fetching runs:", runsErr);
  console.log('Active Runs:', runs);
  
  if (runs && runs.length > 0) {
    for (const r of runs) {
      const { data: inv } = await supabase.from('tcg_pack_inventory').select('*').eq('run_id', r.id);
      console.log(`Inventory for ${r.id}:`, inv);
    }
  }
}

run().catch(console.error);
