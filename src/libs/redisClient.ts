import { createClient } from "redis";

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function initializeRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("Redis client connected");
  } catch (err) {
    console.error(err);
  }
}

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}
