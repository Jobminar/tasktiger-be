import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const userPromotionsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subTitle: {
    type: String,
    required: true,
    trim: true,
  },
  descriptionHeading: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  validity: {
    type: Date,
    required: true,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validTill: {
    type: Date,
    required: true,
  },
  notifyUsers: {
    type: Boolean,
    default: false,
  },
  minCartValue: { // Updated to camelCase
    type: Number,
    required: true,
  },
  couponCode: {
    type: String,
    default: function() {
      return uuidv4(); // Auto-generate a coupon code if not provided
    },
  },
  comments: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model("UserPromotions", userPromotionsSchema);
