import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD, // Use environment variable for password
});

await redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});