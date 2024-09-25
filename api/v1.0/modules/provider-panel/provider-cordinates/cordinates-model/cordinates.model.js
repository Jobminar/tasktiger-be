import mongoose from "mongoose";

const cordinatesSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' }
    }
  });
  
  const Cordinates=mongoose.model("Cordinates",cordinatesSchema)
  Cordinates.collection.createIndex({ "location.coordinates": "2dsphere" })
  .then(() => {
    console.log('Indexes created');
  }).catch(err => {
    console.error('Error creating indexes:', err);
  });
export default Cordinates