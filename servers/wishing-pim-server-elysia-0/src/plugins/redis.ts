import Elysia from "elysia";
import { createClient, type RedisClientType } from "redis";

let redis_instance: undefined | RedisClientType;
const useRedis = async () => {
  if (!redis_instance) {
    redis_instance = createClient({
      url: "redis://default:uiopjkl@127.0.0.1:6380/0",
    });
    redis_instance.on("error", (err) => console.log("Redis Client Error", err));
    await redis_instance.connect().then(() => "Connected to Redis");
  }
  return redis_instance;
};

export const redis = new Elysia()
  .decorate({
    redis: await useRedis(),
  })
  .as("global");
