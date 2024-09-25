import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true, required: false },
  name: { type: String, required: false },
  displayName: { type: String, required: false },
  image: { type: String, required: false },
  phone: { type: Number, required: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  otp: { type: Number, required: false },
  gender: { type: String, enum: ["male", "female", "others"], required: false },
  dateOfBirth: { type: String, required: false },
  city: { type: String, required: false }
}, 
{
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;
