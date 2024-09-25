const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller.js");

router.post("/send-message", chatController.sendMessage);

// Add other routes for fetching chat history, etc.

module.exports = router;
