const fs = require('fs');

module.exports = async (req, res) => {
  const redisUrl = process.env.DATABASE_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.DATABASE_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl) {
    return res.status(200).json({ 
      success: false, 
      message: 'Redis not configured'
    });
  }
  
  try {
    let baseUrl, auth;
    
    // Check if it's a Redis URL or Upstash URL
    if (redisUrl.startsWith('redis://')) {
      // Regular Redis URL - extract components
      const urlObj = new URL(redisUrl);
      const password = urlObj.password || '';
      const username = urlObj.username || 'default';
      
      baseUrl = `${urlObj.protocol}//${urlObj.host}:${urlObj.port}`;
      auth = Buffer.from(`${username}:${password}`).toString('base64');
    } else if (redisUrl.startsWith('https://')) {
      // Upstash REST URL
      baseUrl = redisUrl;
      auth = Buffer.from(`:${redisToken}`).toString('base64');
    } else {
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid Redis URL format'
      });
    }
    
    // Use fetch to call Redis REST API
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
    
    // Parse existing data
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
      message: moved ? 'Moved "Add settings modal" to REVIEW' : 'Task not found in Redis data',
      action: moved ? 'move' : 'none'
    });
  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      message: 'Error: ' + error.message,
      url: redisUrl ? 'URL present' : 'no URL',
      urlStart: redisUrl ? redisUrl.substring(0, 20) : 'N/A'
    });
  }
};