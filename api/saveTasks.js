import { createClient } from 'redis';

let client;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.DATABASE_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  try {
    if (!client) {
      client = createClient({ url: redisUrl });
    }
    if (!client.isOpen) {
      await client.connect();
    }

    const { tasks, columns } = req.body;
    
    const data = {};
    
    columns.forEach(col => {
      data[col] = [];
    });
    
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

    await client.set('tasks', JSON.stringify(data));

    return res.status(200).json({ success: true, message: 'Tasks saved to Redis' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
  }
};