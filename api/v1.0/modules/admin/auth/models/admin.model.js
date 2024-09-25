import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  otp: { type: String }, // Added for storing OTP
  otpExpiresAt: { type: Date }, // Added for storing OTP expiration time
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
