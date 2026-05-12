function shouldResetHistory({ messageText, payloadContext, intent }) {
  const trimmed = (messageText || "").trim();
  if (trimmed) {
    return false;
  }

  const payloadKey = payloadContext?.payloadKey;
  const payloadIntent = payloadContext?.intent;

  return intent === "greet" || payloadKey === "greet" || payloadIntent === "greet";
}

module.exports = {
  shouldResetHistory,
};
