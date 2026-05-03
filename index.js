import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 8080;
const TEST_ID = '5f80e462-ddfb-45fe-874d-7b36463b26d6';

app.use(cors());
app.use(express.json());

// ROOT ROUTE: Serves the dashboard
app.get('/', async (req, res) => {
 try {
 const html = await readFile('./index.html', 'utf-8');
 res.set('Content-Type', 'text/html').send(html);
 } catch (err) { res.status(500).send('index.html not found'); }
});

// GET /api/tasks: Returns tasks organized by column for the dashboard
app.get('/api/tasks', async (req, res) => {
 try {
 const { data, error } = await supabase.from('tasks').select('*').eq('client_id', TEST_ID).order('created_at', { ascending: true });
 if (error) throw error;
 res.status(200).json(data || []);
 } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/tasks: High-speed Batch Upsert
app.post('/api/tasks', async (req, res) => {
 try {
 const { tasks } = req.body;
 if (!tasks) return res.status(400).send('No tasks provided');

 // Clean tasks for DB: Ensure they have the correct client_id and valid UUIDs
 const dbTasks = tasks.map(t => ({
 id: t.id.includes('-') ? t.id : undefined, // Let Supabase generate ID if it's a fake timestamp
 client_id: TEST_ID,
 content: t.content || 'New Objective',
 status: (t.status || 'INBOX').toUpperCase(),
 description: t.description || '',
 tags: t.tags || [],
 assigned_agent: t.assigned_agent || ''
 }));

 const { data, error } = await supabase.from('tasks').upsert(dbTasks, { onConflict: 'id' }).select();
 if (error) throw error;
 res.status(200).json({ success: true, data });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
 try {
 await supabase.from('tasks').delete().eq('id', req.params.id);
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));