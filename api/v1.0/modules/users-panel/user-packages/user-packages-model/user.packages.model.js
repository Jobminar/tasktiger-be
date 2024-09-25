import mongoose from "mongoose";
import moment from "moment";

const userPackageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageName: { type: String, required: true },
  priceRs: { type: Number, required: true },
  validity: { type: String, required: true }, // e.g., "30 days"
  discount: { type: Number, required: true },
  comments: { type: String, required: true },
  description: { type: String, required: true },
  expiryDate: { type: Date }, // Expiry date calculated based on validity
  status: { type: String, default: "active" }, // Active or Expired
  paymentId: { type: String, required: true }
});

// Pre-save middleware to calculate expiry date based on validity
userPackageSchema.pre('save', function (next) {
  const userPackage = this;

  // Calculate expiry date from the validity period (e.g., "30 days")
  if (userPackage.validity) {
    const days = parseInt(userPackage.validity.split(' ')[0], 10);
    userPackage.expiryDate = moment().add(days, 'days').toDate();
  }
  next();
});

export default mongoose.model("UserPackage", userPackageSchema);
