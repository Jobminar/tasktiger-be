import Chat from "../models/chat.model.js";
import { messaging } from "firebase-admin";
import User from "../models/user.model.js";

async function sendMessage(req, res) {
  const { senderId, recipientId, message } = req.body; // Get IDs

  try {
    // Validate sender and recipient IDs (make sure they exist)
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ error: "Sender or recipient not found." });
    }

    const newChat = new Chat({
      sender: senderId,
      recipient: recipientId,
      message,
    });

    await newChat.save();

    // Send FCM notification to recipient
    const recipientToken = await getRecipientToken(recipientId);
    await messaging().send(recipientToken, {
      notification: {
        title: `New message from ${sender.name || sender.username}`, // Use name or username if available
        body: message,
      },
    });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function fetchChatHistory(req, res) {
  const { userId1, userId2 } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 },
      ],
    })
      .populate("sender", "name username") // Populate sender details
      .populate("recipient", "name username"); // Populate recipient details

    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { sendMessage, fetchChatHistory };
