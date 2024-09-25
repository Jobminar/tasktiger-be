import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ProviderAuth", 
    required: true,
    unique: true 
  },
  token: { 
    type: String, 
    required: true 
  }
}, { timestamps: true }); 

const ProviderToken = mongoose.model("ProviderToken", tokenSchema);

export default ProviderToken