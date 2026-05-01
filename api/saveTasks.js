import { Redis } from '@upstash/redis';

// This is the HTTP-based client (won't crash Vercel)
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Save to Redis using the SDK
    await redis.set('tasks', JSON.stringify(data));

    return res.status(200).json({ success: true, message: 'Tasks saved to Redis' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Failed to save tasks' });
  }
};