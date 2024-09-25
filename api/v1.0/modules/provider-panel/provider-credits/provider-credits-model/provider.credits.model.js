import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const penaltySchema = new mongoose.Schema({
  penaltyAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const creditsSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
  credits: { type: Number, required: true },
  amount: { type: Number, required: true },
  penalties: [penaltySchema], // Array of penalties
  expenses: [expenseSchema], // Array of expenses
},
{timestamps:true}
);

const Credits = mongoose.model("Credits", creditsSchema);
export default Credits;
