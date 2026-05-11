function createId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeButtons(buttons) {
  if (!Array.isArray(buttons)) {
    return [];
  }

  return buttons
    .filter((button) => button && (button.title || button.payload))
    .map((button) => ({
      title: String(button.title || "Select"),
      payload: button.payload || null,
    }));
}

export function createMessage({ from, text, buttons }) {
  return {
    id: createId(),
    from,
    text,
    buttons: normalizeButtons(buttons),
    timestamp: new Date().toISOString(),
  };
}
