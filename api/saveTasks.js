import { supabase } from '../lib/supabase.js';

// TEST_CLIENT_ID - Replace with actual client UUID when provided
const TEST_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tasks, columns } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks provided' });
    }

    // Map frontend task format to Supabase schema
    const tasksToUpsert = tasks.map(task => ({
      client_id: TEST_CLIENT_ID,
      id: task.id,
      title: task.title,
      column: task.column,
      assigned_to: task.assignedTo || null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      tags: task.tags || [],
      updated_at: new Date().toISOString()
    }));

    // Upsert all tasks to Supabase
    const { data, error } = await supabase
      .from('tasks')
      .upsert(tasksToUpsert, { onConflict: 'id,client_id' })
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
    }

    return res.status(200).json({ success: true, message: 'Tasks saved to Supabase', count: data?.length || 0 });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Failed to save tasks: ' + error.message });
  }
};