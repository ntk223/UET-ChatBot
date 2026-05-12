function parsePayload(payloadValue) {
  if (!payloadValue || typeof payloadValue !== "string") {
    return { intent: null, entities: {}, payloadKey: null };
  }

  const payload = payloadValue.trim();

  if (!payload.startsWith("/")) {
    return { intent: null, entities: {}, payloadKey: payload };
  }

  const match = payload.match(/^\/([a-zA-Z0-9_]+)(\{.*\})?$/);

  if (!match) {
    return { intent: null, entities: {}, payloadKey: payload };
  }

  let entities = {};

  if (match[2]) {
    try {
      entities = JSON.parse(match[2]);
    } catch (error) {
      entities = {};
    }
  }

  return {
    intent: match[1],
    entities,
    payloadKey: match[1],
  };
}

module.exports = {
  parsePayload,
};
