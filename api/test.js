const fs = require('fs');

module.exports = async (req, res) => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.DATABASE_REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.DATABASE_REDIS_TOKEN;
  
  if (!redisUrl) {
    return res.status(200).json({ 
      success: false, 
      message: 'Redis not configured',
      envVars: ['UPSTASH_REDIS_REST_URL not set', 'DATABASE_REDIS_URL not set']
    });
  }
  
  try {
    // Extract base URL (remove credentials if present)
    let baseUrl = redisUrl;
    if (redisUrl.includes('@')) {
      // URL format: redis://username:password@host:port
      const urlObj = new URL(redisUrl);
      baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    }
    
    // Use fetch to call Upstash REST API
    const auth = Buffer.from(`:${redisToken}`).toString('base64');
    
    // Check if tasks key exists
    const checkRes = await fetch(`${baseUrl}/get/tasks`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    const checkData = await checkRes.json();
    
    if (!checkData.result) {
      // Key doesn't exist - migrate from tasks.json
      const tasksData = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
      
      const setRes = await fetch(`${baseUrl}/set/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasksData)
      });
      
      const setData = await setRes.json();
      
      if (setData.error) {
        throw new Error(setData.error);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Migrated tasks.json to Redis',
        action: 'migration'
      });
    }
    
    // Parse existing data and move Heart Beat to DONE
    const existingTasks = typeof checkData.result === 'string' 
      ? JSON.parse(checkData.result) 
      : checkData.result;
    
    // Find and move "Add settings modal" to REVIEW
    let moved = false;
    for (const col of Object.keys(existingTasks)) {
      const taskIndex = existingTasks[col].findIndex(t => t.task_name === 'Add settings modal');
      if (taskIndex !== -1) {
        const task = existingTasks[col].splice(taskIndex, 1)[0];
        task.status = 'review';
        existingTasks.REVIEW = existingTasks.REVIEW || [];
        existingTasks.REVIEW.push(task);
        moved = true;
        
        // Save back to Redis
        await fetch(`${baseUrl}/set/tasks`, {
          method: 'POST',
          headers: { 
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(existingTasks)
        });
        
        break;
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: moved ? 'Moved "Add settings modal" to REVIEW' : 'Redis already has data, task not found',
      action: moved ? 'move' : 'none',
      columns: Object.keys(existingTasks)
    });
  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
};