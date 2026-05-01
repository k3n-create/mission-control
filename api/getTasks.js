import { supabase } from '../lib/supabase.js';

// TEST_CLIENT_ID - Real client from Supabase
const TEST_CLIENT_ID = '5f80e462-ddfb-45fe-874d-7b36463b26d6';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch tasks for the current client
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
    }

    // If no tasks, return empty object
    if (!data || data.length === 0) {
      return res.status(200).json({});
    }

    // Group tasks by column for dashboard compatibility
    const tasksByColumn = {};
    
    data.forEach(task => {
      if (!tasksByColumn[task.column]) {
        tasksByColumn[task.column] = [];
      }
      tasksByColumn[task.column].push({
        id: task.id,
        task_name: task.title,
        assigned_agent: task.assigned_to,
        status: task.status,
        priority: task.priority,
        tags: task.tags
      });
    });

    return res.status(200).json(tasksByColumn);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
};