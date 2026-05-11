const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT),
  rasa: {
    url: process.env.RASA_URL,
    confidenceThreshold: Number(process.env.RASA_CONFIDENCE_THRESHOLD),
    timeoutMs: Number(process.env.RASA_TIMEOUT_MS),
  },
  postgres: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    max: Number(process.env.DB_POOL_MAX),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS),
  },
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: process.env.REDIS_KEY_PREFIX,
    enabled: (process.env.REDIS_ENABLED).toLowerCase() === "true",
  },
  flowchartPath:
    process.env.FLOWCHART_PATH,
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS),
};
