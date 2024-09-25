import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceProviderTargetsSchema = new Schema({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'ProviderAuth',
    required: true,
  },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  totalEarnings: { type: Number, default: 0 },
  upcomingEarnings: { type: Number, default: 0 },
  dailyEarnings: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  credits: { type: Number, default: 0 },
  specialRating: { type: Number, min: 0, max: 5, default: 0 },
  responseRate: { type: Number, min: 0, max: 100, default: 0 },
  cancellationRate: { type: Number, min: 0, max: 100, default: 0 },
  totalWorkingHours: { type: Number, default: 0 },
});

const Target = mongoose.model('Target', serviceProviderTargetsSchema);

export default Target;
