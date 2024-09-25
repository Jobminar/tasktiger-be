import mongoose from "mongoose";

const { Schema, model } = mongoose;

const dateSchema = new Schema({
    service:{type:String,required:true},
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderAuth', required: true },
    date: {type: Date, required: true},
    work: {type: Boolean,required: true,default: false},
    time: {type: String,required: false},
  },
  {
    timestamps: true,
  }
);

const ProviderDate = model("ProviderDate", dateSchema);

export default ProviderDate;
