import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
 
  items: [
    {
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
      subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true },
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
      quantity: { type: Number, required: false, min: 1 },
      image: { type: String, required: false },
      price:{type:Number,required:false },
    },

  ],
},{timestamps:true}
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
