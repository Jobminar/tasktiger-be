// models/provider.model.js
import { Schema, model } from "mongoose";

const serviceProviderSchema = new Schema({
  phoneNo: { type: String, required: true, unique: true },
  aadharNo: { type: String, unique: true },
  fullName: { type: String, required: true },
  workDetails: [{ type: String, required: true }],
  pincode: { type: String, required: true }, 
  experienceStatus: {
    type: String,
    enum: ["Experienced", "Fresher"],
    required: true,
  },
  age: { type: Number, required: true },
  workExperience: { type: Number, required: true },
});

const ServiceProvider = model("ServiceProvider", serviceProviderSchema);

export default ServiceProvider;
