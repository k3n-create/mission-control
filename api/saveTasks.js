const fs = require('fs');
const path = require('path');

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

    // Write to tasks.json in the root directory
    const filePath = path.join(__dirname, '..', 'tasks.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.status(200).json({ success: true, message: 'Tasks saved successfully' });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
};