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
  if (req.method !== 'POST') {
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
    await client.set('tasks', JSON.stringify(data));

    return res.status(200).json({ success: true, message: 'Tasks saved to Redis' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
  }
};