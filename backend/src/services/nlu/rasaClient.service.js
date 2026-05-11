const axios = require("axios");
const env = require("../../config/env");

class RasaClientService {
  constructor() {
    this.http = axios.create({
      baseURL: env.rasa.url,
      timeout: env.rasa.timeoutMs,
    });
  }

  async parseMessage(text) {
    if (!text || !text.trim()) {
      return {
        intent: { name: "empty_message", confidence: 1 },
        entities: [],
      };
    }

    try {
      const { data } = await this.http.post("/model/parse", { text });
      const fallbackResult = {
        intent: { name: "nlu_fallback", confidence: 0 },
        entities: [],
      };

      if (!data || !data.intent) {
        return fallbackResult;
      }

      if (data.intent.confidence < env.rasa.confidenceThreshold) {
        return {
          intent: {
            name: "nlu_fallback",
            confidence: data.intent.confidence,
          },
          entities: data.entities || [],
        };
      }

      return {
        intent: data.intent,
        entities: data.entities || [],
      };
    } catch (error) {
      console.warn("[rasa] Unable to parse message:", error.message);
      return {
        intent: { name: "nlu_fallback", confidence: 0 },
        entities: [],
      };
    }
  }
}

module.exports = new RasaClientService();
