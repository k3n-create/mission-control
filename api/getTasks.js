import { createClient } from 'redis';

let client;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.DATABASE_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  try {
    if (!client) {
      client = createClient({ url: redisUrl });
      await client.connect();
    }

    const result = await client.get('tasks');
    
    if (!result) {
      return res.status(200).json({});
    }
    
    const tasks = typeof result === 'string' ? JSON.parse(result) : result;
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
};