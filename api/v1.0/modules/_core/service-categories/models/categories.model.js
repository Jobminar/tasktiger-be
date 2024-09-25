 import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageKey: { type: String, required: true },
  uiVariant: [{ type: String, required: true }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
