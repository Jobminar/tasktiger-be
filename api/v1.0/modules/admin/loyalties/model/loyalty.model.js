import mongoose from 'mongoose';

const loyaltySchema = new mongoose.Schema({
  name: {type: String, required: true },
  image: { type: String, required: true },
  amount: { type: String, required: true },
  points: { type: Number, required: false },
  minimumSpentValue: { type: String, required: true },
  discount: { type: String, required: true },
});

export default mongoose.model('Loyalty', loyaltySchema);
