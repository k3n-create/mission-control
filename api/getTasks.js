import { Redis } from '@upstash/redis';

// This is the HTTP-based client (won't crash Vercel)
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await redis.get('tasks');
    
    if (!result) {
      return res.status(200).json({});
    }
    
    // Parse if string
    const tasks = typeof result === 'string' ? JSON.parse(result) : result;
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};