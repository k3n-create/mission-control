const { Redis } = require('@upstash/redis');
const fs = require('fs');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.DATABASE_REDIS_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL;
    if (!url) {
      return res.status(500).json({ error: 'Redis URL not configured. Set UPSTASH_REDIS_REST_URL or DATABASE_REDIS_URL env var.' });
    }

    // Check if Redis has tasks data
    const existingData = await redis.get('tasks');
    
    if (!existingData) {
      // Redis is empty - migrate from tasks.json
      const tasksData = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
      await redis.set('tasks', JSON.stringify(tasksData));
      console.log('✅ Auto-migrated tasks.json to Redis');
      return res.status(200).json({ success: true, message: 'Migrated from tasks.json', source: 'migration' });
    }
    
    // Redis already has data
    return res.status(200).json({ success: true, message: 'Redis already populated', source: 'redis' });
  } catch (error) {
    console.error('Migration error:', error.message);
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  }
};