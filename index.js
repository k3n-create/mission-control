import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static HTML dashboard
app.get('/', async (req, res) => {
  try {
    const html = await readFile('./index.html', 'utf-8');
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Dashboard not found');
  }
});

// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
  try {
    
const statusMap = { 'INBOX': 'todo', 'ASSIGNED': 'assigned', 'IN PROGRESS': 'in_progress', 'REVIEW': 'review', 'DONE': 'done' };

const reverseStatusMap = { 'todo': 'INBOX', 'assigned': 'ASSIGNED', 'in_progress': 'IN PROGRESS', 'review': 'REVIEW', 'done': 'DONE' };
const reverseMapStatus = (s) => reverseStatusMap[s] || s?.toUpperCase() || 'INBOX';

const mapStatus = (s) => statusMap[s?.toUpperCase()] || s?.toLowerCase() || 'todo';

const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || '5f80e462-ddfb-45fe-874d-7b36463b26d6';
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(200).json({});
    }

    const tasksByColumn = {};
    data.forEach(task => {
      if (!tasksByColumn[task.status]) {
        tasksByColumn[task.status] = [];
      }
      tasksByColumn[task.status].push({
        id: task.id,
        task_name: task.content,
        
        status: mapStatus(task.status),
        priority: task.priority,
        
      });
    });

    res.status(200).json(tasksByColumn);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
  try {
    const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || '5f80e462-ddfb-45fe-874d-7b36463b26d6';
    const { tasks, columns } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks provided' });
    }

    const tasksToUpsert = tasks.map(task => ({
      client_id: TEST_CLIENT_ID,
      id: task.id,
      content: task.title,
      status: task.column,
      
      priority: task.priority || 'medium',
      
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('tasks')
      .upsert(tasksToUpsert, { onConflict: 'id,client_id' })
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Tasks saved', count: data?.length || 0 });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Debug endpoint - remove in production
app.get('/api/debug', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseKey: process.env.SUPABASE_KEY ? 'SET' : 'MISSING',
    testClientId: process.env.TEST_CLIENT_ID ? 'SET' : 'MISSING'
  });
});
