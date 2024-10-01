import mongoose from "mongoose";

const inductionSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true, // Assuming categoryId is required
    },
    skip: {
      type: Boolean,
      default: false, // Set a default value for optional fields
    },
    profession: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    video: { 
      type: String,
      required: true,
      trim: true,
    },
    watchedVideo: { 
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }

);


export default mongoose.model("Induction", inductionSchema);
