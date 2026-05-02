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
 .select('*')
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
 priority: task.priority
 });
 });
 }

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
 const { tasks } = req.body;

 if (!Array.isArray(tasks)) {
 return res.status(400).json({ error: 'No tasks provided' });
 }

 const tasksToUpsert = tasks.map(task => ({
 client_id: TEST_CLIENT_ID,
 // Ensure ID is a valid UUID; otherwise generate one
 id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id) ? task.id : uuidv4(),
 content: task.task_name || task.title,
 status: reverseMapStatus(task.column || task.status),
 // Convert string priority to integer using global map
 priority: typeof task.priority === 'number' ? task.priority : (priorityMap[task.priority] || 3),
 updated_at: new Date().toISOString()
 }));

 const { data, error } = await supabase
 .from('tasks')
 .upsert(tasksToUpsert, { onConflict: 'id' })
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