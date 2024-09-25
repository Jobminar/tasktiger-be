import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageKey: { type: String, required: true },
  variantName:{type:String,required:true},
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

export default mongoose.model("Subcategory", subcategorySchema);
