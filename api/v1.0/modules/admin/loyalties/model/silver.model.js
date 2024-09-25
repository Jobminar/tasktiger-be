import mongoose from "mongoose";

const silverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    amount: { type: String, required: true },
    points: { type: Number, required: true },
    minimumSpentValue: { type: String, required: true },
    discount: { type: String, required: true },
});

const Silver = mongoose.model("Silver", silverSchema);
export default Silver;
