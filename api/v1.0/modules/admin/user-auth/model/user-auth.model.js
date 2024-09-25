import mongoose from "mongoose";

const peopleSchema=new mongoose.Schema({
name:  {type:String,required:true},
mobile:{type:Number,required:true},
location:{type:String,required:true},
pincode:{type:Number,required:true},
email:{type:String,required:true},
address:{type:String,required:true},
})
const People=model.mongoose("People",peopleSchema)
export default People