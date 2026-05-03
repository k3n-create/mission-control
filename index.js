import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const statusMap = { 'INBOX': 'todo', 'ASSIGNED': 'assigned', 'IN PROGRESS': 'in_progress', 'REVIEW': 'review', 'DONE': 'done' };
const reverseStatusMap = { 'todo': 'INBOX', 'assigned': 'ASSIGNED', 'in_progress': 'IN PROGRESS', 'review': 'REVIEW', 'done': 'DONE' };

const mapStatus = (s) => statusMap[s?.toUpperCase()] || s?.toLowerCase() || 'todo';
const reverseMapStatus = (s) => reverseStatusMap[s] || s?.toUpperCase() || 'INBOX';

// --- ROOT ROUTE (Fixes White Screen) ---
app.get('/', async (req, res) => {
 try {
 const html = await readFile('./index.html', 'utf-8');
 res.set('Content-Type', 'text/html');
 res.send(html);
 } catch (err) { res.status(500).send('index.html not found'); }
});

// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
 try {
 const TEST_ID = '5f80e462-ddfb-45fe-874d-7b36463b26d6';
 const { data, error } = await supabase.from('tasks').select('*').eq('client_id', TEST_ID).order('created_at', { ascending: true });
 if (error) throw error;

 const tasksByColumn = {};
 if (data) {
 data.forEach(task => {
 const dashboardStatus = mapStatus(task.status);
 if (!tasksByColumn[dashboardStatus]) tasksByColumn[dashboardStatus] = [];
 tasksByColumn[dashboardStatus].push({
 id: task.id,
 task_name: task.content,
 column: dashboardStatus, // Changed to 'column' to match frontend
 assignedTo: task.assigned_agent || '', 
 description: task.description || '',
 tags: task.tags || []
 });
 });
 }
 res.status(200).json(tasksByColumn);
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
 try {
 const TEST_ID = '5f80e462-ddfb-45fe-874d-7b36463b26d6';
 const { tasks } = req.body;
 for (const task of tasks) {
 const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id);
 const payload = {
 client_id: TEST_ID,
 content: task.task_name,
 status: reverseMapStatus(task.column),
 description: task.description,
 tags: task.tags,
 assigned_agent: task.assignedTo
 };
 if (!isUUID) { await supabase.from('tasks').insert({ ...payload, id: uuidv4() }); }
 else { await supabase.from('tasks').update(payload).eq('id', task.id); }
 }
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
 try {
 await supabase.from('tasks').delete().eq('id', req.params.id);
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));