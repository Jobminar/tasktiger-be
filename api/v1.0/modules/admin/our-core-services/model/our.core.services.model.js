import { Schema, model } from 'mongoose';

const ourCoreSchema = new Schema({
    image: { type: String, required: true },
    serviceName: { type: String, required: true },
    description: { type: String, required: true },
    price:{type:String,required:true}
});

const OurCore = model("OurCore", ourCoreSchema);
export default OurCore;
 