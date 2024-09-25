import mongoose from "mongoose";

const servicesSchema = new mongoose.Schema({
  image: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
    required: true,
  },
  variantName: { type: String,
   required: true 
  },
isMostBooked:{
  type:Boolean,
  default:false
}
}, {
  timestamps: true
});

export default mongoose.model("Service", servicesSchema);
