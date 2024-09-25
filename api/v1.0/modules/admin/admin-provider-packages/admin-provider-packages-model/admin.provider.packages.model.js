import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  image: { type: String, required: true },
  packageName: { type: String, required: true },
  priceRs: { type: Number, required: true },
  discountPlatformCom: { type: Number, required: true },
  comments: { type: String, required: true },
  noOfJobOffers: { type: Number, required: true },
});
export default mongoose.model("AdminProviderPackage", packageSchema);
