import { Schema, model } from "mongoose";

const subadminSchema = new Schema({
  fullName:{type:String,required:true},
  mobileNo:{type:String,required:true},
  emailforCommunication:{type:String,required:true},
  loginEmailId:{type:String,required:true},
  password:{type:String,required:true},
  dob:{type:String,required:true},
  aadharNumber:{type:Number,required:true},
  pan:{type:String,required:true},
  designation:{type:String,required:true},
  experience:{type:String,required:true},
  addressWithPincode:{type:String,required:true},
  servingLocations:{type:String,required:true},
  accountName:{type:String,required:true},
  accountNumber:{type:Number,required:true},
  bankName:{type:String,required:true},
  ifscCode:{type:String,required:true},
  branchName:{type:String,required:true},
  branchAddress:{type:String,required:true},
  image:{type:String,required:true},
  documents:[{type:String,required:true}]
});

const Subadmin = model("Subadmin", subadminSchema);
export default Subadmin;
