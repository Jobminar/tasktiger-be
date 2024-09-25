import mongoose from "mongoose";
import moment from "moment";

const packageSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
  image: { type: String, required: true },
  packageName: { type: String, required: true },
  priceRs: { type: Number, required: true },
  discountPlatformCom: { type: Number, required: true },
  comments: { type: String, required: true },
  noOfJobOffers: { type: Number, required: true },
  status: { type: String, default: "active" }, // Active or Expired
  expiryDate: { type: Date }, // Changed to Date type
  validity: { type: String }, // Add validity field for expiration calculation
});

// Pre-save middleware to calculate expiry date based on validity
packageSchema.pre('save', function (next) {
  const userPackage = this;

  // Calculate expiry date from the validity period (e.g., "30 days")
  if (userPackage.validity) {
    const days = parseInt(userPackage.validity.split(' ')[0], 10);
    if (!isNaN(days)) {
      userPackage.expiryDate = moment().add(days, 'days').toDate();
    }
  }
  next();
});

export default mongoose.model("ProviderPackage", packageSchema);
