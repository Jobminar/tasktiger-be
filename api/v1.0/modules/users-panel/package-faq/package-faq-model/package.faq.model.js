import mongoose from "mongoose";

const packageFaq = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String,required:true},
  },
  { timestamps: true }
);
export default mongoose.model("PackageFaq", packageFaq);
