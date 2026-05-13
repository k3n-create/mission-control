// Simulation Mode for Kennedy Chicken Delivery API
// When KENNEDY_SIM is enabled, returns mock data instead of calling external APIs

// 12 Kennedy Chicken Store Locations
export const mockStores = [
  {
    id: 'kc-001',
    merchant_supplied_id: 'KENNEDY-001',
    store_name: 'Kennedy Chicken - Downtown',
    address: '425 Main Street, Downtown, CA 94102',
    phone: '(415) 555-0101',
    platform_store_id: 'doordash-kc-001',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-002',
    merchant_supplied_id: 'KENNEDY-002',
    store_name: 'Kennedy Chicken - Midtown',
    address: '1820 Market Street, Midtown, CA 94102',
    phone: '(415) 555-0102',
    platform_store_id: 'doordash-kc-002',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-003',
    merchant_supplied_id: 'KENNEDY-003',
    store_name: 'Kennedy Chicken - Financial District',
    address: '88 California Street, Financial District, CA 94111',
    phone: '(415) 555-0103',
    platform_store_id: 'doordash-kc-003',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-004',
    merchant_supplied_id: 'KENNEDY-004',
    store_name: 'Kennedy Chicken - Mission District',
    address: '2890 Mission Street, Mission District, CA 94110',
    phone: '(415) 555-0104',
    platform_store_id: 'doordash-kc-004',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-005',
    merchant_supplied_id: 'KENNEDY-005',
    store_name: 'Kennedy Chicken - SOMA',
    address: '650 Howard Street, SOMA, CA 94107',
    phone: '(415) 555-0105',
    platform_store_id: 'doordash-kc-005',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-006',
    merchant_supplied_id: 'KENNEDY-006',
    store_name: 'Kennedy Chicken - Nob Hill',
    address: '1200 Nob Hill, Nob Hill, CA 94109',
    phone: '(415) 555-0106',
    platform_store_id: 'doordash-kc-006',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-007',
    merchant_supplied_id: 'KENNEDY-007',
    store_name: 'Kennedy Chicken - Castro',
    address: '500 Castro Street, Castro, CA 94114',
    phone: '(415) 555-0107',
    platform_store_id: 'doordash-kc-007',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-008',
    merchant_supplied_id: 'KENNEDY-008',
    store_name: 'Kennedy Chicken - Marina',
    address: '2100 Marina Boulevard, Marina, CA 94123',
    phone: '(415) 555-0108',
    platform_store_id: 'doordash-kc-008',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-009',
    merchant_supplied_id: 'KENNEDY-009',
    store_name: 'Kennedy Chicken - Sunset',
    address: '3450 Noriega Street, Sunset, CA 94122',
    phone: '(415) 555-0109',
    platform_store_id: 'doordash-kc-009',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-010',
    merchant_supplied_id: 'KENNEDY-010',
    store_name: 'Kennedy Chicken - Richmond',
    address: '4200 Geary Boulevard, Richmond, CA 94118',
    phone: '(415) 555-0110',
    platform_store_id: 'doordash-kc-010',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-011',
    merchant_supplied_id: 'KENNEDY-011',
    store_name: 'Kennedy Chicken - Haight',
    address: '1560 Haight Street, Haight-Ashbury, CA 94117',
    phone: '(415) 555-0111',
    platform_store_id: 'doordash-kc-011',
    platform: 'doordash',
    is_active: true
  },
  {
    id: 'kc-012',
    merchant_supplied_id: 'KENNEDY-012',
    store_name: 'Kennedy Chicken - Potrero',
    address: '1100 18th Street, Potrero Hill, CA 94107',
    phone: '(415) 555-0112',
    platform_store_id: 'doordash-kc-012',
    platform: 'doordash',
    is_active: true
  }
];

// Generate deterministic pseudo-random revenue based on store ID and date
function generateRevenue(storeId, dateOffset) {
  const seed = storeId.charCodeAt(3) * 100 + dateOffset;
  const random = Math.sin(seed) * 10000;
  const normalized = (random - Math.floor(random));
  
  // Revenue between $600 and $2,400
  return Math.round(600 + normalized * 1800);
}

// Generate 14 days of mock sales data for a store
function generateSalesData(store, startDate = new Date()) {
  const sales = [];
  const start = new Date(startDate);
  
  // Generate 14 days of data (going backwards from startDate)
  for (let day = 0; day < 14; day++) {
    const date = new Date(start);
    date.setDate(date.getDate() - day);
    
    const dailyRevenue = generateRevenue(store.id, day);
    const orderCount = Math.round(dailyRevenue / 28); // ~$28 avg order value
    const deliveryIds = [];
    
    // Generate unique delivery IDs for DoorDash compliance
    for (let i = 0; i < orderCount; i++) {
      deliveryIds.push(`DEL-${store.merchant_supplied_id}-${date.toISOString().split('T')[0]}-${String(i + 1).padStart(4, '0')}`);
    }
    
    sales.push({
      store_id: store.id,
      merchant_supplied_id: store.merchant_supplied_id,
      store_name: store.store_name,
      report_date: date.toISOString().split('T')[0],
      revenue: dailyRevenue,
      orders: orderCount,
      delivery_ids: deliveryIds,
      platform: store.platform
    });
  }
  
  return sales;
}

// Get all mock stores
export function getMockStores(clientId) {
  return mockStores.map(store => ({
    client_id: clientId,
    ...store,
    metadata: JSON.stringify({
      address: store.address,
      phone: store.phone,
      merchant_supplied_id: store.merchant_supplied_id,
      platform_store_id: store.platform_store_id
    })
  }));
}

// Get mock sales report for all stores
export function getMockSalesReport(clientId, startDate = new Date()) {
  let totalRevenue = 0;
  let totalOrders = 0;
  const storesData = [];
  
  for (const store of mockStores) {
    const storeSales = generateSalesData(store, startDate);
    const todaySales = storeSales[0]; // Most recent (today)
    
    totalRevenue += todaySales.revenue;
    totalOrders += todaySales.orders;
    
    storesData.push({
      store_id: store.id,
      merchant_supplied_id: store.merchant_supplied_id,
      store_name: store.store_name,
      platform_store_id: store.platform_store_id,
      platform: store.platform,
      revenue: todaySales.revenue,
      orders: todaySales.orders,
      delivery_ids: todaySales.delivery_ids
    });
  }
  
  return {
    client_id: clientId,
    simulation_mode: true,
    report_date: startDate.toISOString().split('T')[0],
    total_stores: mockStores.length,
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    stores: storesData
  };
}

// Get detailed sales history (14 days)
export function getMockSalesHistory(clientId, days = 14) {
  const allSales = [];
  const startDate = new Date();
  
  for (const store of mockStores) {
    const storeSales = generateSalesData(store, startDate);
    allSales.push(...storeSales.slice(0, days));
  }
  
  return {
    client_id: clientId,
    simulation_mode: true,
    period_days: days,
    stores: mockStores.length,
    total_revenue: allSales.reduce((sum, s) => sum + s.revenue, 0),
    sales: allSales
  };
}

// Check if simulation mode is enabled
export function isSimulationMode(apiKeyOrSetting) {
  return apiKeyOrSetting === 'KENNEDY_SIM' || process.env.KENNEDY_SIM === 'true';
}