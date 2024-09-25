import mongoose from "mongoose";

const adminUserPackage = new mongoose.Schema({
  packageName: { type: String, required: true },
  priceRs: { type: Number, required: true },
  validity: { type: String, required: true },
  discount: { type: Number, required: true },
  comments: { type: String, required: true },
  description: { type: String, required: true }
});

export default mongoose.model("AdminUserPackage", adminUserPackage);
