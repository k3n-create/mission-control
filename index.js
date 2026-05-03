import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// GLOBAL SCOPE MAPS - Moved out of routes to avoid ReferenceErrors
const statusMap = {
 'INBOX': 'todo',
 'ASSIGNED': 'assigned',
 'IN PROGRESS': 'in_progress',
 'REVIEW': 'review',
 'DONE': 'done'
};

const priorityMap = {
 'low': 1,
 'medium': 3,
 'high': 5
};

const reverseStatusMap = {
 'todo': 'INBOX',
 'assigned': 'ASSIGNED',
 'in_progress': 'IN PROGRESS',
 'review': 'REVIEW',
 'done': 'DONE'
};

const mapStatus = (s) => statusMap[s?.toUpperCase()] || s?.toLowerCase() || 'todo';
const reverseMapStatus = (s) => reverseStatusMap[s] || s?.toUpperCase() || 'INBOX';

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
 const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || '5f80e462-ddfb-45fe-874d-7b36463b26d6';
 
 const { data, error } = await supabase
 .from('tasks')
 .select('id,content,status,priority,agent_id,tags,description')
 .eq('client_id', TEST_CLIENT_ID)
 .order('created_at', { ascending: true });

 if (error) throw error;

 const tasksByColumn = {};
  if (data) {
    data.forEach(task => {
      const dashboardStatus = mapStatus(task.status);
      if (!tasksByColumn[dashboardStatus]) {
        tasksByColumn[dashboardStatus] = [];
      }
      tasksByColumn[dashboardStatus].push({
        id: task.id,
        task_name: task.content,
        status: dashboardStatus,
        priority: task.priority,
        assigned_agent: task.agent_id || '',
        description: task.description || '',
        tags: task.tags || []
      });
    });
  }

  res.status(200).json(tasksByColumn);
 } catch (error) {
 console.error('Error:', error);
 res.status(500).json({ error: error.message });
 }
});

// POST /api/tasks - Partial updates only, preserves existing fields
app.post('/api/tasks', async (req, res) => {
 try {
 const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || '5f80e462-ddfb-45fe-874d-7b36463b26d6';
 const { tasks } = req.body;

 if (!Array.isArray(tasks)) {
 return res.status(400).json({ error: 'No tasks provided' });
 }

 const results = [];

 for (const task of tasks) {
   // Validate UUID
   const taskId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id) ? task.id : null;
   
   if (!taskId) {
     // New task - insert it
     const newTask = {
       client_id: TEST_CLIENT_ID,
       id: uuidv4(),
       content: task.task_name || task.title || 'Untitled',
       status: reverseMapStatus(task.column || task.status),
       priority: typeof task.priority === 'number' ? task.priority : (priorityMap[task.priority] || 3),
       agent_id: task.assigned_agent || null,
       tags: task.tags || [],
       updated_at: new Date().toISOString()
     };
     
     const { data, error } = await supabase.from('tasks').insert(newTask).select();
     if (error) throw error;
     results.push(data[0]);
   } else {
     // Existing task - PARTIAL UPDATE only changed fields
     const updateFields = {};
     
     // Only update status if provided
     if (task.column || task.status) {
       updateFields.status = reverseMapStatus(task.column || task.status);
     }
     
     // Only update content if provided and changed
     if (task.task_name && task.task_name !== task.title) {
       updateFields.content = task.task_name;
     }
     
     // Only update priority if provided
     if (task.priority) {
       updateFields.priority = typeof task.priority === 'number' ? task.priority : (priorityMap[task.priority] || 3);
     }
     
     // Only update agent_id if provided
     if (task.assigned_agent !== undefined) {
       updateFields.agent_id = task.assigned_agent || null;
     }
     
     // Only update tags if provided
     if (task.tags) {
       updateFields.tags = task.tags;
     }
     
     // Add updated_at
     updateFields.updated_at = new Date().toISOString();
     
     // Do PARTIAL update - only changes specified fields
     const { data, error } = await supabase
       .from('tasks')
       .update(updateFields)
       .eq('id', taskId)
       .select();
     
     if (error) throw error;
     results.push(data[0]);
   }
 }

 res.status(200).json({ success: true, message: 'Tasks saved', count: results.length });
 } catch (error) {
 console.error('Error:', error);
 res.status(500).json({ error: error.message });
 }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
 try {
 const { id } = req.params;
 
 if (!id) {
   return res.status(400).json({ error: 'Task ID required' });
 }
 
 const { error } = await supabase
   .from('tasks')
   .delete()
   .eq('id', id);
 
 if (error) throw error;
 
 res.status(200).json({ success: true, message: 'Task deleted' });
 } catch (error) {
 console.error('Error:', error);
 res.status(500).json({ error: error.message });
 }
});

// Global error handler - auto-create task on 500 errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const errorTask = {
    client_id: TEST_CLIENT_ID || '5f80e462-ddfb-45fe-874d-7b36463b26d6',
    id: uuidv4(),
    content: `Error: ${err.message}`,
    status: 'INBOX',
    priority: 5,
    updated_at: new Date().toISOString()
  };
  supabase.from('tasks').insert(errorTask).then(({ error }) => {
    if (error) console.error('Failed to create error task:', error);
  });
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
 console.log(`Server running on port ${PORT}`);
});