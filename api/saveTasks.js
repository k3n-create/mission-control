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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.KV_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'KV_URL not set' });
  }

  let redisClient;
  try {
    redisClient = getRedisClient();

    const { tasks, columns } = req.body;
    
    // Reconstruct the nested JSON structure from flat tasks array
    const data = {};
    
    // Initialize each column with empty array
    columns.forEach(col => {
      data[col] = [];
    });
    
    // Distribute tasks into their columns
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        const col = task.column;
        if (data[col]) {
          data[col].push({
            id: task.id,
            task_name: task.title,
            assigned_agent: task.assignedTo || null,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            tags: task.tags || []
          });
        }
      });
    }

    // Save to Redis
    await redisClient.set('tasks', JSON.stringify(data));

    res.status(200).json({ success: true, message: 'Tasks saved to Redis' });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
  }
};