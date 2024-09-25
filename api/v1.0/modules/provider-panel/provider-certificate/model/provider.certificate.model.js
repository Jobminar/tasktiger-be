import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  
  image: { type: String, required: true },
  
  isVerified:{type:Boolean,default:false,required:true},

  message:{type:String,required:true},

  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true }
});

const ProviderCertificate = mongoose.model('ProviderCertificate', certificateSchema);

export default ProviderCertificate;
