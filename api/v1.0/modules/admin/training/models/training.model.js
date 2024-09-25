import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service', // Corrected reference name
      required: true,
    },
    quickLinks: {
      type: Boolean,
      required: true,
      trim: true,
    },
    skip: {
      type: Boolean,
      default: false, // Set a default value for optional fields
    },
    job: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    videoKey: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Training = mongoose.model("Training", trainingSchema);

export default Training;
