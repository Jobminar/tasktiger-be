import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
});

const UserToken = mongoose.model("UserToken", userTokenSchema);

export default UserToken;
