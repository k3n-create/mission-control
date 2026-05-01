const { createClient } = require('redis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
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
    await client.disconnect();

    res.status(200).json({ success: true, message: 'Tasks saved to Redis' });
  } catch (error) {
    console.error('Error saving tasks:', error);
    if (client) await client.disconnect();
    res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
  }
};