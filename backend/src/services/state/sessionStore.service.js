const env = require("../../config/env");
const { getRedisClient, buildKey } = require("../../config/redis");

class SessionStoreService {
  constructor() {
    this.ttlSeconds = env.sessionTtlSeconds;
  }

  getSessionKey(senderId) {
    return buildKey(`session:${senderId}`);
  }

  createDefaultSession(senderId, startNode) {
    return {
      sender_id: senderId,
      current_node: startNode,
      slots_filled: {},
      conversation_history: [],
      updated_at: new Date().toISOString(),
    };
  }

  async getSession(senderId) {
    const redis = getRedisClient();
    const key = this.getSessionKey(senderId);
    const raw = await redis.get(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  }

  async saveSession(senderId, session) {
    const redis = getRedisClient();
    const key = this.getSessionKey(senderId);
    const payload = JSON.stringify({
      ...session,
      updated_at: new Date().toISOString(),
    });

    // ioredis supports SET key value EX ttl syntax.
    await redis.set(key, payload, "EX", this.ttlSeconds);
    return JSON.parse(payload);
  }

  async clearSession(senderId) {
    const redis = getRedisClient();
    const key = this.getSessionKey(senderId);
    await redis.del(key);
  }

  async initSession(senderId, startNode) {
    const session = this.createDefaultSession(senderId, startNode);
    return this.saveSession(senderId, session);
  }

  async appendConversation(senderId, entry) {
    const existing =
      (await this.getSession(senderId)) ||
      this.createDefaultSession(senderId, "start");

    const updated = {
      ...existing,
      conversation_history: [
        ...existing.conversation_history,
        {
          ...entry,
          timestamp: new Date().toISOString(),
        },
      ].slice(-20),
    };

    return this.saveSession(senderId, updated);
  }
}

module.exports = new SessionStoreService();
