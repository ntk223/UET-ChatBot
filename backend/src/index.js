const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const dialogueManager = require("./services/dialogue/dialogueManager.service");
const { close: closePostgres } = require("./config/postgres");
const { getRedisClient } = require("./config/redis");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("chat:message", async (payload = {}) => {
    try {
      const {
        sender_id: senderId,
        message_text: messageText,
        payload_value: payloadValue,
      } = payload;

      if (!senderId) {
        socket.emit("chat:error", {
          error: "sender_id is required",
        });
        return;
      }

      const response = await dialogueManager.handleIncomingMessage({
        senderId,
        messageText,
        payloadValue,
      });

      socket.emit("chat:response", response);
    } catch (error) {
      socket.emit("chat:error", {
        error: error.message || "Unable to process message",
      });
    }
  });
});

server.listen(env.port, () => {
  console.log(`[server] Running on port ${env.port}`);
});

async function shutdown() {
  try {
    server.close();
    await closePostgres();

    const redis = getRedisClient();
    if (redis && typeof redis.quit === "function") {
      await redis.quit();
    }

    process.exit(0);
  } catch (error) {
    console.error("[server] Shutdown error:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
