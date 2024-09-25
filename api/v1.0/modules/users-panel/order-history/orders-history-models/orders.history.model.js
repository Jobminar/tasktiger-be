import mongoose from "mongoose";

const ordersHistorySchema = new mongoose.Schema(

  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
  },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderAuth",
      required: true,
    },
    reason: { type: String, required: false },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "InProgress",
        "Cancelled",
        "Completed",
        "Paid",
        "Refund",
      ],
      default: "Pending",
    },
    otp: {
      type: Number,
      required: false,
    },
    otpExpiry: {
      type: Date,
      required: false,
    },
    image:{type:String,required:false}
  },
  {
    timestamps: true,
  }
);

const OrdersHistory = mongoose.model("OrdersHistory", ordersHistorySchema);

export default OrdersHistory;
