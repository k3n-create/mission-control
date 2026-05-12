import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { supabase, supabaseAdmin } from './lib/supabase.js';

// DoorDash Drive API v2 - Fetch stores from master account
async function fetchDoorDashStores(apiKey, merchantId) {
  // DoorDash Drive API - Get store list
  // https://docs.doordash.com/drive-api/v2/reference/get-stores
  const response = await fetch('https://openapi.doordash.com/drive/v2/stores', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`DoorDash API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.stores || [];
}

// Uber Eats - Fetch stores from master account
async function fetchUberEatsStores(apiKey, merchantId) {
  // Uber Eats API - Get stores
  // https://developers.uber.com/eats/docs/v2/reference/get-stores
  const response = await fetch(`https://api.uber.com/eats/v2/businesses/${merchantId}/stores`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Uber Eats API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.stores || [];
}

// Fetch and sync stores for a delivery platform
async function syncStoresForPlatform(platformId, clientId, platformName, apiKey, merchantId) {
  let stores = [];
  
  try {
    if (platformName.toLowerCase() === 'doordash') {
      stores = await fetchDoorDashStores(apiKey, merchantId);
    } else if (platformName.toLowerCase() === 'ubereats') {
      stores = await fetchUberEatsStores(apiKey, merchantId);
    }
    // Grubhub integration can be added here
  } catch (error) {
    console.error(`Failed to fetch stores for ${platformName}:`, error.message);
    return { success: false, error: error.message };
  }
  
  // Store in database
  const storeRecords = stores.map(store => ({
    client_id: clientId,
    platform_id: platformId,
    platform_store_id: store.id || store.external_store_id,
    store_name: store.name || store.store_name,
    is_active: true,
    metadata: JSON.stringify(store)
  }));
  
  // Clear existing stores for this platform and insert new ones
  if (storeRecords.length > 0) {
    // Delete old stores first
    await supabaseAdmin.from('stores').delete().eq('platform_id', platformId);
    
    // Insert new stores
    const { error } = await supabaseAdmin.from('stores').insert(storeRecords);
    if (error) {
      console.error('Failed to store stores:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: true, count: storeRecords.length };
}

const app = express();
const PORT = process.env.PORT || 8080;
const TEST_ID = '5f80e462-ddfb-45fe-874d-7b36463b26d6';

app.use(cors());
app.use(express.json());

// ROOT ROUTE: Serves the dashboard
app.get('/', async (req, res) => {
 try {
 const html = await readFile('./index.html', 'utf-8');
 res.set('Content-Type', 'text/html').send(html);
 } catch (err) { res.status(500).send('index.html not found'); }
});

// GET /api/tasks: Returns raw array of tasks for this client
app.get('/api/tasks', async (req, res) => {
 try {
 const { data, error } = await supabase.from('tasks').select('*').eq('client_id', TEST_ID).order('created_at', { ascending: true });
 if (error) throw error;
 res.status(200).json(data || []);
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/tasks: High-speed Batch Upsert
app.post('/api/tasks', async (req, res) => {
 try {
 const { tasks } = req.body;
 if (!tasks) return res.status(400).send('No tasks provided');

 const dbTasks = tasks.map(t => ({
 id: (t.id && t.id.includes('-')) ? t.id : undefined, // Keep real UUIDs, let DB make new ones for timestamps
 client_id: TEST_ID,
 content: t.content || 'New Objective',
 status: (t.status || 'INBOX').toUpperCase(),
 description: t.description || '',
 tags: t.tags || [],
 assigned_agent: t.assigned_agent || ''
 }));

 const { error } = await supabase.from('tasks').upsert(dbTasks, { onConflict: 'id' });
 if (error) throw error;
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/integrations/save: Save delivery platform integration
// Uses service_role key (supabaseAdmin) to bypass RLS for admin operations
// When is_master_account is true, fetches and stores all associated stores
app.post('/api/integrations/save', async (req, res) => {
 try {
 const { client_id, platform_name, api_key_encrypted, merchant_id, is_master_account } = req.body;
 
 if (!client_id || !platform_name) {
 return res.status(400).json({ error: 'client_id and platform_name required' });
 }
 
 // Validate platform_name
 const validPlatforms = ['doordash', 'ubereats', 'grubhub'];
 if (!validPlatforms.includes(platform_name.toLowerCase())) {
 return res.status(400).json({ error: 'platform_name must be doordash, ubereats, or grubhub' });
 }
 
 // Build record - only include provided fields (Partial Update Mandate)
 const record = {
 client_id,
 platform_name: platform_name.toLowerCase(),
 };
 
 if (api_key_encrypted) record.api_key_encrypted = api_key_encrypted;
 if (merchant_id) record.merchant_id = merchant_id;
 if (is_master_account !== undefined) record.is_master_account = is_master_account;
 
 // Use admin client to bypass RLS
 const { data, error } = await supabaseAdmin
 .from('delivery_platforms')
 .upsert(record, { onConflict: 'client_id,platform_name' })
 .select();
 
 if (error) throw error;
 
 // If this is a master account with API key, fetch and sync stores
 let storeSyncResult = null;
 if (is_master_account && api_key_encrypted && merchant_id) {
   const platformId = data[0]?.id;
   if (platformId) {
     storeSyncResult = await syncStoresForPlatform(
       platformId, 
       client_id, 
       platform_name, 
       api_key_encrypted, 
       merchant_id
     );
   }
 }
 
 res.status(200).json({ 
   success: true, 
   data,
   stores_synced: storeSyncResult
 });
 } catch (error) { 
 res.status(500).json({ error: error.message }); 
 }
});

// GET /api/sales/report: Generate sales report looping through all stores
// Query params: client_id, start_date, end_date, platform_name (optional)
app.get('/api/sales/report', async (req, res) => {
 try {
   const { client_id, start_date, end_date, platform_name } = req.query;
   
   if (!client_id) {
     return res.status(400).json({ error: 'client_id required' });
   }
   
   // Get delivery platforms for this client
   let platformQuery = supabase
     .from('delivery_platforms')
     .select('id, platform_name, api_key_encrypted, merchant_id, is_master_account')
     .eq('client_id', client_id);
   
   if (platform_name) {
     platformQuery = platformQuery.eq('platform_name', platform_name.toLowerCase());
   }
   
   const { data: platforms, error: platformError } = await platformQuery;
   if (platformError) throw platformError;
   
   const allSalesData = [];
   
   for (const platform of platforms) {
     // Get all stores for this platform
     const { data: stores, error: storesError } = await supabase
       .from('stores')
       .select('*')
       .eq('platform_id', platform.id)
       .eq('is_active', true);
     
     if (storesError) {
       console.error(`Error fetching stores for platform ${platform.id}:`, storesError);
       continue;
     }
     
     // Loop through each store and get sales data
     for (const store of stores) {
       // TODO: Call platform-specific sales API for each store
       // For now, structure the data ready for sales aggregation
       allSalesData.push({
         platform: platform.platform_name,
         platform_id: platform.id,
         store_id: store.id,
         platform_store_id: store.platform_store_id,
         store_name: store.store_name,
         // Sales data would be fetched here from platform APIs
         // For DoorDash: https://docs.doordash.com/drive-api/v2/reference/get-orders
         // For UberEats: https://developers.uber.com/eats/docs/v2/reference/get-orders
         sales: [], // To be populated by platform API
         start_date: start_date,
         end_date: end_date
       });
     }
   }
   
   res.status(200).json({
     client_id,
     platform_count: platforms.length,
     store_count: allSalesData.length,
     stores: allSalesData
   });
   
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
});

// GET /api/stores: Get all stores for a client (optionally filtered by platform)
app.get('/api/stores', async (req, res) => {
 try {
   const { client_id, platform_id, platform_name } = req.query;
   
   if (!client_id) {
     return res.status(400).json({ error: 'client_id required' });
   }
   
   // If platform_name provided, get platform_id first
   let targetPlatformId = platform_id;
   if (platform_name && !platform_id) {
     const { data: platformData } = await supabase
       .from('delivery_platforms')
       .select('id')
       .eq('client_id', client_id)
       .eq('platform_name', platform_name.toLowerCase())
       .single();
     
     if (platformData) {
       targetPlatformId = platformData.id;
     }
   }
   
   // Build query
   let query = supabase
     .from('stores')
     .select('*')
     .eq('client_id', client_id);
   
   if (targetPlatformId) {
     query = query.eq('platform_id', targetPlatformId);
   }
   
   const { data, error } = await query;
   if (error) throw error;
   
   res.status(200).json(data || []);
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
});

// POST /api/stores/sync: Manually trigger store sync for a platform
app.post('/api/stores/sync', async (req, res) => {
 try {
   const { client_id, platform_name } = req.body;
   
   if (!client_id || !platform_name) {
     return res.status(400).json({ error: 'client_id and platform_name required' });
   }
   
   // Get platform with API key
   const { data: platform, error } = await supabase
     .from('delivery_platforms')
     .select('*')
     .eq('client_id', client_id)
     .eq('platform_name', platform_name.toLowerCase())
     .single();
   
   if (error) throw error;
   if (!platform) {
     return res.status(404).json({ error: 'Platform not found' });
   }
   
   const result = await syncStoresForPlatform(
     platform.id,
     client_id,
     platform.platform_name,
     platform.api_key_encrypted,
     platform.merchant_id
   );
   
   res.status(200).json(result);
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
});

app.delete('/api/tasks/:id', async (req, res) => {
 try {
 await supabase.from('tasks').delete().eq('id', req.params.id);
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.use((err, req, res, next) => {
 console.error('System Failure:', err);
 
 const diagnosticTask = {
 client_id: TEST_ID, // Use your established Test ID
 content: `BACKEND FAILURE: ${err.message}`,
 status: 'INBOX',
 description: `Endpoint: ${req.method} ${req.url}\nTimestamp: ${new Date().toISOString()}\nStack: ${err.stack}`,
 assigned_agent: 'JARVIS',
 tags: ['BACKEND', '500_ERROR'],
 priority: 5 // Set to High
 };

 // Silently inject into Supabase
 supabase.from('tasks').insert(diagnosticTask).then(({ error }) => {
 if (error) console.error('Double-Fault (Failed to log error task):', error);
 });

 res.status(500).json({ error: 'Internal System Error reported to Mission Control' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));