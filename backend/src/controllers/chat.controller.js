const dialogueManager = require("../services/dialogue/dialogueManager.service");
const sessionStore = require("../services/state/sessionStore.service");
const HttpError = require("../utils/httpError");

async function webhook(req, res, next) {
  try {
    const { sender_id: senderId, message_text: messageText, payload_value: payloadValue } =
      req.body || {};
    const newSession = Boolean(req.body?.new_session);

    if (!senderId) {
      throw new HttpError("sender_id is required", 400);
    }

    if (newSession) {
      await sessionStore.clearSession(senderId);
    }

    const response = await dialogueManager.handleIncomingMessage({
      senderId,
      messageText,
      payloadValue,
    });

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
}

async function history(req, res, next) {
  try {
    const senderId = req.query?.sender_id;

    if (!senderId) {
      throw new HttpError("sender_id is required", 400);
    }

    const session = await sessionStore.getSession(senderId);
    const historyEntries = Array.isArray(session?.conversation_history)
      ? session.conversation_history
      : [];

    return res.status(200).json({ sender_id: senderId, history: historyEntries });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  webhook,
  history,
};
