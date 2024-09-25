import mongoose from "mongoose";

const popularSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  image: { type: String, required: true },
});
export default mongoose.model("OurPopularService", popularSchema);  
