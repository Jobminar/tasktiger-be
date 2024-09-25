import mongoose from "mongoose";

const providerPromotionSchema = new mongoose.Schema({

  promoName:{type:String,required:true},
  serviceType: { type: String, required: true },
  cities:{type:String,required:true},
  noOfJobs: { type: Number, required: true },
  offerAmount: { type: Number, required: true },
  validFrom:{type:Date,required:true},
  validTill:{type:Date,required:true},
  notifyProviders:{ type: Boolean, default: false },
});

const ProviderPromotion = mongoose.model("ProviderPromotion", providerPromotionSchema);
export default ProviderPromotion;
