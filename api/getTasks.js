const { createClient } = require('redis');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.KV_URL,
    });
  }
  return redisClient;
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.KV_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'KV_URL not set' });
  }

  let client;
  try {
    client = getRedisClient();
    
    if (!client.isOpen) {
      await client.connect();
    }

    const result = await client.get('tasks');
    
    if (!result) {
      return res.status(200).json({});
    }
    
    // Parse if string
    const tasks = typeof result === 'string' ? JSON.parse(result) : result;
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
};