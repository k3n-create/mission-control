const fs = require('fs');

module.exports = async (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Test endpoint works',
    envVars: {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'set' : 'not set',
      DATABASE_REDIS_URL: process.env.DATABASE_REDIS_URL ? 'set' : 'not set'
    }
  });
};