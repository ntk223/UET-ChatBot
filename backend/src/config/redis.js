const Redis = require("ioredis");
const env = require("./env");

class InMemoryRedis {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return "OK";
  }

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async quit() {
    return "OK";
  }
}

const inMemoryClient = new InMemoryRedis();
let activeClient = inMemoryClient;

if (env.redis.enabled) {
  const redisClient = new Redis(env.redis.url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redisClient
    .connect()
    .then(() => {
      activeClient = redisClient;
      console.log("[redis] Connected to Redis");
    })
    .catch((error) => {
      console.warn(
        "[redis] Falling back to in-memory state store:",
        error.message
      );
      activeClient = inMemoryClient;
    });

  redisClient.on("error", (error) => {
    console.warn("[redis] Runtime error:", error.message);
  });
}

function getRedisClient() {
  return activeClient;
}

function buildKey(suffix) {
  return `${env.redis.keyPrefix}:${suffix}`;
}

module.exports = {
  getRedisClient,
  buildKey,
};
