const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log all env vars (masked)
    const envInfo = {
      hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasDbUrl: !!process.env.DATABASE_REDIS_URL,
      hasDbToken: !!process.env.DATABASE_REDIS_TOKEN,
      nodeVersion: process.version
    };
    
    const { Redis } = require('@upstash/redis');
    
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.DATABASE_REDIS_TOKEN;
    
    if (!redisUrl) {
      return res.status(500).json({ error: 'Redis URL not configured', env: envInfo });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // Check if Redis has tasks data
    const existingData = await redis.get('tasks');
    
    if (!existingData) {
      // Redis is empty - migrate from tasks.json
      const tasksData = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
      await redis.set('tasks', JSON.stringify(tasksData));
      return res.status(200).json({ success: true, message: 'Migrated from tasks.json' });
    }
    
    // Redis already has data
    return res.status(200).json({ success: true, message: 'Redis already populated' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};