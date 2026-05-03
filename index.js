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

// GET /api/tasks - REMOVED CLIENT_ID FILTER
app.get('/api/tasks', async (req, res) => {
 try {
 const { data, error } = await supabase
 .from('tasks')
 .select('*')
 .order('created_at', { ascending: true });

 if (error) throw error;

 const tasksByColumn = {};
 if (data) {
 data.forEach(task => {
 const dashboardStatus = mapStatus(task.status);
 if (!tasksByColumn[dashboardStatus]) tasksByColumn[dashboardStatus] = [];
 tasksByColumn[dashboardStatus].push({
 id: task.id,
 task_name: task.content,
 status: dashboardStatus,
 assigned_agent: task.assigned_agent || '',
 description: task.description || '',
 tags: task.tags || []
 });
 });
 }
 res.status(200).json(tasksByColumn);
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/tasks - UPDATED FOR STABILITY
app.post('/api/tasks', async (req, res) => {
 try {
 const { tasks } = req.body;
 for (const task of tasks) {
 const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id);
 const payload = {
 content: task.task_name,
 status: reverseMapStatus(task.status || task.column),
 description: task.description,
 tags: task.tags,
 assigned_agent: task.assigned_agent
 };

 if (!isUUID) {
 await supabase.from('tasks').insert({ ...payload, id: uuidv4() });
 } else {
 await supabase.from('tasks').update(payload).eq('id', task.id);
 }
 }
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE /api/tasks/:id - ADDED AS REQUESTED
app.delete('/api/tasks/:id', async (req, res) => {
 try {
 await supabase.from('tasks').delete().eq('id', req.params.id);
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));