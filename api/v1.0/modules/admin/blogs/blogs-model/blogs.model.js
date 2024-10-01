import mongoose from "mongoose";

const blogsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    video: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blogs", blogsSchema);
