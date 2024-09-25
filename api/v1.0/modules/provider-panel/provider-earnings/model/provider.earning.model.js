// models/Earnings.js
import mongoose from 'mongoose';

const earningsSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
  date: { type: Date, required: true }, 
  amount: { type: Number, required: true },
});

const Earnings = mongoose.model('Earnings', earningsSchema);

export default Earnings;
