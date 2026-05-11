const SENDER_ID_KEY = "uet_chatbot_sender_id";

function generateSenderId() {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `demo_${time}_${random}`;
}

export function getOrCreateSenderId() {
  if (typeof window === "undefined" || !window.localStorage) {
    return generateSenderId();
  }

  const existing = window.localStorage.getItem(SENDER_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = generateSenderId();
  window.localStorage.setItem(SENDER_ID_KEY, next);
  return next;
}
