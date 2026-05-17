const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tfnysxaxngwrwmhlhjhp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiNzdXBhYmFzZSIsInJlZiI6InRmbnlzeGF4bmd3cndtaGxoamhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4OTY2MiwiZXhwIjoyMDkzNzY1NjYyfQ.luyIqJMoi8kv8GJnEZF2nhD9wmrhPFRezIMjl-k42A4'
);

async function check() {
  // Check delivery_platforms columns
  const { data: dpData, error: dpError } = await supabase
    .from('delivery_platforms')
    .select('simulation_mode')
    .limit(1);
  
  console.log('delivery_platforms.simulation_mode:', dpError?.code || 'EXISTS');
  
  // Check stores table
  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('merchant_supplied_id')
    .limit(1);
  
  console.log('stores.merchant_supplied_id:', storesError?.code || 'EXISTS');
  
  // Check sales_reports table
  const { data: srData, error: srError } = await supabase
    .from('sales_reports')
    .select('delivery_ids')
    .limit(1);
  
  console.log('sales_reports.delivery_ids:', srError?.code || 'EXISTS');
}

check();