const { createClient } = require('redis');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.DATABASE_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  let client;
  try {
    client = createClient({ url: redisUrl });
    await client.connect();

    const data = await client.get('tasks');
    
    if (!data) {
      await client.disconnect();
      return res.status(200).json({});
    }
    
    // Parse if string
    const tasks = typeof data === 'string' ? JSON.parse(data) : data;
    await client.disconnect();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    if (client) await client.disconnect();
    res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
};