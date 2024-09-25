import { Schema, model } from "mongoose";

const chatSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId, // Use ObjectId for references
    ref: "User", // Reference to the User model (or create a separate ServiceProvider model if needed)
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User", // Or 'ServiceProvider' if applicable
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Chat = model("Chat", chatSchema);

export default Chat;
