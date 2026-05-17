const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tfnysxaxngwrwmhlhjhp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnlzeGF4bmd3cndtaGxoamhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4OTY2MiwiZXhwIjoyMDkzNzY1NjYyfQ.luyIqJMoi8kv8GJnEZF2nhD9wmrhPFRezIMjl-k42A4'
);

async function test() {
  // Test data operation (this works with service role)
  const { data, error } = await supabase
    .from('delivery_platforms')
    .select('*')
    .limit(3);

  console.log('Data from delivery_platforms:', data);
  console.log('Error:', error);
}

test();