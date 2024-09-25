import mongoose from "mongoose";

const userPromotionSchema = new mongoose.Schema({
  promoName: { type: String, required: true },
  userType: [{type: String,required: true,}],
  offerPercentage: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validTill: { type: Date, required: true },
  notifyUsers: { type: Boolean, default: false },
  serviceType:{type:String,required:true}
});

const UserPromotion = mongoose.model("UserPromotion", userPromotionSchema);
export default UserPromotion;
