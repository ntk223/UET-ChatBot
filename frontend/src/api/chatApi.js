import { API_BASE_URL } from "../config.js";

const WEBHOOK_PATH = "/webhook";
const HEALTH_PATH = "/health";

export async function sendWebhookMessage({ senderId, messageText, payloadValue }) {
  const response = await fetch(`${API_BASE_URL}${WEBHOOK_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_id: senderId,
      message_text: messageText,
      payload_value: payloadValue,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}${HEALTH_PATH}`);

  if (!response.ok) {
    throw new Error("Health check failed");
  }

  return response.json().catch(() => ({}));
}
