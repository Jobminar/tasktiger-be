import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: false,
    },
    pincode: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },
    subcategory: {
      type: String,
      required: false,
    },
    servicename: {
      type: String,
      required: false,
    },
    price: {
      type: Map,
      of: String,
      default: {},
    },
    min: {
      type: Number,
      required: false,
    },
    max: {
      type: Number,
      required: false,
    },
    metric: {
      type: String,
      required: false,
    },
    creditEligibility: {
      type: Boolean,
      default: false,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    miscFee: {
      type: Number,
      required: false,
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    isCash: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    offerPrice:{
      type: Map,
      of: String,
      default: {},
    }

  },
  { timestamps: true },
);

export default mongoose.model("Location", LocationSchema);
