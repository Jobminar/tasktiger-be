import mongoose from "mongoose";

const videoSchema=new mongoose.Schema({

    providerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ProviderAuth",
        required:true
    },
    isWatched:{
        type:Boolean,
        required:true,
        default:false
    }

})
export default mongoose.model("ProviderWatched",videoSchema)