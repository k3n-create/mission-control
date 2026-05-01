const { Redis } = require('@upstash/redis');
const fs = require('fs');

// Initialize Redis client with the environment variable
const redis = new Redis({
  url: process.env.DATABASE_REDIS_URL,
  token: process.env.DATABASE_REDIS_TOKEN, // Add token if needed
});

// Read tasks.json
const tasks = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));

// Migrate to Redis
async function migrate() {
  try {
    await redis.set('tasks', JSON.stringify(tasks));
    console.log('✅ Successfully migrated tasks to Redis!');
    
    // Verify
    const data = await redis.get('tasks');
    console.log('✅ Verification - tasks in Redis:', typeof data);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

migrate();