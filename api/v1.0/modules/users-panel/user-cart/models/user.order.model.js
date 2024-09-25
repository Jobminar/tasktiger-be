import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  addressId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Address", 
    required: true 
  },
  paymentId: {
    type: String, 
    required: true 
  },
  categoryIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", 
    required: true 
  }],
  subCategoryIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Subcategory", 
    required: true 
  }],
  otp: {
    type: String, 
    required: false 
  },

  items: [
    { 
      serviceId: { 
        type: mongoose.Schema.Types.ObjectId,  ref: "Service", 
        required: true 
      },
      categoryId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
      },
      subCategoryId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true 
      },
      selectedDate: { 
        type: String, 
        required: true 
      },
      selectedTime: { 
        type: String, 
        required: true 
      },
      selectedMonth: { 
        type: String, 
        required: true 
      },
      scheduledDate: { 
        type: String, 
        required: true 
      }
    }
  ]
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
