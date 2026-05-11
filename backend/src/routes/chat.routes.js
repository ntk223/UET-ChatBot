const express = require("express");
const { webhook } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/webhook", webhook);

module.exports = router;
