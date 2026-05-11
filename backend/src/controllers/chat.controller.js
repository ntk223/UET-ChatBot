const dialogueManager = require("../services/dialogue/dialogueManager.service");
const HttpError = require("../utils/httpError");

async function webhook(req, res, next) {
  try {
    const { sender_id: senderId, message_text: messageText, payload_value: payloadValue } =
      req.body || {};

    if (!senderId) {
      throw new HttpError("sender_id is required", 400);
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

module.exports = {
  webhook,
};
