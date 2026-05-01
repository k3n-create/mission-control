module.exports = async (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Redis setup endpoint',
    envVars: {
      UPSTASH: process.env.UPSTASH_REDIS_REST_URL ? 'set' : 'not set',
      DATABASE: process.env.DATABASE_REDIS_URL ? 'set' : 'not set'
    }
  });
};