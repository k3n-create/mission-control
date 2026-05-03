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

// GET /api/tasks: Returns raw array of tasks for this client
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

 const dbTasks = tasks.map(t => ({
 id: (t.id && t.id.includes('-')) ? t.id : undefined, // Keep real UUIDs, let DB make new ones for timestamps
 client_id: TEST_ID,
 content: t.content || 'New Objective',
 status: (t.status || 'INBOX').toUpperCase(),
 description: t.description || '',
 tags: t.tags || [],
 assigned_agent: t.assigned_agent || ''
 }));

 const { error } = await supabase.from('tasks').upsert(dbTasks, { onConflict: 'id' });
 if (error) throw error;
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
 try {
 await supabase.from('tasks').delete().eq('id', req.params.id);
 res.status(200).json({ success: true });
 } catch (error) { res.status(500).json({ error: error.message }); }
});

app.use((err, req, res, next) => {
 console.error('System Failure:', err);
 
 const diagnosticTask = {
 client_id: TEST_ID, // Use your established Test ID
 content: `BACKEND FAILURE: ${err.message}`,
 status: 'INBOX',
 description: `Endpoint: ${req.method} ${req.url}\nTimestamp: ${new Date().toISOString()}\nStack: ${err.stack}`,
 assigned_agent: 'JARVIS',
 tags: ['BACKEND', '500_ERROR'],
 priority: 5 // Set to High
 };

 // Silently inject into Supabase
 supabase.from('tasks').insert(diagnosticTask).then(({ error }) => {
 if (error) console.error('Double-Fault (Failed to log error task):', error);
 });

 res.status(500).json({ error: 'Internal System Error reported to Mission Control' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));