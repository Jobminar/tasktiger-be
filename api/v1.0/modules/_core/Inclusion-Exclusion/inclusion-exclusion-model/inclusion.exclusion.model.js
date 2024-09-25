import mongoose from 'mongoose';

const inclusionExclusionSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  bannerImage: {
    type: String,
    required: true,
  },
  featureTitle: {
    type: String,
    required: true,
  },
  listOfItems: [
    {
      title: {
        type: String,
        required: true,
      },
      iconImage: {
        type: String,
        required: true,
      },
    },
  ],
  exclusions: [{type: String,required: true}],
  description: {  
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('InclusionExclusion', inclusionExclusionSchema);
