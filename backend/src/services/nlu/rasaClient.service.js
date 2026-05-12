const axios = require("axios");
const env = require("../../config/env");

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")               // Tách các dấu ra khỏi chữ cái gốc
    .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu vừa tách
    .replace(/[đĐ]/g, "d")          // Xử lý riêng chữ đ và Đ (NFD không tách được dấu của đ)
    .toLowerCase()                  // Chuyển về chữ thường
    .replace(/[^a-z0-9\s]/g, "")    // Loại bỏ ký tự đặc biệt (chỉ giữ lại chữ cái, số, khoảng trắng)
    .replace(/\s+/g, " ")           // Thu gọn nhiều khoảng trắng thành 1
    .trim();                        // Cắt khoảng trắng ở hai đầu
}

class RasaClientService {
  constructor() {
    this.http = axios.create({
      baseURL: env.rasa.url,
      timeout: env.rasa.timeoutMs,
    });
  }

  async parseMessage(text) {
    const textNormal = normalizeText(text);
    if (!textNormal) {
      return {
        intent: { name: "empty_message", confidence: 1 },
        entities: [],
      };
    }

    try {
      const { data } = await this.http.post("/model/parse", { text: textNormal });
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
