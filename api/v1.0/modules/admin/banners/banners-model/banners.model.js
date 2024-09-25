import mongoose from "mongoose";

const bannersSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  service: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  bannerType: {
    type: String,
    enum: ["mostbooked", "appliance", "ourpopular"],
    required: true,
  },
},{
  timestamps:true
}

);

export default mongoose.model("Banners", bannersSchema);
