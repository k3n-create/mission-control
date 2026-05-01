const { Redis } = require('@upstash/redis');

const getRedisClient = () => {
  const dbUrl = process.env.KV_URL;
  if (!dbUrl) {
    throw new Error('KV_URL not set');
  }
  
  // Extract credentials from redis://default:password@host:port
  const urlMatch = dbUrl.match(/redis:\/\/([^:]+):([^@]+)@(.+):(\d+)/);
  if (urlMatch) {
    const [, username, password, host, port] = urlMatch;
    // For Redis Labs, construct REST endpoint
    const restUrl = `https://${host}:${port}`;
    return new Redis({
      url: restUrl,
      token: password,
    });
  }
  
  // Fallback: try as Upstash URL
  return new Redis({
    url: dbUrl,
    token: process.env.DATABASE_TOKEN || '',
  });
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.KV_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'KV_URL not set' });
  }

  let redisClient;
  try {
    redisClient = getRedisClient();
    const data = await redisClient.get('tasks');
    
    if (!data) {
      return res.status(200).json({});
    }
    
    // Parse if string
    const tasks = typeof data === 'string' ? JSON.parse(data) : data;
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
};