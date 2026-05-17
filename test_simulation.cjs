const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tfnysxaxngwrwmhlhjhp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiNzdXBhYmFzZSIsInJlZiI6InRmbnlzeGF4bmd3cndtaGxoamhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4OTY2MiwiZXhwIjoyMDkzNzY1NjYyfQ.luyIqJMoi8kv8GJnEZF2nhD9wmrhPFRezIMjl-k42A4'
);

async function testSimulation() {
  const clientId = '00000000-0000-0000-0000-000000000000';
  
  // 1. Enable simulation mode for DoorDash
  console.log('\n=== Enabling Simulation Mode ===');
  const { data: platform, error: platformError } = await supabase
    .from('delivery_platforms')
    .upsert({
      client_id: clientId,
      platform_name: 'doordash',
      is_master_account: true,
      simulation_mode: true
    }, { onConflict: 'client_id,platform_name' })
    .select()
    .single();
  
  console.log('Platform:', platform);
  console.log('Error:', platformError);
  
  // 2. Insert mock stores
  console.log('\n=== Inserting Mock Stores ===');
  const mockStores = [
    { client_id: clientId, platform_id: platform?.id, merchant_supplied_id: 'KENNEDY-001', platform_store_id: 'dd-kc-001', store_name: 'Kennedy Chicken - Downtown', is_active: true },
    { client_id: clientId, platform_id: platform?.id, merchant_supplied_id: 'KENNEDY-002', platform_store_id: 'dd-kc-002', store_name: 'Kennedy Chicken - Midtown', is_active: true },
    { client_id: clientId, platform_id: platform?.id, merchant_supplied_id: 'KENNEDY-003', platform_store_id: 'dd-kc-003', store_name: 'Kennedy Chicken - FiDi', is_active: true },
  ];
  
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .upsert(mockStores, { onConflict: 'platform_store_id' })
    .select();
  
  console.log('Stores inserted:', stores?.length, 'stores');
  console.log('Error:', storesError);
  
  // 3. Insert sales report
  console.log('\n=== Inserting Sales Report ===');
  const today = new Date().toISOString().split('T')[0];
  const { data: report, error: reportError } = await supabase
    .from('sales_reports')
    .upsert({
      client_id: clientId,
      store_id: stores?.[0]?.id,
      merchant_supplied_id: 'KENNEDY-001',
      report_date: today,
      revenue: 1850.00,
      orders: 67,
      delivery_ids: ['DEL-KENNEDY-001-2026-05-13-0001', 'DEL-KENNEDY-001-2026-05-13-0002'],
      platform: 'doordash'
    }, { onConflict: 'store_id,report_date' })
    .select()
    .single();
  
  console.log('Report:', report);
  console.log('Error:', reportError);
  
  console.log('\n=== Simulation Mode Ready! ===');
}

testSimulation();