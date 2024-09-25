  import mongoose from "mongoose";

  const serviceProviderFinanceSchema =new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
    aadhaarNumber:{type:Number,unique:true,required:true},
    pan: { type: String, unique: true, required: true },
    gst: { type: String, unique: true, required: false },
    accountName: { type: String, required: true },
    accountNumber:{type:Number,required:true},
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    branch: { type: String, required: true },
    documents:[{type:String,required:false}]
  });

  const Finance = mongoose.model("Finance", serviceProviderFinanceSchema);
  export default Finance;
