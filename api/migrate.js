const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.DATABASE_REDIS_TOKEN;
    
    if (!redisUrl) {
      return res.status(500).json({ error: 'Redis URL not configured. Set UPSTASH_REDIS_REST_URL env var.' });
    }

    // Use fetch to call Upstash REST API directly
    const auth = Buffer.from(`${redisUrl}:${redisToken}`).toString('base64');
    
    // Check if tasks key exists
    const checkRes = await fetch(`${redisUrl}/get/tasks`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    const checkData = await checkRes.json();
    
    if (!checkData.result) {
      // Key doesn't exist - migrate from tasks.json
      const tasksData = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
      
      const setRes = await fetch(`${redisUrl}/set/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasksData)
      });
      
      const setData = await setRes.json();
      
      if (setData.error) {
        throw new Error(setData.error);
      }
      
      return res.status(200).json({ success: true, message: 'Migrated from tasks.json to Redis' });
    }
    
    // Redis already has data
    return res.status(200).json({ success: true, message: 'Redis already populated', data: checkData.result });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
};