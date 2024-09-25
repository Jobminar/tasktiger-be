import { Schema, model } from "mongoose";

const providerSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
});

const ProviderBanner = model("ProviderBanner", providerSchema);
export default ProviderBanner;
