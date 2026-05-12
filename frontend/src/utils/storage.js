const ACTIVE_SENDER_ID_KEY = "uet_chatbot_sender_id";
const HISTORY_SENDER_ID_KEY = "uet_chatbot_history_sender_id";

function hasStorage() {
  return typeof window !== "undefined" && window.localStorage;
}

export function createSenderId() {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `demo_${time}_${random}`;
}

export function getPersistedSenderId() {
  if (!hasStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_SENDER_ID_KEY);
}

export function persistSenderId(senderId) {
  if (!senderId) {
    return;
  }

  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(ACTIVE_SENDER_ID_KEY, senderId);
}

export function getPersistedHistorySenderId() {
  if (!hasStorage()) {
    return null;
  }

  return window.localStorage.getItem(HISTORY_SENDER_ID_KEY);
}

export function persistHistorySenderId(senderId) {
  if (!senderId) {
    return;
  }

  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(HISTORY_SENDER_ID_KEY, senderId);
}

export function getOrCreateSenderId() {
  const existing = getPersistedSenderId();

  if (existing) {
    return existing;
  }

  const next = createSenderId();
  persistSenderId(next);
  return next;
}
