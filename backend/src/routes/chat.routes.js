const express = require("express");
const { webhook, history } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/webhook", webhook);
router.get("/history", history);

module.exports = router;
