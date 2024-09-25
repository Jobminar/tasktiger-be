import mongoose from "mongoose";

const tierSchema = new mongoose.Schema({
    tierName: { type: String, required: true },
    locationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true }]
});

export default mongoose.model("Tier", tierSchema);
