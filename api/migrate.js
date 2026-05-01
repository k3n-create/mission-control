const fs = require('fs');
const { createClient } = require('redis');

module.exports = async (req, res) => {
  // Only allow GET or POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.DATABASE_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  try {
    // Create Redis client from URL (includes password)
    const client = createClient({ url: redisUrl });
    await client.connect();

    // Check if 'tasks' key exists
    let tasksData = await client.get('tasks');
    if (!tasksData) {
      // No tasks in Redis, migrate from tasks.json
      const fileData = fs.readFileSync('./tasks.json', 'utf8');
      await client.set('tasks', fileData);
      tasksData = fileData;
    }

    // Parse tasks JSON
    let tasks = typeof tasksData === 'string' ? JSON.parse(tasksData) : tasksData;

    // Move "Add settings modal" to REVIEW if it exists in any column
    let moved = false;
    for (const col of Object.keys(tasks)) {
      const idx = tasks[col].findIndex(t => t.task_name === 'Add settings modal');
      if (idx !== -1) {
        const task = tasks[col].splice(idx, 1)[0];
        task.status = 'review';
        tasks.REVIEW = tasks.REVIEW || [];
        tasks.REVIEW.push(task);
        moved = true;
        break;
      }
    }

    // Save updated tasks back to Redis
    await client.set('tasks', JSON.stringify(tasks));
    await client.disconnect();

    return res.status(200).json({
      success: true,
      migrated: !tasksData ? true : false,
      movedAddSettingsModal: moved,
      message: moved ? 'Add settings modal moved to REVIEW' : 'Add settings modal not found'
    });
  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({ error: err.message });
  }
};