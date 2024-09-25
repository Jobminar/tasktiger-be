// models/provider.details.model.js
import mongoose from "mongoose";

const providerDetailsSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  image: { type: String, required: true },
  age: { type: String, required: true },
  pincode: { type: String, required: true },
  radius: { type: Number, required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true},
  gender: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  isVerified: { type: Boolean, default: false, required: true }
});

const ProviderDetails = mongoose.model("ProviderDetails", providerDetailsSchema);

export default ProviderDetails;
