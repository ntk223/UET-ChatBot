function healthCheck(req, res) {
  res.status(200).json({
    status: "ok",
    service: "uet-chatbot-backend",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  healthCheck,
};
