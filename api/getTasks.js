const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.DATABASE_REDIS_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await redis.get('tasks');
    
    if (!data) {
      return res.status(200).json({});
    }
    
    // Parse if string
    const tasks = typeof data === 'string' ? JSON.parse(data) : data;
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};