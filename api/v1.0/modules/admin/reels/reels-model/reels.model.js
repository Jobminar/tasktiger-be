import mongoose from "mongoose";

const reelsSchema = new mongoose.Schema({
    
    image:{type:String,required:true},

    video: { type: String, required: true }
});

const Reel = mongoose.model("Reel", reelsSchema);

export default Reel;
